# DECISIONS.md — Architecture Decision Records

> **Last Updated:** June 23, 2026

Architecture Decision Records (ADRs) document the significant technical choices made in Vallexis, including the context and reasoning behind them. This helps future contributors understand *why* things are the way they are — not just how.

---

## Index

| # | Decision | Status | Date |
|---|---|---|---|
| [ADR-001](#adr-001) | Go for all backend services | ✅ Accepted | 2026-04-01 |
| [ADR-002](#adr-002) | Single-node architecture on OCI ARM A1 | ✅ Accepted | 2026-04-01 |
| [ADR-003](#adr-003) | PostgreSQL as primary database | ✅ Accepted | 2026-04-05 |
| [ADR-004](#adr-004) | Docker-based user deployments (not Kubernetes) | ✅ Accepted | 2026-04-10 |
| [ADR-005](#adr-005) | MinIO for object storage (not AWS S3) | ✅ Accepted | 2026-04-15 |
| [ADR-006](#adr-006) | Caddy as reverse proxy (replacing Nginx) | ✅ Accepted | 2026-06-01 |
| [ADR-007](#adr-007) | JWT RS256 with short-lived access tokens | ✅ Accepted | 2026-04-20 |
| [ADR-008](#adr-008) | PayMongo as payment processor at launch | ✅ Accepted | 2026-04-25 |
| [ADR-009](#adr-009) | React + Vite for the frontend dashboard | ✅ Accepted | 2026-04-05 |
| [ADR-010](#adr-010) | Cursor-based pagination for list APIs | ✅ Accepted | 2026-05-10 |
| [ADR-011](#adr-011) | Server-Sent Events for deploy log streaming | ✅ Accepted | 2026-05-20 |
| [ADR-012](#adr-012) | Soft-delete for users (not hard-delete) | ✅ Accepted | 2026-06-10 |

---

## ADR-001

### Go for All Backend Services

**Status:** Accepted  
**Date:** 2026-04-01

#### Context

We needed a backend language for Vallexis's microservices. The options considered were Go, Node.js, and Python.

#### Decision

**Go (Golang)** for all backend services.

#### Rationale

| Factor | Go | Node.js | Python |
|---|---|---|---|
| Memory footprint | ~30–60 MB per service | ~80–150 MB | ~60–120 MB |
| ARM64 native | ✅ First-class | ✅ (via V8) | ✅ |
| Concurrency model | goroutines (lightweight) | Event loop (single-threaded) | GIL (limited) |
| Single binary deploy | ✅ Static binary | ❌ Node + node_modules | ❌ Python + venv |
| Container image size | ~15 MB (Alpine) | ~200 MB+ | ~200 MB+ |
| Startup time | <10ms | ~300ms | ~200ms |

On OCI ARM A1 with 12 GB RAM, Go's ~30 MB per service means we can run 8 services and still have 10 GB+ free. This is critical for a bootstrapped project where infrastructure costs must be zero.

#### Consequences

- Team members must know or learn Go.
- Some libraries (e.g. ML tooling) are less mature than Python equivalents — not relevant for our use case.
- Static typing improves maintainability as the team grows.

---

## ADR-002

### Single-Node Architecture on OCI ARM A1

**Status:** Accepted  
**Date:** 2026-04-01

#### Context

We needed to choose an infrastructure model for the initial launch. Options ranged from managed PaaS (Railway, Render) to multi-node cloud (AWS, GCP) to single VPS.

#### Decision

**Single Oracle Cloud ARM A1 instance** (Always Free tier) with Docker Compose orchestration.

#### Rationale

- **Zero infrastructure cost** at launch — OCI Always Free provides 2 OCPU / 12 GB RAM indefinitely.
- **ARM Ampere** cores are 20–40% more CPU-efficient than x86 for server workloads.
- **Operational simplicity** — a single node needs no distributed coordination (no service discovery, no leader election, no split-brain).
- At target scale of ~2,000 users and ~10 concurrent active projects, single-node is more than sufficient (tested with load simulations).
- Upgrading to 4 OCPU / 24 GB RAM is a live shape change with ~30 seconds of downtime — not requiring architecture changes.

#### Trade-offs

- **No redundancy** — if the host node goes down, the platform goes down. Mitigated by automated backups and documented recovery procedures.
- **Vertical scaling limit** — when single-node is truly insufficient, migration to multi-node requires more significant effort. Documented in ROADMAP.md.
- **Builds consume shared resources** — Docker builds spike CPU/RAM. Mitigated by `DEPLOY_MAX_CONCURRENT=2` limit.

#### Review Trigger

Revisit this decision when monthly revenue exceeds $2,000 MRR or the instance consistently runs above 80% CPU/RAM.

---

## ADR-003

### PostgreSQL as Primary Database

**Status:** Accepted  
**Date:** 2026-04-05

#### Context

We needed a primary relational data store. Alternatives considered: MySQL, SQLite, PlanetScale.

#### Decision

**PostgreSQL 16**.

#### Rationale

- **JSONB support** — audit logs and SEO issue arrays stored as JSONB without a separate document store.
- **Full SQL** — complex reporting queries (storage breakdown by project, deploy frequency) are trivial in Postgres.
- **pgcrypto** — column-level encryption for sensitive fields without an additional service.
- **pg_stat_statements** — built-in slow query analysis.
- **Ecosystem** — `pgx` Go driver is well-maintained and idiomatic; `testcontainers-go` has first-class Postgres support.
- SQLite was considered for simplicity but ruled out due to lack of concurrent write performance and no network access for multiple services.

#### Consequences

- All backend services share one PostgreSQL instance (acceptable for MVP scale).
- Schema migrations must be backwards-compatible to allow zero-downtime deploys.

---

## ADR-004

### Docker-Based User Deployments (Not Kubernetes)

**Status:** Accepted  
**Date:** 2026-04-10

#### Context

We needed a way to run user-deployed applications in isolation. Options: Docker (direct), Kubernetes, Nomad, bare processes.

#### Decision

**Docker** via the Docker SDK in `deploy-service`. Each user project gets its own named container with resource limits.

#### Rationale

- **Kubernetes is overkill** for a single-node setup. K3s/MicroK8s would add ~500 MB RAM overhead and significant operational complexity with no benefit at current scale.
- **Docker** is familiar, has a mature Go SDK, and supports the full lifecycle we need (build, run, stop, logs).
- **Isolation** is achieved via Docker's namespace and cgroup isolation per container.
- **Resource limiting** via `--memory` and `--cpu-quota` flags prevents one noisy user from starving others.
- Nomad was considered but ruled out — more operational complexity than raw Docker for our scale.

#### Consequences

- Containers share the Docker daemon on the host — stronger isolation (gVisor, Firecracker) would require additional complexity.
- Build logs are captured via `docker logs` piped through Redis pub/sub to SSE.
- Future migration to Kubernetes is possible without changing the user-facing deploy API.

---

## ADR-005

### MinIO for Object Storage (Not AWS S3)

**Status:** Accepted  
**Date:** 2026-04-15

#### Context

We needed object storage for user-uploaded files (images, assets). Options: AWS S3, Cloudflare R2, MinIO (self-hosted).

#### Decision

**MinIO** deployed as a Docker container on the OCI instance.

#### Rationale

- **Zero egress cost** — no bandwidth fees when serving files on the same node.
- **S3-compatible API** — any S3 SDK works; migration to R2 or S3 in the future requires zero code changes.
- **No vendor lock-in** — data stays on our infrastructure.
- **Always Free** — part of the OCI bill-free footprint.
- AWS S3 egress pricing ($0.09/GB) would become significant as storage grows.
- Cloudflare R2 was the strongest alternative (zero egress) but requires Cloudflare subscription.

#### Consequences

- MinIO is a stateful service — its data directory must be on a persistent volume.
- MinIO data must be included in daily backups.
- Migration to R2/S3 later is straightforward due to S3 API compatibility.

---

## ADR-006

### Caddy as Reverse Proxy (Replacing Nginx)

**Status:** Accepted  
**Date:** 2026-06-01  
**Supersedes:** Initial decision to use Nginx

#### Context

The project launched with Nginx as the reverse proxy. SSL certificate management (Certbot + cron) was causing operational toil — certificates occasionally failed to renew, and Nginx config reload had a race condition with the deploy pipeline.

#### Decision

Replace Nginx with **Caddy**.

#### Rationale

- **Automatic HTTPS** — Caddy handles Let's Encrypt issuance and renewal without any external tooling or cron jobs.
- **Zero-config TLS** — adding a new domain (including wildcard) requires only a `Caddyfile` change; no `certbot` invocations.
- **Graceful reload** — `caddy reload` is atomic and zero-downtime, unlike `nginx -s reload` which had a race with our deploy hook.
- **HTTP/3** support out of the box.
- **Caddyfile** is dramatically simpler than `nginx.conf` for our use case.

#### Trade-offs

- Caddy is less battle-tested at very high traffic than Nginx — acceptable for current scale.
- Team familiarity with Nginx was slightly higher — minor learning curve.

#### Migration

Nginx was replaced in v0.2.0. All Nginx config was migrated to `Caddyfile` with equivalent routing and security headers.

---

## ADR-007

### JWT RS256 with Short-Lived Access Tokens

**Status:** Accepted  
**Date:** 2026-04-20

#### Context

We needed an authentication token mechanism. Options: JWT HS256 (symmetric), JWT RS256 (asymmetric), opaque tokens, sessions.

#### Decision

**JWT RS256** with 15-minute access tokens and 7-day opaque refresh tokens stored in Redis.

#### Rationale

- **RS256 vs HS256** — asymmetric signing allows any service to verify tokens using only the public key, without sharing a secret. This is important in a multi-service architecture.
- **Short-lived access tokens (15 min)** — limits the damage window of a stolen token without requiring constant re-authentication.
- **Opaque refresh tokens** — stored in Redis, allowing instant revocation on logout or security events. JWTs alone cannot be revoked before expiry.
- **Cookie storage** — `HttpOnly + SameSite=Strict` cookies prevent XSS-based token theft; not `localStorage`.

#### Consequences

- All services must have access to the public key to verify tokens.
- Token refresh must be handled client-side (React Query handles this automatically).
- Redis becomes a dependency for auth (refresh token storage/revocation).

---

## ADR-008

### PayMongo as Payment Processor at Launch

**Status:** Accepted  
**Date:** 2026-04-25

#### Context

We needed a payment processor. The primary market for Vallexis is the Philippines and Southeast Asia. Options considered: Stripe, PayMongo, Paynamics, Dragonpay, PayPal, Paddle.

#### Decision

**PayMongo** as the primary payment processor at launch.

#### Rationale

| Factor | PayMongo | Stripe |
|---|---|---|
| Philippines support | ✅ Native (PH company, BSP-licensed) | ⚠️ Limited (no local acquiring) |
| GCash support | ✅ Built-in | ❌ Not available |
| Maya (PayMaya) support | ✅ Built-in | ❌ Not available |
| Credit cards (Visa/MC) | ✅ | ✅ |
| PHP currency native | ✅ | ⚠️ Requires conversion |
| PCI-DSS handling | ✅ SAQ-A (hosted page) | ✅ SAQ-A |
| Pricing | ~3.5% per transaction | 2.9% + $0.30 (USD) |
| Go SDK / REST API | ✅ REST (well-documented) | ✅ Native Go SDK |

**Key reasons:**
- **GCash and Maya** are the dominant payment methods in the Philippines — not supporting them would exclude the majority of our target users.
- **PayMongo is BSP-licensed** — compliant with Bangko Sentral ng Pilipinas regulations for electronic money and payment facilitation.
- **Native PHP (Philippine Peso) support** — pricing in ₱249/mo is straightforward without currency conversion friction for local users.
- **Payment links model** — PayMongo's hosted payment page means card data never touches our servers (SAQ-A PCI scope, same as Stripe Checkout).

#### Consequences

- PayMongo does not have an official Go SDK — we use their REST API directly with a thin internal wrapper (`paymongo-go`).
- Users outside the Philippines may not have GCash/Maya but can still pay via credit/debit card through PayMongo.
- PayPal planned for Q4 2026 for international users who prefer it.
- Transaction fee (~3.5%) is accounted for in the ₱249/mo pricing.

#### Review Trigger

Revisit if expanding significantly outside the Philippines, where Stripe's global coverage may be preferable.

---

## ADR-009

### React + Vite for the Frontend Dashboard

**Status:** Accepted  
**Date:** 2026-04-05

#### Context

We needed a frontend framework. Options: React, Next.js, SvelteKit, Vue.

#### Decision

**React 18 + Vite 5** with TypeScript.

#### Rationale

- **Vite** build speed is a developer experience win — HMR in <50ms vs Webpack's seconds.
- **React** is the team's strongest skillset and has the widest component ecosystem.
- **Next.js** was considered but ruled out — we don't need SSR for a SaaS dashboard (all pages require auth; SEO is irrelevant). Next.js's complexity (App Router, RSC) is not justified.
- **SvelteKit** was appealing for performance, but the smaller ecosystem and team unfamiliarity outweighed the benefits.
- **React Query** for server state management avoids Redux boilerplate entirely.

#### Consequences

- Dashboard is a pure SPA — not indexable by search engines (acceptable; it's behind auth).
- Bundle size managed via code splitting (React.lazy) and Vite's rollup output.

---

## ADR-010

### Cursor-Based Pagination for List APIs

**Status:** Accepted  
**Date:** 2026-05-10

#### Context

We needed a pagination strategy for list endpoints (projects, deploys, invoices). Options: offset-based (`?page=2&limit=20`), cursor-based (`?cursor=proj_abc123`).

#### Decision

**Cursor-based pagination** for all list endpoints.

#### Rationale

- **Consistent results** — offset pagination breaks when items are inserted or deleted mid-page. Cursor-based pagination is stable.
- **Performance** — offset pagination requires `OFFSET N` in SQL which scans N rows before returning results. Cursors use indexed `WHERE id > cursor_id` queries — O(1) performance regardless of dataset size.
- **Simpler client logic** — clients just pass `next_cursor` from the previous response; no need to track page numbers.

#### Trade-offs

- Cannot jump to a specific page number (e.g. "go to page 5") — acceptable for our UX (infinite scroll / "load more").
- Cursors are opaque strings — clients must not construct them.

---

## ADR-011

### Server-Sent Events for Deploy Log Streaming

**Status:** Accepted  
**Date:** 2026-05-20

#### Context

We needed to stream real-time deploy logs to the dashboard. Options: polling, WebSockets, Server-Sent Events (SSE).

#### Decision

**Server-Sent Events (SSE)** as the primary log streaming mechanism, with **WebSockets** available as an alternative endpoint.

#### Rationale

- **SSE is simpler** — unidirectional (server → client), text-based, works over HTTP/1.1. No handshake overhead, no message framing protocol to implement.
- **Native browser support** via `EventSource` — no library needed.
- **Auto-reconnect** — browsers automatically reconnect SSE connections if they drop, with the `Last-Event-ID` header for resume.
- **WebSockets provided** for clients that need bidirectional communication (future interactive terminal feature).
- **Polling** was rejected — adds load and provides poor user experience (bursty updates).
- Deploy logs are stored in Redis pub/sub by `deploy-service` and fanned out to all connected SSE clients.

#### Consequences

- SSE connections hold a goroutine open per connected client — cleaned up on client disconnect via `ctx.Done()`.
- Maximum simultaneous log viewers per deploy limited to 50 (Redis fan-out overhead).

---

## ADR-012

### Soft-Delete for Users (Not Hard-Delete)

**Status:** Accepted  
**Date:** 2026-06-10

#### Context

We needed to implement GDPR's right to erasure. When a user deletes their account, we need to handle data purging. Options: immediate hard-delete, soft-delete with delayed purge.

#### Decision

**Soft-delete** with a `deleted_at` timestamp. A scheduled cleanup agent hard-deletes records after 30 days.

#### Rationale

- **GDPR compliant** — the regulation requires erasure "without undue delay" but does not mandate immediate deletion. 30 days is widely accepted.
- **Protects against accidental deletion** — a user who deletes their account by mistake can be recovered within 30 days by a support request.
- **Payment integrity** — invoices and payment records must be retained for 7 years (tax law). PayMongo owns payment data; we retain invoice IDs. These are excluded from the 30-day purge and anonymised instead.
- **Referential integrity** — soft-delete allows foreign keys referencing `users.id` to remain valid during the grace period.

#### Implementation

- `DELETE /users/me` sets `users.deleted_at = NOW()`.
- All queries add `WHERE deleted_at IS NULL` to exclude soft-deleted users.
- The `cleanup-agent` (daily cron at 04:30 UTC) hard-deletes users where `deleted_at < NOW() - interval '30 days'`.
- Invoices and billing records are anonymised (user_id set to a `deleted-user` sentinel value) rather than deleted.

---

## Adding a New ADR

When making a significant technical decision, create a new entry using this template:

```markdown
## ADR-XXX

### [Short Decision Title]

**Status:** Proposed | Accepted | Deprecated | Superseded by ADR-YYY
**Date:** YYYY-MM-DD

#### Context

[What is the issue or question driving this decision?]

#### Decision

[What was decided?]

#### Rationale

[Why was this option chosen over the alternatives?]

#### Consequences

[What are the trade-offs and downstream effects?]

#### Review Trigger (optional)

[Under what conditions should this decision be revisited?]
```

**Threshold for writing an ADR:** If a technical decision would take more than 30 minutes to explain verbally to a new team member, it warrants an ADR.
