# CHANGELOG.md — Version History

> **Version:** 0.1.0
> **Last Updated:** June 30, 2026

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

## [0.1.0] — 2026-06-30

### Changed
- **Strict Light Mode:** Removed dark mode entirely and standardized the application design to strictly light mode.
- **Secure Token Storage:** Migrated authentication tokens from `localStorage` to secure, HttpOnly, SameSite=Strict cookies to protect against XSS token theft.
- **OAuth Callback:** Refactored OAuth flow to return tokens in HttpOnly cookies, eliminating token exposure in URL query parameters.
- **Docker Socket Proxy:** Replaced direct Docker socket mount with `tecnativa/docker-socket-proxy` to restrict deploy-service permissions.
- **Docker Network Isolation:** Split services into `frontend-net`, `backend-net`, `db-net`, and `monitoring-net` networks.
- **Container Resource Limits:** Added `deploy.resources.limits` (512M memory, 1.0 CPU) to all backend services.
- **Pinned Image Versions:** All Docker images now use specific version tags instead of `:latest` for reproducible builds.
- **Rate Limiting:** Added general rate limiter (100 req/min per IP) to all protected API endpoints; rate limiter now uses atomic Redis Lua script.
- **CORS Headers:** Access-Control-Allow-Methods/Headers now only sent when origin matches allowed list.
- **WriteTimeout:** Increased from 0 to 30s on api-gateway; SSE streams use HTTP hijack to bypass timeout.
- **Shared PublicHeader Component:** Extracted duplicated navigation header from 9 public pages into a single shared component using React Router `<Link>`.
- **Shared TypeScript Types:** Consolidated duplicate local interfaces (Deploy, StorageFile, Subscription) into `@/types/index.ts`.
- **CI Pipeline:** Eliminated duplicate Docker builds between build and scan jobs using artifact save/load.
- **CSP Policy:** Added `'unsafe-inline'` to `script-src` for Vite compatibility; added HSTS to domain redirect responses.
- **Seed Data:** Expanded to include free user, starter user, subscriptions, and sample project.

