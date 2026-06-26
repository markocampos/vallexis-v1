# RUNBOOK.md — Operational Runbook

> **Version:** 0.1.0
> **Last Updated:** June 23, 2026
> **On-call contact:** `oncall@vallexis.io` · Slack `#alerts`

---

## Table of Contents

1. [Quick Reference](#quick-reference)
2. [Common Operations](#common-operations)
3. [Incident Response](#incident-response)
4. [Diagnostic Commands](#diagnostic-commands)
5. [Scaling Playbook](#scaling-playbook)
6. [Post-Mortem Template](#post-mortem-template)

---

## Quick Reference

### Service Status Check

```bash
# All containers at a glance
docker compose ps

# Individual health endpoints
curl -sf http://localhost:3000/api/health | jq .   # api-gateway
curl -sf http://localhost:3001/health | jq .        # deploy-service
curl -sf http://localhost:3002/health | jq .        # payment-service
curl -sf http://localhost:3003/health | jq .        # seo-service

# Resource usage snapshot
docker stats --no-stream
free -h && df -h /
```

### View Logs

```bash
# Follow a specific service (last 100 lines)
docker compose logs --tail=100 -f api-gateway
docker compose logs --tail=100 -f deploy-service
docker compose logs --tail=100 -f payment-service
docker compose logs --tail=100 -f seo-service

# All services together
docker compose logs --tail=50 -f

# Caddy access/error logs
tail -100f /var/log/caddy/access.log
tail -100f /var/log/caddy/error.log

# Filter by log level
docker compose logs api-gateway | grep -iE "error|fatal|panic"
```

### Emergency Contacts

| Who | Contact | When |
|---|---|---|
| Engineering Lead | `oncall@vallexis.io` | Any P0/P1 |
| PayMongo Support | https://dashboard.paymongo.com/support | Payment issues |
| OCI Support | https://cloud.oracle.com/support | Infrastructure issues |
| Cloudflare Support | https://dash.cloudflare.com/support | DNS/WAF issues |

---

## Common Operations

### Manual Deploy Trigger

```bash
PROJECT_ID="proj_abc123"
curl -X POST http://localhost:3001/api/internal/deploy \
  -H "Authorization: Bearer $INTERNAL_SECRET" \
  -H "Content-Type: application/json" \
  -d "{\"project_id\": \"$PROJECT_ID\", \"force\": true}"

# Watch deploy logs in real time
docker compose logs -f deploy-service | grep "$PROJECT_ID"
```

### Roll Back a Deploy

```bash
PROJECT_ID="proj_abc123"
PREVIOUS_IMAGE="vallexis-proj-abc123:dep_xyz789"

# Stop current container
docker stop vallexis-proj-$PROJECT_ID

# Start previous image
docker run -d \
  --name vallexis-proj-$PROJECT_ID \
  --restart unless-stopped \
  $PREVIOUS_IMAGE

# Update deploy record in DB
docker exec vallexis-postgres psql -U vallexis -d vallexis_db \
  -c "UPDATE deploys SET status='rolled_back' WHERE project_id='$PROJECT_ID' AND status='success' ORDER BY created_at DESC LIMIT 1;"

echo "Rollback complete. Verify: curl https://$(docker exec vallexis-postgres psql -U vallexis -d vallexis_db -tAc "SELECT subdomain FROM projects WHERE id='$PROJECT_ID';").vallexis.io"
```

### Database Backup (Manual)

```bash
BACKUP_FILE="/data/backups/manual_$(date +%Y%m%d_%H%M%S).sql.gz"

# Dump and compress
docker exec vallexis-postgres pg_dump -U vallexis vallexis_db | gzip > "$BACKUP_FILE"

# GPG encrypt
gpg --recipient backup@vallexis.io --encrypt "$BACKUP_FILE"
rm "$BACKUP_FILE"  # Remove unencrypted copy

echo "Backup saved: ${BACKUP_FILE}.gpg"

# Verify integrity
gpg --decrypt "${BACKUP_FILE}.gpg" | gunzip | psql -U vallexis -d /dev/null -c "SELECT 1" \
  && echo "✅ Backup valid" || echo "❌ BACKUP CORRUPT"
```

### Database Restore

> ⚠️ **WARNING:** This overwrites all current data. Stop all API services first.

```bash
BACKUP_FILE="/data/backups/manual_20260622_120000.sql.gz.gpg"

# 1. Stop API services (keep DB running)
docker compose stop api-gateway deploy-service payment-service seo-service

# 2. Decrypt
gpg --decrypt "$BACKUP_FILE" | gunzip > /tmp/restore.sql

# 3. Drop and recreate DB
docker exec vallexis-postgres psql -U vallexis -c "DROP DATABASE vallexis_db;"
docker exec vallexis-postgres psql -U vallexis -c "CREATE DATABASE vallexis_db;"

# 4. Restore
docker exec -i vallexis-postgres psql -U vallexis -d vallexis_db < /tmp/restore.sql
rm /tmp/restore.sql

# 5. Restart services
docker compose start api-gateway deploy-service payment-service seo-service

# 6. Verify
sleep 5
curl -sf http://localhost:3000/api/health | jq .
```

### User Management

```bash
# List recent users
docker exec vallexis-postgres psql -U vallexis -d vallexis_db \
  -c "SELECT id, email, plan, created_at FROM users WHERE deleted_at IS NULL ORDER BY created_at DESC LIMIT 20;"

# Upgrade user to Pro manually (e.g., for support cases)
USER_EMAIL="user@example.com"
docker exec vallexis-postgres psql -U vallexis -d vallexis_db \
  -c "UPDATE users SET plan='pro' WHERE email='$USER_EMAIL' AND deleted_at IS NULL;"

# Reset user password
NEW_HASH=$(docker exec vallexis-api-gateway ./api-gateway -hash-password "TempPass123!")
docker exec vallexis-postgres psql -U vallexis -d vallexis_db \
  -c "UPDATE users SET password_hash='$NEW_HASH' WHERE email='$USER_EMAIL';"
echo "Password reset. Notify user to change on next login."

# Soft-delete a user (GDPR erasure request)
docker exec vallexis-postgres psql -U vallexis -d vallexis_db \
  -c "UPDATE users SET deleted_at=NOW() WHERE email='$USER_EMAIL';"
echo "User soft-deleted. Data will be purged in 30 days by the cleanup agent."
```

### SSL Certificate Status

```bash
# Check certificate expiry (all domains)
echo | openssl s_client -connect vallexis.io:443 2>/dev/null | openssl x509 -noout -dates

# Force manual renewal
docker exec vallexis-caddy caddy reload --config /etc/caddy/Caddyfile
echo "Caddy reloaded — check logs for renewal status"
docker compose logs --tail=20 caddy | grep -i "renew\|certificate"
```

### Redis Cache Management

```bash
# Inspect memory usage
docker exec vallexis-redis redis-cli INFO memory | grep used_memory_human

# Clear rate-limit counters only (safe)
docker exec vallexis-redis redis-cli KEYS "ratelimit:*" | \
  xargs -r docker exec -i vallexis-redis redis-cli DEL
echo "Rate limits cleared"

# Clear session cache only (users will need to log in again)
docker exec vallexis-redis redis-cli KEYS "session:*" | \
  xargs -r docker exec -i vallexis-redis redis-cli DEL
echo "Sessions cleared — all users logged out"

# Clear ALL cache (⚠️ causes session invalidation)
docker exec vallexis-redis redis-cli FLUSHALL
echo "⚠️ Redis fully cleared"
```

### Docker Cleanup

```bash
# Safe: remove dangling images only
docker image prune -f

# Safe: remove old build caches (>7 days)
docker builder prune -f --filter "until=168h"

# ⚠️ DANGEROUS: removes stopped containers too
docker system prune -f --volumes
```

---

## Incident Response

### Severity Matrix

| Level | Definition | Response Time | Example |
|---|---|---|---|
| **P0** | Active breach or data exfiltration | ≤15 minutes | DB leaked to internet |
| **P1** | Full service outage, all users affected | ≤1 hour | All containers down |
| **P2** | Partial degradation, some features broken | ≤4 hours | Deploy service down |
| **P3** | Minor issue, workaround available | ≤24 hours | Minor UI bug |

---

### P0 — Active Breach / Data Exfiltration

```bash
# ─────────────────────────────────────────────
# STEP 1: ISOLATE IMMEDIATELY
# ─────────────────────────────────────────────
ufw deny 80/tcp && ufw deny 443/tcp
echo "$(date): P0 INCIDENT — PUBLIC ACCESS DISABLED" >> /var/log/vallexis/incidents.log

# ─────────────────────────────────────────────
# STEP 2: PRESERVE EVIDENCE (do NOT restart yet)
# ─────────────────────────────────────────────
INCIDENT_DIR="/data/incidents/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$INCIDENT_DIR"
docker compose logs > "$INCIDENT_DIR/all_logs.txt"
cp -r /var/log/caddy/ "$INCIDENT_DIR/"
docker exec vallexis-postgres pg_dump -U vallexis vallexis_db > "$INCIDENT_DIR/db_snapshot.sql"

# ─────────────────────────────────────────────
# STEP 3: NOTIFY ON-CALL
# ─────────────────────────────────────────────
echo "P0 SECURITY INCIDENT — Vallexis public access disabled. Investigate immediately." | \
  mail -s "⚠️ P0: Security Incident" oncall@vallexis.io

# ─────────────────────────────────────────────
# STEP 4: INVESTIGATE
# ─────────────────────────────────────────────
# Any unexpected containers?
docker ps -a | grep -v "vallexis-"

# Recent admin actions
docker exec vallexis-postgres psql -U vallexis -d vallexis_db \
  -c "SELECT * FROM audit_log ORDER BY created_at DESC LIMIT 100;"

# Recent auth events
docker exec vallexis-postgres psql -U vallexis -d vallexis_db \
  -c "SELECT user_id, action, ip_address, created_at FROM audit_log WHERE action LIKE 'auth.%' ORDER BY created_at DESC LIMIT 50;"

# ─────────────────────────────────────────────
# STEP 5: DO NOT restore public access until investigation is complete
# ─────────────────────────────────────────────
echo "When resolved: ufw allow 80/tcp && ufw allow 443/tcp"
```

---

### P1 — Full Service Outage

```bash
# STEP 1: Diagnose
docker compose ps
docker compose logs --tail=50
free -h && df -h /

# STEP 2: Attempt graceful restart
docker compose restart

# STEP 3: Verify after 15 seconds
sleep 15
curl -sf http://localhost:3000/api/health | jq . && echo "✅ API gateway OK" || echo "❌ Still down"

# STEP 4: If restart fails — full recreate
docker compose down
docker compose up -d

# STEP 5: If PostgreSQL is the issue
docker compose restart postgres
echo "Waiting for PostgreSQL to be ready..."
for i in $(seq 1 18); do
  docker exec vallexis-postgres pg_isready -U vallexis && break
  echo "  Attempt $i/18 — sleeping 5s..."
  sleep 5
done
docker compose restart api-gateway deploy-service payment-service seo-service

# STEP 6: If disk is full (common cause)
df -h /
# Free space: remove old Docker artifacts
docker system prune -f
docker image prune -a -f --filter "until=48h"

# STEP 7: Update status page
echo "Incident started at $(date -u). Investigating. ETA: TBD." > /var/www/status/incident.txt
```

---

### P2 — Partial Service Degradation

```bash
# STEP 1: Identify the affected service
docker compose ps
curl -sf http://localhost:3000/api/health
curl -sf http://localhost:3001/health
curl -sf http://localhost:3002/health
curl -sf http://localhost:3003/health

# STEP 2: Deep-dive logs on the failing service (example: deploy-service)
docker compose logs --tail=200 deploy-service | grep -iE "error|fatal|panic|SIGKILL"

# STEP 3: Restart only the affected service
docker compose restart deploy-service

# STEP 4: Monitor for 5 minutes
docker compose logs -f --since=1m deploy-service
```

---

### P3 — Minor Issue

```bash
# STEP 1: Document the issue
echo "$(date -u): [P3] $(whoami): <description>" >> /var/log/vallexis/issues.log

# STEP 2: Apply immediate workaround if available

# STEP 3: Create a GitHub issue or add to the sprint board
echo "TODO: Link GitHub issue URL here"
```

---

## Diagnostic Commands

### ARM Architecture Verification

```bash
# Verify ARM64 environment
uname -m            # Expected: aarch64
docker info | grep Architecture  # Expected: aarch64

# Verify Go builds native ARM
docker run --rm --platform linux/arm64 golang:1.22-alpine go env GOARCH  # Expected: arm64
```

### Database Diagnostics

```bash
# Connection test
docker exec vallexis-postgres psql -U vallexis -d vallexis_db -c "SELECT version();"

# Table sizes (largest first)
docker exec vallexis-postgres psql -U vallexis -d vallexis_db -c "
  SELECT relname AS table,
         pg_size_pretty(pg_total_relation_size(relid)) AS total_size,
         pg_size_pretty(pg_relation_size(relid)) AS table_size
  FROM pg_stat_user_tables
  ORDER BY pg_total_relation_size(relid) DESC;"

# Active connections
docker exec vallexis-postgres psql -U vallexis -d vallexis_db -c "
  SELECT state, count(*) FROM pg_stat_activity GROUP BY state;"

# Long-running queries (>5 seconds)
docker exec vallexis-postgres psql -U vallexis -d vallexis_db -c "
  SELECT pid, now() - query_start AS duration, query
  FROM pg_stat_activity
  WHERE state = 'active' AND now() - query_start > interval '5 seconds'
  ORDER BY duration DESC;"

# Slow query analysis (requires pg_stat_statements extension)
docker exec vallexis-postgres psql -U vallexis -d vallexis_db -c "
  SELECT query, mean_exec_time::int AS avg_ms, calls
  FROM pg_stat_statements
  WHERE mean_exec_time > 100
  ORDER BY mean_exec_time DESC LIMIT 10;"

# Lock contention
docker exec vallexis-postgres psql -U vallexis -d vallexis_db -c "
  SELECT blocked_activity.query AS blocked_query,
         blocking_activity.query AS blocking_query
  FROM pg_stat_activity AS blocked_activity
  JOIN pg_stat_activity AS blocking_activity
    ON blocking_activity.pid = ANY(pg_blocking_pids(blocked_activity.pid))
  WHERE cardinality(pg_blocking_pids(blocked_activity.pid)) > 0;"
```

### Network Diagnostics

```bash
# External service reachability
curl -sf https://api.paymongo.com/v1 && echo "PayMongo: ✅" || echo "PayMongo: ❌"
curl -sf https://api.github.com && echo "GitHub: ✅" || echo "GitHub: ❌"
curl -sf https://sendgrid.api.com/v3/mail/send -o /dev/null && echo "SendGrid: ✅" || echo "SendGrid: ❌"

# DNS resolution
dig +short vallexis.io
dig +short api.paymongo.com

# Certificate details
openssl s_client -connect vallexis.io:443 -servername vallexis.io </dev/null 2>/dev/null | \
  openssl x509 -noout -subject -dates -issuer

# Listening ports
ss -tlnp | grep -E ':(80|443|3000|3001|3002|3003|5432|6379|9000)'
```

### Deploy Service Diagnostics

```bash
# List all running user containers
docker ps --filter "name=vallexis-proj-" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Memory usage by user container
docker stats --no-stream --filter "name=vallexis-proj-" \
  --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}"

# Inspect a specific project container
PROJECT_ID="proj_abc123"
docker inspect vallexis-proj-$PROJECT_ID | jq '.[0].State'

# View project container logs
docker logs vallexis-proj-$PROJECT_ID --tail=100 -f
```

---

## Scaling Playbook

Vallexis runs on a single node. When approaching resource limits, take the following steps **in order** before considering horizontal scaling.

### Step 1 — Optimise Existing Resources

```bash
# Identify memory hogs
docker stats --no-stream --format "table {{.Name}}\t{{.MemUsage}}\t{{.MemPerc}}" | sort -k3 -rh

# Tune PostgreSQL shared_buffers (recommended: 25% of RAM)
# Edit /etc/postgresql/16/main/postgresql.conf or Docker env:
# shared_buffers = 3GB (for 12 GB instance)
# effective_cache_size = 9GB
# work_mem = 64MB

# Tune Redis maxmemory
docker exec vallexis-redis redis-cli CONFIG SET maxmemory 1gb
docker exec vallexis-redis redis-cli CONFIG SET maxmemory-policy allkeys-lru
```

### Step 2 — Upgrade OCI Instance

OCI allows live shape changes for the Always Free A1 tier (up to 4 OCPU / 24 GB RAM):

1. Log into OCI Console → Compute → Instances.
2. Stop instance (30s maintenance window).
3. Edit shape: increase OCPU to 4, RAM to 24 GB.
4. Start instance.
5. Run `free -h && nproc` to verify.

### Step 3 — Separate Database to a Dedicated Node

If DB is the bottleneck:
1. Provision a second OCI A1 instance.
2. Migrate PostgreSQL via `pg_dump` / restore.
3. Update `DATABASE_URL` environment variables in all services.
4. Enable connection pooling via PgBouncer.

### Step 4 — Horizontal App Scaling (2027+)

When single-node is genuinely insufficient:
- Introduce a load balancer (OCI Load Balancer or Caddy upstream).
- Move Redis to a managed service (OCI Cache / Upstash).
- Move PostgreSQL to OCI Database Service.
- Deploy app services across multiple nodes.

---

## Post-Mortem Template

Complete within **48 hours** of any P0 or P1 incident resolution.

```markdown
## Incident Post-Mortem

**Incident ID:** INC-YYYYMMDD-XXX
**Severity:** P0 / P1
**Date:** YYYY-MM-DD
**Duration:** X hours Y minutes
**Impact:** Z users affected, approx $X revenue impact

---

### Timeline

| Time (UTC) | Event |
|---|---|
| HH:MM | Incident first detected (source: alert / user report / manual) |
| HH:MM | On-call engineer paged |
| HH:MM | War room opened in Slack #incident-YYYYMMDD |
| HH:MM | Root cause hypothesis formed |
| HH:MM | Mitigation applied |
| HH:MM | Services restored, monitoring confirmed stable |
| HH:MM | Incident closed |

---

### Root Cause

[Detailed technical explanation of what failed and why.]

---

### Why It Happened

[Contributing factors: process gaps, missing alerts, untested code paths, etc.]

---

### What Went Well

- [Things that helped: good runbook steps, fast detection, etc.]

---

### What Could Be Improved

- [Things that slowed resolution or made it worse.]

---

### Action Items

| # | Action | Owner | Due |
|---|---|---|---|
| 1 | [Specific fix or process change] | [Name] | YYYY-MM-DD |
| 2 | [Add alert for X] | [Name] | YYYY-MM-DD |
| 3 | [Update runbook with new step] | [Name] | YYYY-MM-DD |
```
