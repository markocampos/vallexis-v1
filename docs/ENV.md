# ENV.md — Environment Variable Reference

> **Version:** 0.1.0
> **Last Updated:** June 23, 2026

This document is the authoritative reference for every environment variable used by Vallexis services. Copy `.env.example` at the root of the repo and fill in the values described here.

> [!CAUTION]
> Never commit `.env` files or real secrets to version control. Use `.env.example` with placeholder values only.

---

## Table of Contents

1. [Quick Setup](#quick-setup)
2. [api-gateway](#api-gateway)
3. [deploy-service](#deploy-service)
4. [payment-service](#payment-service)
5. [seo-service](#seo-service)
6. [PostgreSQL](#postgresql)
7. [Redis](#redis)
8. [MinIO](#minio)
9. [Email](#email)
10. [Observability](#observability)
11. [Feature Flags](#feature-flags)

---

## Quick Setup

Variables marked **Required** will cause the service to fail to start if missing. Variables marked **Optional** have documented defaults.

```bash
cp .env.example .env
# Then fill in each section below
```

---

## api-gateway

Service running on port `3000`. Handles auth, users, projects, and routing.

| Variable | Required | Default | Description |
|---|---|---|---|
| `API_PORT` | Optional | `3000` | HTTP port for the API gateway |
| `API_ENV` | Optional | `development` | Runtime environment: `development`, `staging`, `production` |
| `API_LOG_LEVEL` | Optional | `info` | Log verbosity: `debug`, `info`, `warn`, `error` |
| `DATABASE_URL` | **Required** | — | PostgreSQL connection string. Format: `postgres://user:pass@host:5432/dbname?sslmode=disable` |
| `REDIS_URL` | **Required** | — | Redis connection string. Format: `redis://:password@host:6379/0` |
| `JWT_PRIVATE_KEY_PATH` | **Required** | — | Absolute path to the RS256 private key PEM file. Generate: `openssl genrsa -out private.pem 4096` |
| `JWT_PUBLIC_KEY_PATH` | **Required** | — | Absolute path to the RS256 public key PEM file. Generate: `openssl rsa -in private.pem -pubout -out public.pem` |
| `JWT_ACCESS_TTL` | Optional | `900` | Access token TTL in seconds (default: 15 minutes) |
| `JWT_REFRESH_TTL` | Optional | `604800` | Refresh token TTL in seconds (default: 7 days) |
| `CORS_ALLOWED_ORIGINS` | **Required** | — | Comma-separated list of allowed origins. Example: `https://vallexis.io,http://localhost:5173` |
| `GITHUB_CLIENT_ID` | Optional | — | GitHub OAuth App client ID. Create at: https://github.com/settings/developers |
| `GITHUB_CLIENT_SECRET` | Optional | — | GitHub OAuth App client secret |
| `GOOGLE_CLIENT_ID` | Optional | — | Google OAuth 2.0 client ID. Create at: https://console.cloud.google.com/apis/credentials |
| `GOOGLE_CLIENT_SECRET` | Optional | — | Google OAuth 2.0 client secret |
| `OAUTH_REDIRECT_BASE_URL` | Optional | `http://localhost:3000` | Base URL for OAuth callback URLs. Set to production API URL in prod |
| `INTERNAL_SECRET` | **Required** | — | Shared HMAC secret for internal service-to-service calls. Generate: `openssl rand -hex 32` |
| `ADMIN_EMAIL` | Optional | — | Email address granted admin role on first login |

### Example

```env
API_PORT=3000
API_ENV=development
DATABASE_URL=postgres://vallexis:vallexis_dev@localhost:5432/vallexis_db?sslmode=disable
REDIS_URL=redis://:devpassword@localhost:6379/0
JWT_PRIVATE_KEY_PATH=/run/secrets/jwt_private.pem
JWT_PUBLIC_KEY_PATH=/run/secrets/jwt_public.pem
CORS_ALLOWED_ORIGINS=http://localhost:5173
INTERNAL_SECRET=replace_with_32_byte_hex_secret
```

---

## deploy-service

Service running on port `3001`. Manages Git cloning, Docker builds, and container lifecycle.

| Variable | Required | Default | Description |
|---|---|---|---|
| `DEPLOY_PORT` | Optional | `3001` | HTTP port for the deploy service |
| `DATABASE_URL` | **Required** | — | Same PostgreSQL connection string as api-gateway |
| `REDIS_URL` | **Required** | — | Same Redis connection string as api-gateway |
| `INTERNAL_SECRET` | **Required** | — | Must match the value set in api-gateway |
| `DEPLOY_WORK_DIR` | Optional | `/tmp/builds` | Scratch directory for Git clones and Docker build contexts. Ensure sufficient disk space |
| `DEPLOY_MAX_CONCURRENT` | Optional | `3` | Maximum simultaneous Docker builds. Increase cautiously — each build can spike RAM |
| `DEPLOY_BUILD_TIMEOUT` | Optional | `300` | Maximum time in seconds for a Docker build before it is killed |
| `DEPLOY_HEALTH_TIMEOUT` | Optional | `60` | Maximum time in seconds to wait for a container health check after start |
| `GITHUB_WEBHOOK_SECRET` | **Required** | — | HMAC secret for verifying GitHub webhook payloads. Set in GitHub repo → Settings → Webhooks |
| `GITLAB_WEBHOOK_SECRET` | Optional | — | HMAC secret for GitLab webhook payloads |
| `DOCKER_HOST` | Optional | `unix:///var/run/docker.sock` | Docker daemon socket. Use TCP for remote Docker hosts |
| `USER_CONTAINER_NETWORK` | Optional | `vallexis-apps` | Docker network name for user-deployed containers |
| `USER_CONTAINER_MEMORY_LIMIT` | Optional | `512m` | Memory limit per user container (Docker format) |
| `USER_CONTAINER_CPU_QUOTA` | Optional | `50000` | CPU quota per container (50000 = 50% of one CPU core) |

### Example

```env
DEPLOY_PORT=3001
DEPLOY_WORK_DIR=/data/builds
DEPLOY_MAX_CONCURRENT=2
GITHUB_WEBHOOK_SECRET=replace_with_webhook_secret
```

---

## payment-service

Service running on port `3002`. Handles PayMongo payment links, subscriptions, webhooks, and invoices.

| Variable | Required | Default | Description |
|---|---|---|---|
| `PAYMENT_PORT` | Optional | `3002` | HTTP port for the payment service |
| `DATABASE_URL` | **Required** | — | Same PostgreSQL connection string |
| `REDIS_URL` | **Required** | — | Same Redis connection string |
| `INTERNAL_SECRET` | **Required** | — | Must match api-gateway value |
| `PAYMONGO_SECRET_KEY` | **Required** | — | PayMongo secret API key. Get from: https://dashboard.paymongo.com/developers. Use `sk_test_...` for dev, `sk_live_...` for prod |
| `PAYMONGO_PUBLIC_KEY` | **Required** | — | PayMongo public API key. Use `pk_test_...` for dev, `pk_live_...` for prod |
| `PAYMONGO_WEBHOOK_SECRET` | **Required** | — | Signing secret for PayMongo webhooks. Set in PayMongo Dashboard → Developers → Webhooks |
| `PAYMONGO_PRO_PRICE_ID` | **Required** | — | PayMongo Price/Product ID for the Pro monthly plan |
| `PAYMONGO_PRO_YEARLY_ID` | Optional | — | PayMongo Price/Product ID for Pro annual plan |
| `FRONTEND_URL` | **Required** | — | Base URL of the frontend — used for PayMongo payment link success/cancel redirect URLs. Example: `https://app.vallexis.io` |

### PayMongo Webhook Events to Subscribe

Configure your PayMongo webhook endpoint in the Dashboard to receive these events:

```
payment.paid
payment.failed
source.chargeable
subscription.created
subscription.updated
subscription.cancelled
subscription.payment_success
subscription.payment_failed
```

### Example

```env
PAYMENT_PORT=3002
PAYMONGO_SECRET_KEY=sk_test_...
PAYMONGO_PUBLIC_KEY=pk_test_...
PAYMONGO_WEBHOOK_SECRET=whsk_...
PAYMONGO_PRO_PRICE_ID=price_xxx...
FRONTEND_URL=http://localhost:5173
```

---

## seo-service

Service running on port `3003`. Runs Lighthouse audits and generates sitemaps.

| Variable | Required | Default | Description |
|---|---|---|---|
| `SEO_PORT` | Optional | `3003` | HTTP port for the SEO service |
| `DATABASE_URL` | **Required** | — | Same PostgreSQL connection string |
| `INTERNAL_SECRET` | **Required** | — | Must match api-gateway value |
| `CHROME_PATH` | Optional | `/usr/bin/chromium-browser` | Path to the Chromium/Chrome binary used by Lighthouse |
| `LIGHTHOUSE_THROTTLE` | Optional | `true` | Enable CPU/network throttling in Lighthouse (disable in CI for speed) |
| `SEO_AUDIT_CONCURRENCY` | Optional | `2` | Max simultaneous Lighthouse audits |
| `SEO_AUDIT_TIMEOUT` | Optional | `120` | Timeout in seconds per Lighthouse audit |
| `SEO_SCORE_DROP_THRESHOLD` | Optional | `10` | Alert user via email if any score drops by more than this many points vs. prior week |

### Example

```env
SEO_PORT=3003
CHROME_PATH=/usr/bin/chromium-browser
SEO_AUDIT_CONCURRENCY=1
```

---

## PostgreSQL

| Variable | Required | Default | Description |
|---|---|---|---|
| `POSTGRES_USER` | **Required** | — | PostgreSQL superuser name for the container. Example: `vallexis` |
| `POSTGRES_PASSWORD` | **Required** | — | PostgreSQL superuser password. Generate: `openssl rand -base64 24` |
| `POSTGRES_DB` | **Required** | — | Database name. Example: `vallexis_db` |
| `POSTGRES_MAX_CONNECTIONS` | Optional | `100` | Max simultaneous connections. Increase if using many services |
| `POSTGRES_SHARED_BUFFERS` | Optional | `256MB` | Shared buffer size. Rule of thumb: 25% of total RAM |

---

## Redis

| Variable | Required | Default | Description |
|---|---|---|---|
| `REDIS_PASSWORD` | **Required** | — | Redis `requirepass` value. Generate: `openssl rand -base64 24` |
| `REDIS_MAX_MEMORY` | Optional | `256mb` | Maximum Redis memory before eviction policy kicks in |
| `REDIS_MAX_MEMORY_POLICY` | Optional | `allkeys-lru` | Eviction policy when `maxmemory` is reached |

---

## MinIO

| Variable | Required | Default | Description |
|---|---|---|---|
| `MINIO_ROOT_USER` | **Required** | — | MinIO root user (equivalent to AWS access key). Example: `vallexis-admin` |
| `MINIO_ROOT_PASSWORD` | **Required** | — | MinIO root password. Must be ≥8 chars. Generate: `openssl rand -base64 24` |
| `MINIO_BUCKET` | Optional | `vallexis` | Default storage bucket name |
| `MINIO_ENDPOINT` | Optional | `http://minio:9000` | MinIO endpoint URL used by app services. Use internal Docker hostname |
| `MINIO_PUBLIC_URL` | **Required** | — | Public URL for accessing stored files. Example: `https://storage.vallexis.io` |
| `STORAGE_FREE_LIMIT_BYTES` | Optional | `2147483648` | Storage limit for free-tier users (bytes). Default: 2 GB |
| `STORAGE_PRO_LIMIT_BYTES` | Optional | `5368709120` | Storage limit per project for Pro users (bytes). Default: 5 GB/project (10 GB total for 2 projects) |

---

## Email

Email is used for welcome messages, invoice receipts, deploy failure alerts, and SEO score drops.

| Variable | Required | Default | Description |
|---|---|---|---|
| `EMAIL_PROVIDER` | Optional | `sendgrid` | Email provider: `sendgrid` or `resend` |
| `SENDGRID_API_KEY` | Optional | — | SendGrid API key. Required if `EMAIL_PROVIDER=sendgrid`. Get from: https://app.sendgrid.com/settings/api_keys |
| `RESEND_API_KEY` | Optional | — | Resend API key. Required if `EMAIL_PROVIDER=resend`. Get from: https://resend.com/api-keys |
| `EMAIL_FROM_ADDRESS` | **Required** | — | Sender email address. Example: `noreply@vallexis.io`. Must be verified with your provider |
| `EMAIL_FROM_NAME` | Optional | `Vallexis` | Display name for outbound emails |
| `EMAIL_ALERTS_ADDRESS` | Optional | — | Internal address for operational alerts (deploy failures, cost warnings). Example: `oncall@vallexis.io` |

---

## Observability

| Variable | Required | Default | Description |
|---|---|---|---|
| `PROMETHEUS_PORT` | Optional | `9090` | Prometheus scrape port (internal) |
| `GRAFANA_PORT` | Optional | `3100` | Grafana dashboard port (internal) |
| `GRAFANA_ADMIN_USER` | Optional | `admin` | Grafana admin username |
| `GRAFANA_ADMIN_PASSWORD` | **Required** | — | Grafana admin password. Generate: `openssl rand -base64 16` |
| `SENTRY_DSN` | Optional | — | Sentry DSN for error tracking (planned Q3 2026). Leave empty to disable |

---

## Feature Flags

Simple boolean flags to enable or disable features at runtime. Set to `true` or `false`.

| Variable | Default | Description |
|---|---|---|
| `FEATURE_OAUTH_GITHUB` | `true` | Enable GitHub OAuth sign-in |
| `FEATURE_OAUTH_GOOGLE` | `true` | Enable Google OAuth sign-in |
| `FEATURE_CUSTOM_DOMAINS` | `false` | Enable custom domain configuration (Pro plan). Set `true` when Cloudflare API is configured |
| `FEATURE_DEPLOY_PREVIEWS` | `false` | Enable per-PR deploy preview environments |
| `FEATURE_TEAM_COLLABORATION` | `false` | Enable project member invites |
| `FEATURE_SEO_AUDITS` | `true` | Enable automated weekly SEO audits |
| `FEATURE_MAINTENANCE_MODE` | `false` | If `true`, the API returns 503 for all non-health requests |

---

## Secrets Generation Reference

```bash
# JWT RSA key pair
openssl genrsa -out jwt_private.pem 4096
openssl rsa -in jwt_private.pem -pubout -out jwt_public.pem

# Shared internal service secret (32 bytes hex)
openssl rand -hex 32

# Database and Redis passwords (base64, URL-safe)
openssl rand -base64 24

# Grafana admin password
openssl rand -base64 16
```

Store secrets in Docker secrets, OCI Vault, or a secrets manager. Never store them in plain `.env` files on production servers.