### Fixed
- **Token Refresh Interception:** Implemented `/auth/refresh` API endpoint and a frontend fetch interceptor to automatically refresh JWT access tokens and prevent silent logouts.
- **OAuth CSRF When Redis Down:** OAuth flow now returns 503 when Redis is unavailable instead of silently skipping state verification.
- **Logout DoS:** Replaced `ParseUnverified` JWT parsing with refresh-token-cookie-based user identification for logout.
- **Webhook Signature Bypass:** Webhook signature verification now fails (returns false) when `PAYMONGO_WEBHOOK_SECRET` is empty instead of accepting all requests.
- **Storage Quota Spoof:** Upload handler now validates actual bytes written instead of trusting client-reported `header.Size`.
- **Deploy Race Condition:** Deploy creation now uses database transaction with `SELECT FOR UPDATE` to prevent concurrent builds.
- **SSE Stream Timeout:** SSE streams now have a 30-minute maximum duration via HTTP hijack deadline.
- **Frontend 204 Handling:** API client no longer crashes when DELETE/PUT returns 204 No Content.
- **SSE Authentication:** Deploy log streaming now uses `fetch` with `credentials: 'include'` instead of `EventSource` (which doesn't support cookies).
- **Memory Leak:** Deploy log array is now capped at 1000 entries.
- **Division by Zero:** Storage and Billing usage percentage calculations now guard against zero limits.
- **Clipboard Fallback:** Dashboard, Projects, and Storage pages now have try/catch fallback for `navigator.clipboard` in insecure contexts.
- **Password Validation:** Settings page now enforces full backend password requirements (12+ chars, uppercase, lowercase, digit, special char).
- **404 Page:** Added proper NotFound page instead of silently redirecting to home.
- **Project Count Errors:** Project creation now returns 500 on database errors instead of confusing "limit reached" message.
- **GetUsage Errors:** Billing usage endpoint now returns 500 on database errors instead of returning zeros.
- **Starter Plan Pricing:** Fixed copy-paste bug where starter plan used pro plan's price ID.
- **Deploy Query Invalidation:** Trigger deploy now invalidates the deploys list query.
- **Failing Tests:** Fixed Dashboard and BottomNav test assertions.
- **Grammar:** Fixed "matches" → "match" in deploy log search.
- **File Upload Security:** Added extension allowlist — rejects `.php`, `.exe`, `.sh`, and other executable types.
- **Pagination:** All list endpoints now support `?page=N&limit=N` query params (defaults: page=1, limit=50, max 200).
- **Billing Invalid Date:** Free users now get a default 30-day `current_period_end` instead of empty string.
- **Project Count Enforcement:** Creating a project beyond plan limits now returns 403 instead of allowing it.
- **Bandwidth Tracking:** Added `bandwidth_usage` table and 30-day rolling sum query (was hardcoded to 0).
- **Password Validation Consistency:** `UpdatePassword` now uses the same `ValidatePassword` function as registration.
- **DB Connection Pool:** Configured `SetMaxOpenConns(25)`, `SetMaxIdleConns(25)`, `SetConnMaxLifetime(5m)`.
- **Account Deletion Security:** Requires password confirmation in request body before deleting account.
- **Air Config:** `.air.toml` now uses `{{.ARGS}}` template for per-service builds instead of hardcoding api-gateway.
- **Prometheus Alerts:** Added 8 alert rules: InstanceDown, HighErrorRate, HighLatency, PostgresDown/HighConn, RedisDown/HighMem, DiskSpaceLow.

### Added
- **SEO Toolkit:** automated weekly Lighthouse audits (performance, accessibility, SEO, best-practices scores), sitemap.xml generation, robots.txt validation, per-project SEO dashboard
- **Fair Storage:** MinIO S3-compatible storage backend; 2 GB on free tier, 5 GB per project (10 GB total) on Pro; automatic WebP conversion for uploaded images; `GET /storage/usage` breakdown by project
- **Free Subdomain + Wildcard SSL:** instant `<project>.vallexis.io` subdomain provisioned on project creation; Caddy handles auto-renewal via Let's Encrypt
- **Resource monitoring dashboard:** real-time CPU, RAM, and disk usage per service; 30-day historical charts via Prometheus + Grafana
- **Live deploy log streaming:** SSE endpoint delivers structured build logs to the dashboard in real time; no polling required
- **Audit logging:** all admin and user actions written to `audit_log` table; 90-day hot retention, then archived
- **Audit log migration:** `006_audit_log.sql` creates the `audit_log` table with proper indexes
- **Dependabot:** Configured for Go modules, npm, Docker, and GitHub Actions dependency updates
- **NotFound page:** Proper 404 page for unmatched routes
- **PublicHeader component:** Shared navigation component for all public pages
- **GeneralRateLimit middleware:** Per-IP rate limiting for all protected API endpoints
- **AGENTS.md:** documented all automated background agents (CI/CD, monitoring, backup, SEO crawl, cert renewal)
- **Core auth system:** email/password registration with bcrypt (cost 12) + HIBP check; JWT RS256 access tokens (15 min) + refresh tokens (7 days)
- **OAuth:** GitHub and Google sign-in (email + profile scopes)
- **Projects:** create, list, view, delete; subdomain auto-assigned; Git repo + branch configuration
- **Deploy pipeline:** GitHub webhook → clone → `docker build` → `docker run` → health check; deploy history with status tracking
- **Payments:** PayMongo integration; monthly subscription plan (₱499/mo Pro); webhook handler for `payment.paid`, `subscription.updated`, `subscription.cancelled`; billing portal redirect
- **PostgreSQL 16** as primary database with `pgxpool` connection pooling
- **Redis 7.x** for session storage, rate-limit counters, and job queuing
- **Caddy** as reverse proxy with auto-HTTPS, HTTP/3, and zero-config TLS
- **Docker Compose** deployment with named volumes, health checks, and auto-restart policies
- **Daily automated backups:** `pg_dump` compressed + rsync to OCI Object Storage; 7-day retention
- **Uptime monitoring:** internal HTTP health checks every 60 seconds; email alert after 3 consecutive failures
- **CI/CD pipeline:** GitHub Actions — test-runner on PR open/update; deploy-bot on push to `main`; Trivy security scanning
- **Admin dashboard:** user list, project list, system health at a glance
- **Handler tests:** Storage and projects handler tests for auth validation (missing auth, invalid JSON)

### Security
- 5 CVEs patched in Go dependencies (`net/http`, `crypto/tls` stack)
- `Content-Security-Policy` header added to all API responses
- Fail2Ban configured and enabled; 5 SSH failures → 1-hour IP ban
- Docker images rebuilt from scratch with Trivy scan — zero CRITICAL/HIGH CVEs at release time
- `X-Frame-Options: DENY` and `X-Content-Type-Options: nosniff` added to all responses
- Docker socket access restricted via proxy (no direct `/var/run/docker.sock` mount)
- Webhook signature verification enforced (rejects requests when secret is not configured)
- OAuth state parameter enforced (fails with 503 when Redis is unavailable)
- Rate limiting on all protected endpoints (100-500 req/min by plan tier)

---

## Links

