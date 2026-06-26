# DISASTER-RECOVERY.md — Disaster Recovery Plan

> **Version:** 0.1.0
> **Last Updated:** June 23, 2026
> **Review Schedule:** Quarterly

This document defines recovery objectives, playbooks, and procedures for recovering Vallexis from catastrophic failures.

---

## Table of Contents

1. [Recovery Objectives](#recovery-objectives)
2. [Backup Inventory](#backup-inventory)
3. [Scenario Playbooks](#scenario-playbooks)
4. [Recovery Procedures](#recovery-procedures)
5. [DR Testing](#dr-testing)

---

## Recovery Objectives

| Metric | Target | Notes |
|---|---|---|
| **RTO** (Recovery Time Objective) | 30 minutes (P0) | Maximum downtime before recovery is complete |
| **RPO** (Recovery Point Objective) | 24 hours | Maximum data loss (daily backup cadence) |
| **MTTR** (Mean Time To Repair) | 15 minutes | Average time to detect + fix non-catastrophic issues |

### Severity Classification

| Severity | Description | RTO | Response |
|---|---|---|---|
| P0 | Full platform outage — all services unreachable | 30 min | Immediate — all hands |
| P1 | Single service down — partial outage | 15 min | On-call engineer |
| P2 | Degraded performance — slow responses | 30 min | On-call engineer |
| P3 | Non-critical failure — logging, metrics | 4 hours | Next business day |

---

## Backup Inventory

### What's Backed Up

| Data | Method | Frequency | Retention | Storage |
|---|---|---|---|---|
| PostgreSQL database | `pg_dump` + gzip + GPG | Daily 03:00 UTC | 7 daily, 4 weekly, 6 monthly | OCI Object Storage |
| MinIO object storage | `mc mirror` | Daily 03:30 UTC | 7 daily | OCI Object Storage |
| Configuration files | Git | Every commit | Indefinite | GitHub |
| Docker images | Registry | Every build | Last 10 tags | Docker Hub / GHCR |

### Backup Verification

The `backup-verify` agent runs daily at 04:00 UTC:

1. Downloads latest backup from OCI Object Storage
2. Runs `gunzip -t` to verify archive integrity
3. Restores to a temporary database
4. Verifies row counts match production
5. Alerts if verification fails

### Backup Locations

| Item | Location | Access |
|---|---|---|
| Database backups | OCI Object Storage `vallexis-backups` bucket | `ubuntu@<SERVER_IP>` via SSH |
| GPG key | OCI Vault (KMS) | `backup@vallexis.io` |
| Encryption passphrase | OCI Vault (KMS) | `backup@vallexis.io` |

---

## Scenario Playbooks

### Scenario 1: Full Server Loss

**Trigger:** OCI instance destroyed, hardware failure, or unrecoverable corruption.

**Impact:** Complete platform outage. All user data at risk.

**Recovery time:** 30-60 minutes

**Playbook:**

```
1. DETECT
   └── uptime-pulse: all services down for > 3 consecutive checks
   └── Alert: Slack #alerts + email oncall@vallexis.io

2. ASSESS
   └── Is the OCI instance accessible? ssh ubuntu@<IP>
   └── If no: proceed to full recovery
   └── If yes: diagnose and attempt repair first

3. PROVISION NEW INSTANCE
   └── OCI Console → Compute → Create Instance
   └── Shape: VM.Standard.A1.Flex (2 OCPU, 12 GB RAM)
   └── Image: Ubuntu 24.04 aarch64
   └── Note new public IP

4. CONFIGURE BASE
   └── SSH into new instance
   └── Install Docker (curl -fsSL https://get.docker.com | sudo sh)
   └── Install Docker Compose
   └── sudo usermod -aG docker $USER && newgrp docker

5. RESTORE SECRETS
   └── Download GPG key from OCI Vault
   └── Clone vallexis repo
   └── Restore .env from backup or OCI Vault
   └── Restore JWT keys from OCI Vault

6. DEPLOY APPLICATION
   └── git clone https://github.com/vallexis/vallexis.git
   └── cd vallexis && cp .env.example .env
   └── Edit .env with production values
   └── docker compose up -d --build

7. RESTORE DATABASE
   └── Download latest backup from OCI Object Storage
   └── Decrypt: gpg --decrypt backup.sql.gz.gpg | gunzip > restore.sql
   └── Restore: docker exec -i vallexis-postgres psql -U vallexis -d vallexis_db < restore.sql
   └── Verify: SELECT count(*) FROM users;

8. RESTORE STORAGE
   └── mc mirror backup-bucket vallexis/ (MinIO restore)

9. UPDATE DNS
   └── Cloudflare → DNS → Update A record to new IP
   └── Wait for propagation (5-30 minutes)

10. VERIFY
    └── curl https://api.vallexis.io/api/health
    └── Open https://app.vallexis.io
    └── Test login + deploy flow

11. POST-RECOVERY
    └── Update OCI security list (firewall rules)
    └── Verify backup-agent cron is running
    └── Monitor Grafana for 30 minutes
    └── Send incident report
```

### Scenario 2: Database Corruption

**Trigger:** Backup-verify agent alerts, or data inconsistency detected.

**Impact:** Partial data loss. Application may serve incorrect data.

**Recovery time:** 15-30 minutes

**Playbook:**

```
1. STOP WRITES
   └── docker compose stop api-gateway deploy-service payment-service
   └── PostgreSQL remains running

2. ASSESS DAMAGE
   └── docker exec -it vallexis-postgres psql -U vallexis -d vallexis_db
   └── Check affected tables
   └── Determine: can we point-in-time recover?

3. DECIDE RECOVERY STRATEGY
   └── If corruption is recent: restore from latest backup
   └── If corruption is old: may need manual data repair

4. RESTORE DATABASE
   └── docker compose stop postgres
   └── docker volume rm vallexis_postgres_data
   └── docker compose up -d postgres
   └── Download + decrypt + restore backup (see Scenario 1, Step 7)

5. VERIFY
   └── Run application test suite
   └── Spot-check user accounts and projects

6. RESTART SERVICES
   └── docker compose up -d api-gateway deploy-service payment-service
```

### Scenario 3: Security Breach

**Trigger:** Unauthorized access detected, data exfiltration suspected.

**Impact:** Potential data exposure. Requires immediate containment.

**Recovery time:** 1-4 hours (investigation + recovery)

**Playbook:**

```
1. CONTAIN
   └── docker compose stop api-gateway deploy-service payment-service
   └── Block suspicious IPs at OCI security list
   └── Rotate ALL secrets immediately:
       ├── PayMongo API keys (dashboard.paymongo.com)
       ├── JWT signing keys (regenerate)
       ├── Database password
       ├── Redis password
       └── INTERNAL_SECRET

2. INVESTIGATE
   └── Preserve logs: docker compose logs > /tmp/incident_logs.txt
   └── Check audit_log table for unauthorized actions
   └── Review OCI audit logs
   └── Check for unauthorized SSH access

3. ASSESS SCOPE
   └── What data was accessed?
   └── Were payment records exposed?
   └── Were user credentials compromised?

4. RECOVER
   └── Restore from known-good backup if data was tampered
   └── Redeploy with updated secrets
   └── Force password reset for all users if credentials exposed

5. NOTIFY
   └── Affected users (if PII exposed)
   └── PayMongo (if payment data involved)
   └── Legal counsel (if regulatory reporting required)

6. HARDEN
   └── Review and update security controls
   └── Add additional monitoring rules
   └── Document lessons learned
```

---

## Recovery Procedures

### Restore PostgreSQL from Backup

```bash
# 1. Download backup from OCI Object Storage
oci os object get --bucket-name vallexis-backups \
  --name backup_YYYYMMDD.sql.gz.gpg \
  --file backup.sql.gz.gpg

# 2. Decrypt and decompress
gpg --decrypt backup.sql.gz.gpg | gunzip > restore.sql

# 3. Stop application services (keep PostgreSQL running)
docker compose stop api-gateway deploy-service payment-service seo-service

# 4. Restore database
docker exec -i vallexis-postgres psql -U vallexis -d vallexis_db < restore.sql

# 5. Verify
docker exec vallexis-postgres psql -U vallexis -d vallexis_db -c \
  "SELECT 'users: ' || count(*) FROM users UNION ALL \
   SELECT 'projects: ' || count(*) FROM projects;"

# 6. Restart services
docker compose up -d
```

### Restore MinIO from Backup

```bash
# 1. Install mc (MinIO Client) if not present
curl -O https://dl.min.io/client/mc/release/linux-amd64/mc
chmod +x mc && sudo mv mc /usr/local/bin/

# 2. Configure alias
mc alias set local http://localhost:9000 ${MINIO_ROOT_USER} ${MINIO_ROOT_PASSWORD}

# 3. Mirror backup to local
mc mirror backup-bucket/ local/vallexis/
```

---

## DR Testing

### Schedule

| Test | Frequency | Scope |
|---|---|---|
| Backup restore test | Monthly | Restore PostgreSQL to temporary DB, verify data |
| Full DR drill | Quarterly | Simulate server loss, full recovery to new instance |
| Backup verification | Daily (automated) | Archive integrity + row count check |

### DR Drill Checklist

| Step | Expected Result |
|---|---|
| Provision new OCI instance | Instance running, SSH accessible |
| Install Docker | Docker + Compose installed |
| Deploy Vallexis | All services healthy |
| Restore database | Users, projects, deploys restored |
| Restore MinIO | User files accessible |
| Update DNS | Site accessible via custom domain |
| Test core flows | Login, deploy, payment work |
| Time the drill | Under 30 minutes |

### Post-Drill Review

After each DR drill:
1. Document actual recovery time vs RTO target
2. Note any issues encountered
3. Update this document with lessons learned
4. File improvement tasks if RTO was exceeded

---

## References

- [RUNBOOK.md](RUNBOOK.md) — Incident response procedures
- [AGENTS.md](AGENTS.md) — Backup and monitoring agents
- [SECURITY.md](SECURITY.md) — Security incident response
- [ARCHITECTURE.md](ARCHITECTURE.md) — System architecture and data flows
