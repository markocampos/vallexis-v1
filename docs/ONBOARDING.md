# ONBOARDING.md — Developer Onboarding Guide

> **Version:** 0.1.0
> **Last Updated:** June 23, 2026
> **Time to complete:** ~30 minutes for a first-time setup

Welcome to the Vallexis engineering team. This guide walks you through getting a full local development environment running from scratch — from zero to a working dashboard with all services live.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Clone & Configure](#clone--configure)
3. [Start Infrastructure](#start-infrastructure)
4. [Run Migrations](#run-migrations)
5. [Seed Development Data](#seed-development-data)
6. [Start Backend Services](#start-backend-services)
7. [Start the Frontend](#start-the-frontend)
8. [Configure PayMongo Webhooks](#configure-paymongo-webhooks)
9. [Verify Everything Works](#verify-everything-works)
10. [Development Tips](#development-tips)
11. [Common Problems](#common-problems)

---

## Prerequisites

Install these before you begin:

| Tool | Version | Install |
|---|---|---|
| **Docker** | 27+ | https://docs.docker.com/get-docker/ |
| **Docker Compose** | 2+ | Bundled with Docker Desktop |
| **Go** | 1.22+ | https://go.dev/dl/ |
| **Node.js** | 20+ | https://nodejs.org/ |
| **make** | any | `sudo apt install make` (Linux) or `brew install make` (macOS) |
| **ngrok** | latest | https://ngrok.com/download |

Verify your setup:

```bash
docker --version     # Docker version 27.x.x
go version           # go1.22.x
node --version       # v20.x.x
ngrok --version      # ngrok version x.x.x
```

---

## Clone & Configure

```bash
# Clone the repository
git clone https://github.com/vallexis/vallexis.git
cd vallexis

# Create your local env file
cp .env.example .env
```

Open `.env` in your editor. You need to fill in the following at minimum to get started:

| Variable | Where to get it |
|---|---|
| `PAYMONGO_SECRET_KEY` | https://dashboard.paymongo.com/developers — use `sk_test_...` |
| `PAYMONGO_PUBLIC_KEY` | Same page — use `pk_test_...` |
| `PAYMONGO_WEBHOOK_SECRET` | Will be provided in [Step 8](#configure-paymongo-webhooks) |
| `PAYMONGO_PRO_PRICE_ID` | Create a product in PayMongo Dashboard → Products |
| `GITHUB_WEBHOOK_SECRET` | Any random string for local dev (e.g. `openssl rand -hex 16`) |
| `INTERNAL_SECRET` | Generate: `openssl rand -hex 32` |
| `JWT_PRIVATE_KEY_PATH` / `JWT_PUBLIC_KEY_PATH` | See below |

### Generate JWT Keys

```bash
# From the project root
mkdir -p secrets
openssl genrsa -out secrets/jwt_private.pem 4096
openssl rsa -in secrets/jwt_private.pem -pubout -out secrets/jwt_public.pem

# Update .env:
# JWT_PRIVATE_KEY_PATH=./secrets/jwt_private.pem
# JWT_PUBLIC_KEY_PATH=./secrets/jwt_public.pem
```

> [!CAUTION]
> The `secrets/` directory is in `.gitignore`. Never commit key files.

---

## Start Infrastructure

Start only the infrastructure services first (database, cache, storage):

```bash
docker compose -f docker-compose.dev.yml up -d postgres redis minio
```

Wait ~10 seconds, then verify:

```bash
# PostgreSQL
docker exec vallexis-postgres pg_isready -U vallexis
# output: /var/run/postgresql:5432 - accepting connections

# Redis
docker exec vallexis-redis redis-cli ping
# output: PONG

# MinIO
curl -sf http://localhost:9000/minio/health/live && echo "MinIO OK"
# output: MinIO OK
```

**MinIO console:** http://localhost:9001  
Login: `minioadmin` / `minioadmin` (development only)

---

## Run Migrations

Migrations apply the database schema and any pending changes.

```bash
make migrate
```

Expected output:
```
Applying migration 001_initial_schema.sql ... OK
Applying migration 002_add_audit_log.sql ... OK
Applying migration 003_add_seo_audits.sql ... OK
All migrations applied.
```

If you see an error, ensure PostgreSQL is running (`docker compose ps`) and your `DATABASE_URL` in `.env` is correct.

---

## Seed Development Data

Seeding creates test data to work with immediately — test users, sample projects, and demo deploys.

```bash
make seed
```

This creates:

| Resource | Details |
|---|---|
| Free user | `free@example.com` / `TestPass123!` |
| Pro user | `pro@example.com` / `TestPass123!` |
| Sample project | "My Test App" (deployed state) |
| Sample deploys | 5 historical deploy records |
| Sample SEO audit | Scores: perf 87, a11y 92, seo 95 |

---

## Start Backend Services

We use [Air](https://github.com/air-verse/air) for hot-reload during Go development.

```bash
# Install Air (one-time)
go install github.com/air-verse/air@latest

# Start all backend services with hot-reload
make dev-backend
```

This starts:
- `api-gateway` on `:3000`
- `deploy-service` on `:3001`
- `payment-service` on `:3002`
- `seo-service` on `:3003`

Each service gets its own terminal pane / log stream.

Alternatively, to start a single service for focused development:

```bash
make dev-api       # Only api-gateway
make dev-deploy    # Only deploy-service
make dev-payment   # Only payment-service
make dev-seo       # Only seo-service
```

---

## Start the Frontend

```bash
cd src/frontend

# Install dependencies (first time only)
npm install

# Start Vite dev server
npm run dev
```

**Dashboard:** http://localhost:5173

The frontend proxies API requests to `http://localhost:3000` automatically via the Vite dev server config.

---

## Configure PayMongo Webhooks

For payment features to work locally, you need PayMongo to forward webhook events to your running `payment-service`. Use ngrok to create a public tunnel:

```bash
# Start the tunnel to your local payment service
ngrok http 3002
```

You'll see output like:
```
Forwarding  https://abc123def456.ngrok.io -> http://localhost:3002
```

Now:
1. Go to [PayMongo Dashboard → Developers → Webhooks](https://dashboard.paymongo.com/developers)
2. Click **Add Endpoint**
3. Set URL to: `https://abc123def456.ngrok.io/webhooks/paymongo`
4. Enable all **payment** and **subscription** events
5. Copy the **Webhook Secret** shown after saving

Set it in `.env`:
```env
PAYMONGO_WEBHOOK_SECRET=whsk_xxxxxxxxxxxxxxxx
```

Then restart the payment service so it picks up the new value.

---

## Verify Everything Works

Run through this checklist to confirm your environment is healthy:

### Health Checks

```bash
# All backend services
curl -s http://localhost:3000/api/health | jq .   # {"status":"ok","version":"0.1.0"}
curl -s http://localhost:3001/health | jq .
curl -s http://localhost:3002/health | jq .
curl -s http://localhost:3003/health | jq .
```

### Auth Flow

```bash
# Register
curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"free@example.com","password":"TestPass123!"}' | jq .

# You should receive an access_token and user object
```

### Dashboard

1. Open http://localhost:5173
2. Log in with `free@example.com` / `TestPass123!`
3. You should see the dashboard with the seeded project

### Full Deploy Test

1. In the dashboard, open the "My Test App" project
2. Click **Trigger Deploy**
3. Watch the log stream appear in real time
4. Deploy should complete with status `success`

---

## Development Tips

### Useful Make Commands

```bash
make help           # List all available make commands
make test           # Run all Go tests
make lint           # Run golangci-lint
make fmt            # Format all Go code
make migrate        # Apply pending migrations
make migrate-down   # Roll back last migration
make seed           # Seed development data
make scan           # Run Trivy security scan on all images
make build          # Build all Docker images
make logs           # Tail all service logs
make reset-db       # Drop and recreate the database (destructive!)
```

### VS Code Recommended Extensions

Install these for the best experience:

```json
{
  "recommendations": [
    "golang.go",
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next",
    "eamodio.gitlens",
    "ms-azuretools.vscode-docker"
  ]
}
```

### Working with the Database

```bash
# Open a psql shell
docker exec -it vallexis-postgres psql -U vallexis -d vallexis_db

# Inspect a table
\d users
SELECT * FROM users LIMIT 5;
\q
```

### Working with MinIO

```bash
# Install mc (MinIO Client)
curl -O https://dl.min.io/client/mc/release/linux-amd64/mc
chmod +x mc && sudo mv mc /usr/local/bin/

# Configure alias
mc alias set local http://localhost:9000 minioadmin minioadmin

# List files
mc ls local/vallexis

# Upload a file
mc cp myfile.png local/vallexis/test/
```

### Viewing Logs

```bash
# All services
make logs

# Specific service
docker compose logs -f api-gateway
docker compose logs -f deploy-service

# With grep
docker compose logs api-gateway | grep -i error
```

---

## Common Problems

### `make migrate` fails with "connection refused"

PostgreSQL isn't ready yet. Wait ~10 more seconds and retry:
```bash
docker compose -f docker-compose.dev.yml ps postgres
# State should be "healthy", not "starting"
```

### PayMongo webhook not receiving events

Ensure the webhook endpoint URL in PayMongo Dashboard matches your ngrok URL exactly. Run `ngrok http 3002` and update the endpoint URL in the dashboard if it changed.

### Frontend shows blank page / network errors

Ensure the api-gateway is running on `:3000`:
```bash
curl http://localhost:3000/api/health
```

Also check that `CORS_ALLOWED_ORIGINS=http://localhost:5173` is set in `.env`.

### Go services fail to start with "no such file or directory" (JWT keys)

Run the key generation step again and verify the paths in `.env` are absolute or correctly relative to where you run `make dev-backend`.

### Port already in use

```bash
# Find what's using port 3000
sudo ss -tlnp | grep :3000
# or
lsof -i :3000

# Kill it
kill -9 <PID>
```

### Docker runs out of disk space

```bash
docker system df           # See what's using space
docker system prune -f     # Remove dangling resources
docker image prune -a -f   # Remove all unused images (more aggressive)
```

---

## Next Steps

After your environment is running:

1. **Read the architecture** — [ARCHITECTURE.md](ARCHITECTURE.md) explains every service, data flow, and DB schema.
2. **Read the API** — [API.md](API.md) documents every endpoint.
3. **Read the design system** — [DESIGN.md](DESIGN.md) covers all UI tokens and components.
4. **Read contributing guide** — [CONTRIBUTING.md](CONTRIBUTING.md) covers the PR process and code standards.
5. **Pick up a ticket** — Check the GitHub Issues board for `good-first-issue` or `help-wanted` labels.

Welcome to the team. 🦎
