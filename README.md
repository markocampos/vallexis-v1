# Vallexis

> **All-in-one PaaS for solo founders and small teams.**  
> Deploy. Monetise. Grow. — without enterprise costs.

<!-- Pipeline, Health & Metrics -->
[![Build Status](https://img.shields.io/github/actions/workflow/status/markocampos/vallexis-v1/ci.yml?branch=main&label=build&logo=github)](https://github.com/markocampos/vallexis-v1/actions)
[![Uptime](https://img.shields.io/website?down_color=red&down_message=offline&label=uptime&up_color=success&up_message=online&url=https%3A%2F%2Fvallexis.io)](https://status.vallexis.io)[![Repo Size](https://img.shields.io/github/repo-size/markocampos/vallexis-v1)](https://github.com/markocampos/vallexis-v1)
[![Latest Release](https://img.shields.io/github/v/tag/markocampos/vallexis-v1?label=version&color=blue)](docs/CHANGELOG.md)
[![License](https://img.shields.io/badge/license-MIT-green)](#license)
[![Issues Open](https://img.shields.io/github/issues/markocampos/vallexis-v1?color=orange)](https://github.com/markocampos/vallexis-v1/issues)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](docs/CONTRIBUTING.md)
[![Security Scanned](https://img.shields.io/badge/security-Trivy_scanned-blueviolet.svg)](.github/workflows/ci.yml)

<!-- Core Architecture & Infrastructure -->
[![Go](https://img.shields.io/badge/Go-1.22%2B-00ADD8?style=flat&logo=go&logoColor=white)](https://go.dev)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-316192?style=flat&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-DC382D?style=flat&logo=redis&logoColor=white)](https://redis.io/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat&logo=docker&logoColor=white)](https://www.docker.com/)
[![Infrastructure](https://img.shields.io/badge/Oracle_Cloud-ARM_A1-F80000?logo=oracle&logoColor=white)](https://www.oracle.com/cloud/)

---

## What is Vallexis?

Vallexis replaces the fragmented stack of hosting providers, payment dashboards, SEO tools, and storage buckets with a single platform — designed for founders who want to ship, not babysit servers.

```
┌─────────────────────────────────────────────────────────┐
│  git push origin main                                   │
│       └──► live in < 60 seconds                         │
│                                                         │
│  Built-in PayMongo payments ──►  no config              │
│  Free .vallexis.io subdomain ──►  instant SSL           │
│  Weekly Lighthouse audits   ──►  SEO on autopilot       │
│  S3-compatible storage      ──►  2 GB free              │
└─────────────────────────────────────────────────────────┘
```

---

## Features

| Feature | Free | Pro (₱249/mo ~$4) |
|---|---|---|
| Projects | 1 | 2 |
| One-click Git deploy | ✅ | ✅ |
| Free `.vallexis.io` subdomain + SSL | ✅ | ✅ |
| Built-in PayMongo payments | ✅ | ✅ |
| SEO audit toolkit (weekly Lighthouse) | ✅ | ✅ |
| S3-compatible storage | 2 GB | 10 GB (5 GB × 2 projects) |
| Custom domains | ❌ | ✅ |
| Deploy previews per PR | ❌ | ✅ |
| Team collaboration (3 members) | ❌ | ✅ |
| Priority support | ❌ | ✅ |

---

## Tech Stack

```
Backend   Go 1.22  ·  go-chi/chi  ·  PostgreSQL 16  ·  Redis 7
Frontend  React 18  ·  Vite 5  ·  TypeScript
Infra     Oracle Cloud ARM A1  ·  Docker Compose  ·  Caddy  ·  MinIO
```

---

## Quick Start

### Prerequisites

- Docker 27+ and Docker Compose 2+
- Go 1.22+ (for local development without Docker)
- Node.js 20+ (for frontend development)

### 1. Clone & configure

```bash
git clone https://github.com/vallexis/vallexis.git
cd vallexis
cp .env.example .env
# Edit .env with your credentials (see docs/ENV.md for all variables)
```

### 2. Start all services

```bash
docker compose up -d
```

### 3. Verify everything is running

```bash
curl http://localhost:3000/api/health | jq .
# {"status":"ok","version":"0.2.0"}
```

### 4. Open the dashboard

```
http://localhost:5173
```

For a full local setup walkthrough, including seeding the database and configuring PayMongo webhooks, see **[docs/ONBOARDING.md](docs/ONBOARDING.md)**.

---

## Documentation

| Document | Description |
|---|---|
| [ONBOARDING.md](docs/ONBOARDING.md) | First-day dev setup guide |
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | System design, services, data flows, DB schema |
| [API.md](docs/API.md) | REST API reference |
| [ENV.md](docs/ENV.md) | Environment variable reference |
| [DESIGN.md](docs/DESIGN.md) | Design system — colors, typography, components |
| [SECURITY.md](docs/SECURITY.md) | Security policies, threat model, compliance |
| [RUNBOOK.md](docs/RUNBOOK.md) | Operational runbook, incident response |
| [AGENTS.md](docs/AGENTS.md) | Automated background agents |
| [TESTING.md](docs/TESTING.md) | Testing strategy and how to run tests |
| [CONTRIBUTING.md](docs/CONTRIBUTING.md) | How to contribute |
| [DECISIONS.md](docs/DECISIONS.md) | Architecture decision records |
| [PLAN.md](docs/PLAN.md) | Vision, mission, target audience |
| [ROADMAP.md](docs/ROADMAP.md) | Feature roadmap |
| [CHANGELOG.md](docs/CHANGELOG.md) | Version history |
| [SKILL.md](docs/SKILL.md) | Platform capabilities reference |
| [PRODUCTION.md](docs/PRODUCTION.md) | Production deployment guide |
| [INFRASTRUCTURE.md](docs/INFRASTRUCTURE.md) | Infrastructure provisioning (OCI, Cloudflare) |
| [DOMAINS.md](docs/DOMAINS.md) | Custom domain setup guide |
| [MIGRATIONS.md](docs/MIGRATIONS.md) | Database migration guide |
| [OBSERVABILITY.md](docs/OBSERVABILITY.md) | Monitoring, metrics, and alerting setup |
| [DISASTER-RECOVERY.md](docs/DISASTER-RECOVERY.md) | Disaster recovery plan and playbooks |
| [API-VERSIONING.md](docs/API-VERSIONING.md) | API versioning and deprecation policy |

---

## Project Structure

```
vallexis/
├── src/                    # Application source code
│   ├── api-gateway/        # Auth, users, projects, billing (Go)
│   ├── deploy-service/     # Git builds, container lifecycle (Go)
│   ├── payment-service/    # PayMongo integration (Go)
│   ├── seo-service/        # Lighthouse audits (Go)
│   └── frontend/           # React + Vite dashboard
├── docs/                   # All project documentation
├── scripts/                # Utility and deployment scripts
├── tests/                  # Integration and end-to-end tests
├── docker-compose.yml      # Full stack orchestration
├── docker-compose.dev.yml  # Development overrides
└── .env.example            # Environment variable template
```

---

## Contributing

Pull requests are welcome. Please read **[docs/CONTRIBUTING.md](docs/CONTRIBUTING.md)** before opening a PR.

Key points:
- All PRs require passing CI (tests + linter + Trivy scan)
- Follow the commit message convention (`feat:`, `fix:`, `docs:`, `chore:`)
- Security issues → `security@vallexis.io` (do **not** open a public issue)

---

## License

MIT © 2026 Vallexis. See [LICENSE](LICENSE) for details.

---

*Inspired by the rare and resilient Blue Iguana — distinctive, exotic, and built to last.*
