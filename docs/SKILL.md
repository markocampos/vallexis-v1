# SKILL.md — Platform Capabilities Reference

> **Version:** 0.1.0
> **Last Updated:** June 23, 2026

Vallexis is an all-in-one PaaS for solo founders and small teams. This document is a quick-reference overview of platform capabilities, the tech stack, and integration ecosystem.

---

## Core Capabilities

| # | Capability | Description | Available On |
|---|---|---|---|
| 1 | **One-Click Deploy** | Push to `main` → live in <60 seconds. Docker-based builds, health-check gating, build log streaming. | All plans |
| 2 | **Built-in Payments** | PayMongo integration, subscription management, invoice history — no config needed. | All plans |
| 3 | **Free Subdomain + SSL** | Instant `<project>.vallexis.io` subdomain with wildcard TLS certificate, auto-renewed via Caddy. | All plans |
| 4 | **Custom Domains** | CNAME delegation via Cloudflare API; auto-SSL via Caddy ACME. | Pro + Enterprise |
| 5 | **SEO Toolkit** | Weekly Lighthouse audits (performance, accessibility, SEO, best-practices), sitemap.xml generation, robots.txt validation, score trend tracking. | All plans |
| 6 | **Fair Storage** | MinIO S3-compatible object storage. 2 GB free / 5 GB per project on Pro (10 GB total). Automatic WebP conversion for images. Compatible with any S3 SDK. | All plans |
| 7 | **Resource Monitoring** | Real-time CPU, RAM, and disk charts per service. 30-day history via Prometheus + Grafana. | All plans |
| 8 | **Deploy Previews** | Per-PR ephemeral environments at `pr-{number}.vallexis.io`. | Pro + (planned Q3 2026) |
| 9 | **Team Collaboration** | Invite up to 3 members per project; role-based access control. | Pro + (planned Q3 2026) |

---

## Plan Comparison

| Feature | Free | Pro (₱499/mo ~$8) | Enterprise |
|---|---|---|---|
| Projects | 1 | 2 | Unlimited |
| Storage | 2 GB | 10 GB (5 GB × 2 projects) | Custom |
| Deploys / hour | 5 | 20 | 100 |
| Custom domains | ❌ | ✅ | ✅ |
| Deploy previews | ❌ | ✅ | ✅ |
| Team members | 1 | 3 | Unlimited |
| Priority support | ❌ | ✅ | ✅ + SLA |
| API rate limit (req/min) | 100 | 500 | 2,000 |

---

## Tech Stack

### Infrastructure

| Layer | Technology | Version / Tier |
|---|---|---|
| Cloud | Oracle Cloud Always Free | ARM A1 Flex |
| Instance | VM.Standard.A1.Flex | 2 OCPU / 12 GB RAM |
| OS | Ubuntu Server LTS | 24.04 |
| Container runtime | Docker + Compose | 27.x / 2.x |
| Reverse proxy | Caddy | 2.x |
| DNS / CDN | Cloudflare | Free → Pro |

### Application

| Layer | Technology | Version |
|---|---|---|
| API gateway | Go (`go-chi/chi`) | 1.22+ |
| Deploy service | Go | 1.22+ |
| Payment service | Go + PayMongo REST API | 1.22+ |
| SEO service | Go + Chromium (`chromedp`) | 1.22+ |
| Frontend dashboard | React + Vite + TypeScript | React 18 / Vite 5 |

### Data

| Layer | Technology | Version |
|---|---|---|
| Primary database | PostgreSQL | 16 |
| Cache / sessions / queues | Redis | 7.x |
| Object storage | MinIO | Latest (AGPL) |

### Observability

| Signal | Tool |
|---|---|
| Metrics | Prometheus → Grafana |
| Logs | Docker JSON driver |
| Uptime | Internal uptime-pulse agent |
| Error tracking | Sentry (planned Q3 2026) |
| Distributed traces | OpenTelemetry (planned Q3 2026) |

---

## Integrations

### Git Providers

| Provider | Status | Auth Method |
|---|---|---|
| GitHub | ✅ Supported | OAuth app + webhook (HMAC) |
| GitLab | ✅ Supported | OAuth app + webhook |
| Bitbucket | ✅ Supported | OAuth app + webhook |

### Payments

| Provider | Status |
|---|---|
| PayMongo | ✅ Live — Payment links, subscriptions, invoices |
| GCash / Maya | ✅ Supported via PayMongo |
| PayPal | 📋 Planned Q4 2026 |

### Email

| Provider | Usage | Status |
|---|---|---|
| SendGrid | Transactional email (welcome, invoice, alerts) | ✅ Live |
| Resend | Fallback / marketing email | ✅ Live |

### DNS / Domains

| Provider | Usage | Status |
|---|---|---|
| Cloudflare | Custom domain CNAME delegation, WAF, DDoS protection | ✅ Live |
| Let's Encrypt | Free SSL via Caddy ACME | ✅ Live |

---

## API Quick Reference

Base URL: `https://api.vallexis.io/v1`

```
Auth:     POST /auth/login  · POST /auth/register  · POST /auth/refresh
Users:    GET  /users/me    · PATCH /users/me       · DELETE /users/me
Projects: GET  /projects    · POST /projects        · GET /projects/:id · DELETE /projects/:id
Deploys:  GET  /projects/:id/deploys · POST /projects/:id/deploys
Billing:  GET  /billing/subscription · POST /billing/checkout · GET /billing/invoices
Storage:  GET  /storage/usage · POST /storage/upload · DELETE /storage/files/:id
SEO:      GET  /projects/:id/seo · POST /projects/:id/seo/audit
```

See [API.md](API.md) for full request/response documentation.
