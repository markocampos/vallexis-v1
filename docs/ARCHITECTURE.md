# ARCHITECTURE.md — System Design

> **Last Updated:** June 23, 2026
> **Status:** Production (v0.2.0)

---

## Table of Contents

1. [Deployment Topology](#deployment-topology)
2. [Services](#services)
3. [Data Flows](#data-flows)
4. [Database Schema](#database-schema)
5. [Inter-Service Communication](#inter-service-communication)
6. [Observability Stack](#observability-stack)

---

## Deployment Topology

All services run on a single Oracle Cloud Always Free ARM A1 instance behind Caddy as a TLS-terminating reverse proxy.

```
┌─────────────────────────────────────────────────────────────────────┐
│           Oracle Cloud ARM A1  (2 OCPU / 12 GB RAM)                 │
│           Ubuntu 24.04 LTS  — Docker Compose                        │
│                                                                     │
│   Internet                                                          │
│      │                                                              │
│   Cloudflare (DNS / DDoS)                                           │
│      │                                                              │
│   Caddy  :80 / :443  (TLS 1.3 + HSTS + gzip)                      │
│      ├──/api/*    ──► api-gateway      :3000  (Go/chi)             │
│      ├──/deploy/* ──► deploy-service   :3001  (Go)                 │
│      ├──/pay/*    ──► payment-service  :3002  (Go)                 │
│      ├──/seo/*    ──► seo-service      :3003  (Go)                 │
│      └──/*        ──► react-frontend   :5173  (React/Vite)         │
│                                                                     │
│   Internal Network (Docker bridge)                                  │
│      PostgreSQL   :5432   — primary data store                      │
│      Redis        :6379   — cache · sessions · queues               │
│      MinIO        :9000   — S3-compatible object storage            │
│      Prometheus   :9090   — metrics scrape                          │
│      Grafana      :3100   — dashboards                              │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Services

| Service | Port | Language | Purpose |
|---|---|---|---|
| `react-frontend` | 5173 | TypeScript / React + Vite | Main dashboard UI |
| `api-gateway` | 3000 | Go (`go-chi/chi`) | Auth, users, projects, billing, routing |
| `deploy-service` | 3001 | Go | Git cloning, Docker builds, container lifecycle |
| `payment-service` | 3002 | Go | PayMongo payment links, webhooks, subscriptions, invoices |
| `seo-service` | 3003 | Go | Lighthouse audits, sitemap generation, meta tag analysis |
| `PostgreSQL` | 5432 | — | Primary relational database (v16) |
| `Redis` | 6379 | — | Session cache, rate-limit counters, deploy job queue |
| `MinIO` | 9000 | — | S3-compatible object storage (user assets) |
| `Prometheus` | 9090 | — | Metrics scraping from all Go services |
| `Grafana` | 3100 | — | Operational dashboards, alerting |

### Resource Budget (ARM A1 @ 2 OCPU / 12 GB)

| Service | CPU % (idle) | RAM (target) |
|---|---|---|
| react-frontend | ~1% | 64 MB |
| api-gateway | ~5% | 96 MB |
| deploy-service | ~3% (30% during build) | 128 MB |
| payment-service | ~2% | 64 MB |
| seo-service | ~2% (20% during audit) | 128 MB |
| PostgreSQL | ~5% | 512 MB |
| Redis | ~1% | 64 MB |
| MinIO | ~2% | 256 MB |
| Prometheus + Grafana | ~3% | 256 MB |
| **Total headroom** | **~76%** | **~10.8 GB free** |

---

## Data Flows

### 1. Deploy Pipeline

```
Developer
  │  git push origin main
  ▼
GitHub Webhook  POST /deploy/webhook
  │
deploy-service
  ├── 1. Verify HMAC signature
  ├── 2. Clone repository (shallow --depth=1)
  ├── 3. docker build  (cached layers)
  ├── 4. docker stop old-container
  ├── 5. docker run new-container --health-cmd
  ├── 6. Health-check loop (GET /health, 10×5s)
  ├── 7. Write deploy record → PostgreSQL
  └── 8. Stream logs → Redis pub/sub → SSE → Dashboard
```

### 2. Payment Flow

```
User  ──► POST /billing/checkout ──► payment-service
                                         │
                                    PayMongo Payment Link
                                         │
                               (redirect to PayMongo-hosted page)
                                         │
                            PayMongo webhook: payment.paid
                                         │
                              payment-service verifies signature
                                         │
                              UPDATE subscriptions SET plan='pro'
                                         │
                              api-gateway cache invalidated (Redis)
```

### 3. Authentication Flow

```
Client  ──► POST /auth/login ──► api-gateway
                                     │
                              Validate credentials (bcrypt cost 12)
                              HIBP breach check
                                     │
                         ┌───────────┴───────────┐
                    access_token (JWT RS256, 15 min)
                    refresh_token (opaque, 7 days, stored in Redis)
                         │
                    Set HttpOnly SameSite=Strict cookies
                         │
                 Subsequent requests: verify JWT signature (public key)
                 Token expired? POST /auth/refresh (rotate refresh)
```

### 4. SEO Audit Flow

```
Scheduler (weekly)  OR  User triggers POST /seo/audit
  │
seo-service
  ├── 1. Chromium headless (Lighthouse CLI)
  ├── 2. Parse scores: performance / accessibility / SEO / best-practices
  ├── 3. Generate sitemap.xml, validate robots.txt
  ├── 4. Store audit result → PostgreSQL
  └── 5. Notify user via email (SendGrid) if score < threshold
```

---

## Database Schema

```sql
-- Users & Auth
users (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email          TEXT UNIQUE NOT NULL,
  password_hash  TEXT,                          -- null for OAuth-only
  name           TEXT NOT NULL,
  plan           TEXT NOT NULL DEFAULT 'free',  -- free | pro | enterprise
  paymongo_customer_id TEXT UNIQUE,
  github_id      BIGINT UNIQUE,
  google_id      TEXT UNIQUE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at     TIMESTAMPTZ                    -- soft delete (30d purge)
);

-- Projects
projects (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name           TEXT NOT NULL,
  subdomain      TEXT UNIQUE NOT NULL,
  custom_domain  TEXT UNIQUE,
  git_repo       TEXT NOT NULL,
  git_branch     TEXT NOT NULL DEFAULT 'main',
  status         TEXT NOT NULL DEFAULT 'idle',  -- idle | building | deployed | failed
  container_id   TEXT,
  storage_bytes  BIGINT NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Deploys
deploys (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id     UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  commit_sha     TEXT NOT NULL,
  commit_message TEXT,
  status         TEXT NOT NULL DEFAULT 'queued', -- queued | running | success | failed
  build_log      TEXT,
  duration_secs  INT,
  started_at     TIMESTAMPTZ,
  completed_at   TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Billing
subscriptions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  paymongo_sub_id      TEXT UNIQUE NOT NULL,
  paymongo_link_id     TEXT NOT NULL,
  plan                TEXT NOT NULL,   -- pro | enterprise
  status              TEXT NOT NULL,   -- active | past_due | canceled | trialing
  current_period_end  TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

invoices (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES users(id),
  paymongo_pay_id TEXT UNIQUE NOT NULL,
  amount_cents   INT NOT NULL,
  currency       TEXT NOT NULL DEFAULT 'php',
  status         TEXT NOT NULL,  -- draft | open | paid | void | uncollectible
  pdf_url        TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Storage
storage_files (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES users(id),
  filename    TEXT NOT NULL,
  minio_key   TEXT NOT NULL,
  size_bytes  BIGINT NOT NULL,
  content_type TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- SEO
seo_audits (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  score_perf      INT,
  score_a11y      INT,
  score_seo       INT,
  score_practices INT,
  issues          JSONB,
  sitemap_url     TEXT,
  audited_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Audit Log
audit_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id),
  action      TEXT NOT NULL,
  resource    TEXT,
  resource_id UUID,
  ip_address  INET,
  user_agent  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Key indexes:**
- `projects(user_id)`, `projects(subdomain)`
- `deploys(project_id, created_at DESC)`
- `audit_log(user_id, created_at DESC)`
- `audit_log(created_at)` — for 90-day TTL partition

---

## Inter-Service Communication

| From | To | Method | Notes |
|---|---|---|---|
| api-gateway | deploy-service | HTTP (internal) | `/api/internal/deploy` with shared HMAC secret |
| api-gateway | payment-service | HTTP (internal) | Plan verification, subscription status |
| deploy-service | Redis | TCP | Job queue (BRPOP), build log pub/sub (PUBLISH) |
| payment-service | PostgreSQL | TCP | Direct connection (pgxpool) |
| seo-service | PostgreSQL | TCP | Write audit results |
| All services | Redis | TCP | Rate-limit counters, session tokens |
| PayMongo | payment-service | HTTPS Webhook | `payment.paid`, `subscription.updated`, `subscription.cancelled` |
| GitHub | deploy-service | HTTPS Webhook | `push` events on tracked branches |

---

## Observability Stack

| Signal | Tool | Retention |
|---|---|---|
| Metrics | Prometheus → Grafana | 30 days |
| Logs | Docker JSON driver → Loki | 14 days (hot), 90 days (cold) |
| Traces | OpenTelemetry (planned Q3 2026) | — |
| Uptime | Internal uptime-pulse agent (60s) | Alert on 3 consecutive failures |
| Errors | Sentry (planned Q3 2026) | — |

All Go services expose a `/metrics` endpoint (Prometheus exposition format) and a `/health` endpoint returning `{"status": "ok", "version": "x.y.z"}`.
