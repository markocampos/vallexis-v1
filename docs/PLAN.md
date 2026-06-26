# PLAN.md — Vallexis Project Plan

> **Version:** 0.1.0
> **Last Updated:** June 23, 2026
> **Status:** Active — Phase 1 (Foundation)

---

## Table of Contents

1. [Vision & Mission](#vision--mission)
2. [Target Audience](#target-audience)
3. [Value Proposition](#value-proposition)
4. [Objectives & KPIs](#objectives--kpis)
5. [Tech Stack Strategy](#tech-stack-strategy)
6. [Constraints & Principles](#constraints--principles)
7. [Go-to-Market](#go-to-market)

---

## Vision & Mission

**Vision:** The all-in-one PaaS for solo entrepreneurs and small teams to launch, host, monetize, and grow web products — without enterprise costs or DevOps complexity.

**Mission:**
- Eliminate infrastructure friction for non-technical and semi-technical founders.
- Unify hosting, payments, SEO, and asset storage into one cohesive platform.
- Stay genuinely budget-first — the free tier must be useful, not crippled.
- Ship continuously — small weekly improvements over big-bang releases.
- Remain solo-operator sustainable: one person must be able to run this.

---

## Target Audience

| Segment | Description | Key Pain Points |
|---|---|---|
| **Solo Founders** | Building their first SaaS or side project | No DevOps skills, limited budget, need to move fast |
| **Freelancers** | Delivering client websites + payment collection | Juggling multiple hosting providers and invoicing tools |
| **Small Teams (1–10)** | Early-stage startups, micro-ISVs | Need reliability without hiring an SRE |
| **Side Projecters** | Indie hackers, open source authors | Don't want to babysit servers; prefer "set and forget" |

### Anti-Persona

Vallexis is **not** targeting:
- Enterprise customers requiring SOC 2, SSO, or multi-region (these are 2027+ aspirations).
- Developers who need full bare-metal control or Kubernetes.
- High-traffic platforms (>100K MAU) that have outgrown single-node architecture.

---

## Value Proposition

```
┌──────────────────────────────────────────────────────────────┐
│  Without Vallexis               With Vallexis               │
│  ────────────────────────────   ─────────────────────────── │
│  Heroku / Railway (hosting)  ┐                               │
│  PayMongo dashboard setup   │  One platform.               │
│  Google Search Console       ├► One bill.                   │
│  S3 + CloudFront             │  Live in < 60 seconds.       │
│  Separate invoicing tool     ┘                               │
└──────────────────────────────────────────────────────────────┘
```

**Core differentiators vs. competition:**

| Feature | Vallexis | Railway | Render | Vercel |
|---|---|---|---|---|
| Built-in PayMongo payments | ✅ | ❌ | ❌ | ❌ |
| Built-in SEO audits | ✅ | ❌ | ❌ | ❌ |
| S3-compatible storage | ✅ | ❌ | ❌ | ❌ |
| Always-free tier | ✅ (1 project) | ✅ (limited) | ✅ (limited) | ✅ (limited) |
| ARM-native (cost-efficient) | ✅ | ❌ | ❌ | ❌ |
| GDPR compliant | ✅ | ✅ | ✅ | ✅ |

---

## Objectives & KPIs

### Phase 1 — Foundation (Now → Sept 2026)

| Objective | KPI | Target |
|---|---|---|
| Launch freemium | Free projects/user | 1 project |
| User acquisition | Free-tier signups | 100 users |
| Monetisation | Free → Paid conversion | ≥5% |
| Reliability | Uptime SLA | ≥99.5% |
| Developer velocity | Deploy-to-live time | <60 seconds |
| User happiness | NPS (post-onboarding) | ≥40 |

### Phase 2 — Growth (Q4 2026)

| Objective | KPI | Target |
|---|---|---|
| Scale users | Total registered users | 2,000 |
| Revenue | Monthly Recurring Revenue | $1,000 MRR |
| Retention | 30-day active user retention | ≥40% |
| Expansion | Multi-region availability | US + EU |

### Phase 3 — Scale (2027)

| Objective | KPI | Target |
|---|---|---|
| Community | Total registered users | 10,000 |
| Revenue | MRR | $10,000 |
| Platform | Enterprise features shipped | SSO, white-label |

---

## Tech Stack Strategy

### Backend — Go Microservices

**Why Go?**
- Native ARM64 compilation → zero emulation overhead on OCI A1 instance.
- Extremely low memory footprint (~30–60 MB per service at idle).
- Built-in concurrency primitives — perfect for deploy pipelines and webhook handling.
- Single static binary per service → trivial Docker images (~15 MB with Alpine).

**Services:**

| Service | Framework / Libraries |
|---|---|
| api-gateway | `go-chi/chi`, `golang-jwt/jwt`, `jmoiron/sqlx` |
| deploy-service | Go standard lib + Docker SDK |
| payment-service | PayMongo REST API |
| seo-service | `chromedp` + Lighthouse CLI subprocess |

### Frontend — React + Vite

**Why React/Vite?**
- Vite's HMR and build speed are well-suited to rapid iteration.
- React's ecosystem (react-router, react-query) handles dashboard complexity cleanly.
- TypeScript throughout for maintainability as the codebase grows.

### Infrastructure — Oracle Cloud Always Free

**Why OCI Free Tier?**
- 2 ARM OCPU + 12 GB RAM is genuinely usable (unlike AWS's t2.micro).
- Always Free means $0 infrastructure cost at launch — critical for bootstrapped growth.
- ARM64 (Ampere) cores are 20–40% more efficient than x86 for CPU-bound workloads.

---

## Constraints & Principles

| Constraint | Detail |
|---|---|
| **Infrastructure budget** | Must run on OCI Always Free (single node) until Phase 2 revenue covers VPS costs |
| **Single-node architecture** | No distributed coordination complexity; Postgres + Redis handle state |
| **Data encryption** | All data encrypted at rest (AES-256) and in transit (TLS 1.3) |
| **GDPR compliance** | User data deletion within 30 days of request; data export endpoint required |
| **No vendor lock-in** | Storage via S3-compatible API; DB is standard Postgres; no proprietary PaaS hooks |
| **Solo maintainability** | Runbook + automation must allow one person to operate this reliably |
| **Security-first** | No feature ships without a security review pass; CVEs addressed within 7 days |

---

## Go-to-Market

### Launch Channels (Phase 1)

1. **Product Hunt** — Launch day post, aim for Top 5 of the day.
2. **Hacker News** — "Show HN: Vallexis — Deploy + Payments + SEO in one place".
3. **Indie Hackers** — Community posts, milestone updates.
4. **Twitter/X** — Build-in-public thread series documenting the journey.
5. **Reddit** (r/selfhosted, r/startups, r/SaaS) — Genuine community engagement.

### Pricing

| Plan | Price | Projects | Storage | Deploys/hr |
|---|---|---|---|---|
| **Free** | $0/mo | 1 | 2 GB | 5 |
| **Pro** | ₱499/mo (~$8) | 2 | 10 GB (5 GB × 2 projects) | 20 |
| **Enterprise** | Custom | Unlimited | Custom | 100 |
