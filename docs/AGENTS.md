# AGENTS.md — Automated Systems & Background Agents

> **Last Updated:** June 23, 2026

All agents run as Docker-managed processes or cron jobs on the OCI A1 instance.
Alert channels: **email** (`oncall@vallexis.io`) and **Slack** (`#alerts`).

---

## CI/CD Agents

| Agent | Trigger | Actions | Failure Behaviour |
|---|---|---|---|
| **test-runner** | Pull Request opened or updated | Run `go test ./...` + `npm test`; post pass/fail status to GitHub PR | Block merge on failure; notify PR author via GitHub |
| **deploy-bot** | Push to `main` branch | `docker build` → `docker stop` old container → `docker run` new container → health check loop (10×5s) → update deploy record | Roll back to previous image if health check fails 10 times; alert Slack + email |
| **image-scanner** | After every Docker build in CI | `trivy image --severity CRITICAL,HIGH`; fail build on CRITICAL | Block deployment; open GitHub issue with CVE list |

---

## Monitoring Agents

| Agent | Interval | What it checks | Alert Threshold | Alert Channel |
|---|---|---|---|---|
| **uptime-pulse** | Every 60s | `GET /api/health` on all 4 services | Alert after **3 consecutive failures** | Email + Slack |
| **resource-watch** | Every 30s | CPU %, RAM %, disk % | CPU >85%, RAM >90%, Disk >95% | Slack (warning); Email (critical) |
| **cost-guard** | Every 6h | OCI billing API — projected monthly spend | Alert at **80%** of budget ceiling | Email |
| **db-conn-watch** | Every 5m | Active PostgreSQL connection count | Alert if >80% of `max_connections` (default 100) | Slack |
| **redis-memory-watch** | Every 5m | Redis `used_memory` vs `maxmemory` | Alert at **85%** | Slack |

---

## Maintenance Agents

| Agent | Schedule | Actions | Retention Policy |
|---|---|---|---|
| **backup-agent** | Daily at 03:00 UTC | `pg_dump` → gzip → GPG encrypt → rsync to OCI Object Storage | 7 daily, 4 weekly, 6 monthly |
| **backup-verify** | Daily at 04:00 UTC | Download latest backup, `gunzip -t`, verify row counts | Alert if corrupt or missing |
| **seo-crawler** | Weekly — Mon 06:00 UTC | Lighthouse audit per project, sitemap validation, store results in `seo_audits` | Email user if score drops >10 points vs prior week |
| **cert-renewer** | Daily at 00:00 UTC | Check certificate expiry for all domains; Caddy auto-renews if <30 days remain | Alert if renewal fails; Caddy logs retained 14 days |
| **audit-logger** | Continuous | All admin actions, auth events, API mutations written to `audit_log` table | 90 days hot (PostgreSQL); archive to OCI Object Storage thereafter |
| **docker-pruner** | Weekly — Sun 02:00 UTC | `docker image prune -f`; `docker builder prune --filter "until=168h"` | Keeps only images referenced by running containers |
| **dep-updater** | Weekly (GitHub Actions) | Dependabot PRs for Go modules + npm packages | CVE patches merged within 7 days; minor/patch updates batched weekly |

---

## Alert Routing

```
Severity P0/P1   ──► oncall@vallexis.io  +  #alerts (Slack)  +  PagerDuty (planned Q3 2026)
Severity P2      ──► #alerts (Slack)
Severity P3      ──► #notifications (Slack)
Automated bots   ──► #deploys (Slack, informational)
```

---

## Adding a New Agent

1. Define the agent in `docker-compose.yml` (or as a cron entry in `/etc/cron.d/vallexis`).
2. Document it in this file with: schedule, trigger, actions, thresholds, and alert routing.
3. Add a health-check endpoint or heartbeat metric to Prometheus if the agent is long-running.
4. Test failure scenarios in staging before enabling in production.
