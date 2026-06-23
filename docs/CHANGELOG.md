# CHANGELOG.md — Version History

All notable changes to Vallexis are documented in this file.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Versioning follows [Semantic Versioning](https://semver.org/).

---

## [Unreleased]

### Planned
- Custom domain support (Pro plan) — CNAME delegation + auto-SSL
- Interactive onboarding wizard — guided first deploy
- Team collaboration — invite up to 3 members per project
- Deploy preview URLs — per-PR ephemeral environments
- Environment variables UI — per-project, encrypted at rest

---

## [0.2.0] — 2026-06-15

### Added
- **SEO Toolkit:** automated weekly Lighthouse audits (performance, accessibility, SEO, best-practices scores), sitemap.xml generation, robots.txt validation, per-project SEO dashboard
- **Fair Storage:** MinIO S3-compatible storage backend; 2 GB on free tier, 5 GB per project (10 GB total) on Pro; automatic WebP conversion for uploaded images; `GET /storage/usage` breakdown by project
- **Free Subdomain + Wildcard SSL:** instant `<project>.vallexis.io` subdomain provisioned on project creation; Caddy handles auto-renewal via Let's Encrypt
- **Resource monitoring dashboard:** real-time CPU, RAM, and disk usage per service; 30-day historical charts via Prometheus + Grafana
- **Live deploy log streaming:** SSE endpoint delivers structured build logs to the dashboard in real time; no polling required
- **Audit logging:** all admin and user actions written to `audit_log` table; 90-day hot retention, then archived
- **AGENTS.md:** documented all automated background agents (CI/CD, monitoring, backup, SEO crawl, cert renewal)

### Changed
- Runtime upgraded from Go 1.21 → **Go 1.22** (improved range-over-int, improved slices package)
- Base OS upgraded from Ubuntu 22.04 → **Ubuntu 24.04 LTS**
- Docker build caching strategy refactored — layer ordering optimised; rebuild time reduced by **~50%**
- `deploy-service` now uses parallel `docker pull` for base images before build start
- Caddy replaces Nginx as TLS-terminating reverse proxy — zero-config HTTPS, automatic renewal

### Fixed
- Payment webhook timeout increased to 30 seconds (was 5s — caused false PayMongo retries)
- ARM-native Go modules replaced `x86`-only CGO dependencies
- Caddy config reload race condition on zero-downtime redeploy
- SSE connection memory leak in `deploy-service` (goroutines not cleaned up on client disconnect)
- Admin user count query returned stale result due to missing `COUNT(DISTINCT id)` — fixed

### Security
- 5 CVEs patched in Go dependencies (`net/http`, `crypto/tls` stack)
- `Content-Security-Policy` header added to all API responses
- Fail2Ban configured and enabled; 5 SSH failures → 1-hour IP ban
- Docker images rebuilt from scratch with Trivy scan — zero CRITICAL/HIGH CVEs at release time
- `X-Frame-Options: DENY` and `X-Content-Type-Options: nosniff` added to all responses

---

## [0.1.0] — 2026-05-20

### Added
- **Core auth system:** email/password registration with bcrypt (cost 12) + HIBP check; JWT RS256 access tokens (15 min) + refresh tokens (7 days)
- **OAuth:** GitHub and Google sign-in (email + profile scopes)
- **Projects:** create, list, view, delete; subdomain auto-assigned; Git repo + branch configuration
- **Deploy pipeline:** GitHub webhook → clone → `docker build` → `docker run` → health check; deploy history with status tracking
- **Payments:** PayMongo integration; monthly subscription plan (₱249/mo Pro); webhook handler for `payment.paid`, `subscription.updated`, `subscription.cancelled`; billing portal redirect
- **PostgreSQL 16** as primary database with `pgxpool` connection pooling
- **Redis 7.x** for session storage, rate-limit counters, and job queuing
- **Nginx** as reverse proxy (later replaced by Caddy in v0.2.0)
- **Docker Compose** deployment with named volumes, health checks, and auto-restart policies
- **Daily automated backups:** `pg_dump` compressed + rsync to OCI Object Storage; 7-day retention
- **Let's Encrypt SSL** via Certbot (later replaced by Caddy auto-renewal in v0.2.0)
- **Uptime monitoring:** internal HTTP health checks every 60 seconds; email alert after 3 consecutive failures
- **CI/CD pipeline:** GitHub Actions — test-runner on PR open/update; deploy-bot on push to `main`
- **Admin dashboard:** user list, project list, system health at a glance

---

## Links

[Unreleased]: https://github.com/vallexis/vallexis/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/vallexis/vallexis/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/vallexis/vallexis/releases/tag/v0.1.0
