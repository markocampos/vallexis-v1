# AGENTS.md — Coding Agent Guide

> Instructions for AI coding agents working in this repo. Read this before making changes.

## Project Overview

Vallexis is a PaaS for solo founders — deploy, monetize, grow. Go backend (4 services), React frontend, PostgreSQL, Redis, MinIO, Caddy, Docker Compose.

**Module path**: `github.com/markocampos/vallexis-v1`

## Architecture (critical to understand)

All API routes live in `src/api-gateway/`. The other three Go services (`deploy-service`, `payment-service`, `seo-service`) are stubs with only `/health` endpoints. Do not add routes to the stub services — everything goes in api-gateway.

```
src/
├── api-gateway/       # THE backend — all routes, auth, billing, storage, SEO, deploys
│   ├── auth/          # Register, login, OAuth, JWT middleware
│   ├── billing/       # Subscription, usage, checkout
│   ├── deploys/       # Deploy CRUD + SSE streaming
│   ├── projects/      # Project CRUD
│   ├── seo/           # Lighthouse audit triggers
│   ├── storage/       # File upload/delete (local filesystem, NOT MinIO)
│   └── users/         # Profile, settings, password, account delete
├── deploy-service/    # Stub — /health only
├── payment-service/   # Stub — /health only
├── seo-service/       # Stub — /health only
├── frontend/          # React 19 + Vite 8 + TypeScript 6
└── internal/          # Shared Go packages
    ├── config/        # .env loader
    ├── database/      # PostgreSQL connection (pgx + sqlx)
    ├── cache/         # Redis connection
    └── httpx/         # Router, JSON helpers, CORS middleware
```

## Commands

### Backend (Go)

```bash
make test              # go test ./... -v -count=1
make lint              # golangci-lint run ./...
make fmt               # gofmt -s -w . && goimports -w .
make dev-backend       # All 4 services with hot-reload (Air)
make dev-api           # Single service: api-gateway
make dev-deploy        # Single service: deploy-service
make dev-payment       # Single service: payment-service
make dev-seo           # Single service: seo-service
make migrate           # Apply SQL migrations from migrations/
make seed              # Seed dev data (scripts/seed.sql)
make scan              # Trivy security scan
```

### Frontend (src/frontend/)

```bash
cd src/frontend
npm ci --frozen-lockfile   # Install deps (use ci, not install)
npm run lint               # oxlint (NOT eslint)
npm run test               # vitest (interactive)
npm run test:ci            # vitest run (single pass)
npm run test:coverage      # vitest run --coverage
npm run build              # tsc -b && vite build
npm run dev                # Vite dev server → http://localhost:5173
```

### CI Pipeline Order

Lint → Test → Build → Scan → Deploy (runs in GitHub Actions on PR and push to main).

## Required Order for Verification

```bash
make lint && make test          # Backend
cd src/frontend && npm run lint && npm run test:ci   # Frontend
```

CI enforces: Go lint+test must pass before Docker builds; frontend lint+test must pass before frontend build.

## Key Gotchas

- **No .air.toml in repo** — Air is expected to be installed globally (`go install github.com/air-verse/air@latest`). The Makefile references `.air.toml` but it's not committed. Create one if needed or run services directly with `go run ./src/api-gateway`.
- **Frontend api.ts** (`src/frontend/src/lib/api.ts`) always sends `Content-Type: application/json`. File uploads (storage page) work around this with raw `fetch`. Do not try to use the api client for FormData.
- **Storage uses local filesystem** (`uploads/<userID>/`), not MinIO — despite MinIO being in docker-compose.
- **All routes are prefixed `/api/v1/`** except health at `/api/health`.
- **JWT keys** must exist at paths in `.env` (`JWT_PRIVATE_KEY_PATH`, `JWT_PUBLIC_KEY_PATH`). Generate with `openssl genrsa` / `openssl rsa` — see docs/ONBOARDING.md.
- **CORS**: `CORS_ALLOWED_ORIGINS` must be set in `.env` or API calls from the frontend fail silently.
- **Password validation**: Backend requires 12+ chars with uppercase, lowercase, digit, and special char. Frontend must match.
- **Solid buttons only**: Use `bg-blue-primary`, NOT gradients like `bg-gradient-to-r from-blue-primary to-purple-primary`. Gradients are unreadable with white text.
- **Light mode only**: Do not use dark mode classes (`dark:`) or theme switching logic. The application is strictly light-mode only.
- **Cookie-based Session Auth**: JWT access and refresh tokens are stored in secure, HttpOnly, SameSite=Strict cookies. Do not read/write tokens using `localStorage`. The ApiClient automatically handles token transmission and refresh.
- **Brand icons**: Use `react-icons/fa` for GitHub/Google logos — Lucide has no brand icons.
- **Database migrations**: Plain SQL files in `migrations/`, applied via `make migrate` which runs them in order against the Docker postgres container. No migration framework — ordering is filename-based.
- **Docker builds**: All Dockerfiles use BuildKit syntax with `--mount=type=cache` for Go modules and npm. Build context is the repo root for Go services, `src/frontend/` for frontend.

## Testing

- **Go tests**: `*_test.go` files colocated with source. CI spins up postgres:16-alpine and redis:7-alpine as service containers. Tests need `DATABASE_URL` and `REDIS_URL` env vars.
- **Frontend tests**: Vitest with jsdom. Setup file at `src/test/setup.ts`. Coverage thresholds: 60% branches/functions/lines/statements. Path alias `@/` maps to `./src/`.

## Frontend Conventions

- **Path alias**: `@/` → `./src/` (configured in tsconfig.json and vite.config.ts)
- **UI library**: shadcn/ui (New York style) with Radix primitives, Tailwind CSS 4, `class-variance-authority`, `clsx`, `tailwind-merge`
- **State**: TanStack Query v5 for server state, React Router v7 for routing
- **Forms**: react-hook-form + zod validation
- **Linter**: oxlint (NOT eslint) — see `src/frontend/.oxlintrc.json`

## Documentation

All docs live in `docs/`. The file `docs/AGENTS.md` documents automated background agents (monitoring, CI/CD bots) — it is NOT coding agent instructions. This file is.

Key docs: ARCHITECTURE.md, API.md, DESIGN.md, ENV.md, ONBOARDING.md, CONTRIBUTING.md, TESTING.md.
