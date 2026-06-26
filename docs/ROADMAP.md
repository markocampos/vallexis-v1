# ROADMAP.md — Development Roadmap

> **Last Updated:** June 23, 2026
> **Current Version:** 0.1.0
> **Next Milestone:** Q3 2026 — Foundation

---

## Legend

| Symbol | Meaning |
|---|---|
| ✅ | Shipped |
| 🔨 | In progress |
| 📋 | Planned — committed |
| 💡 | Planned — exploratory |
| ❌ | Cancelled / Deprioritised |

---

## Shipped — v0.1.0

- ✅ Auth — JWT RS256 + OAuth (GitHub, Google)
- ✅ Projects — create, deploy, custom subdomain (`.vallexis.io`), wildcard SSL
- ✅ Deploy pipeline — Git webhook → Docker build → health check → live
- ✅ Payments — PayMongo integration, subscriptions, invoices
- ✅ Storage — MinIO S3-compatible, 2 GB free tier / 5 GB per project on Pro, WebP conversion
- ✅ SEO Toolkit — Lighthouse audits (weekly), sitemap.xml, meta tag analysis
- ✅ Resource monitoring — CPU/RAM/disk dashboard, 30-day history
- ✅ Live deploy log streaming — SSE to dashboard
- ✅ CI/CD — test-runner on PR, deploy-bot on push to main
- ✅ Daily automated backups — pg_dump + rsync, 7d/4w/6m retention

---

## Q3 2026 — Foundation

**Goal:** 500 free users, 8% free-to-paid conversion rate.

### High Priority

- 📋 **Custom domain support** (Pro plan) — CNAME delegation via Cloudflare API, auto-SSL
- 📋 **Interactive onboarding wizard** — guided first deploy in <5 minutes
- 📋 **Team collaboration** — invite up to 3 members per project (Pro plan)
- 📋 **One-click database provisioning** — managed PostgreSQL per project (Pro)
- 📋 **30-day backup retention** — currently 7d; extend with one-click restore UI

### Medium Priority

- 📋 **Deploy preview URLs** — every PR gets a unique `pr-{number}.vallexis.io` URL
- 📋 **Environment variables UI** — per-project env vars, encrypted at rest
- 📋 **Webhook notifications** — Slack / Discord / email on deploy success or failure
- 📋 **Dashboard dark/light mode toggle** — currently dark-only

### Low Priority / Exploratory

- 💡 **Sentry integration** — automatic error tracking per deployed project
- 💡 **OpenTelemetry tracing** — distributed traces across Go services
- 💡 **GitHub Actions native integration** — replace webhook with GH Actions runner

---

## Q4 2026 — Growth

**Goal:** 2,000 users, $1,000 MRR.

### High Priority

- 📋 **Template marketplace** — one-click deploy templates (blog, SaaS starter, portfolio)
- 📋 **Analytics dashboard** — visitor counts, revenue metrics, deploy frequency
- 📋 **PayPal integration** — alternative payment method for non-PayMongo regions
- 📋 **Multi-region (US + EU)** — data residency selection at project creation

### Medium Priority

- 📋 **Scheduled jobs (cron)** — run Go/Node scripts on a schedule per project
- 📋 **Spend alerts** — notify users when approaching storage or deploy limits
- 📋 **Affiliate / referral program** — referral links with revenue sharing

### Exploratory

- 💡 **Public API keys** — long-lived API keys for CI/CD integrations beyond GitHub
- 💡 **Billing portal rebrand** — white-label PayMongo portal with Vallexis branding

---

## 2027 — Scale

**Goal:** 10,000 users, $10,000 MRR.

- 💡 **AI deploy assistant** — code review, Dockerfile suggestions, dependency updates via LLM
- 💡 **Edge functions** — lightweight Go/WASM functions at the network edge
- 💡 **White-label** — agencies can offer Vallexis under their own brand/domain
- 💡 **Enterprise SSO** — SAML 2.0 / LDAP / Active Directory
- 💡 **Mobile app** — iOS + Android dashboard for deploy monitoring and billing
- 💡 **Auto-scaling** — horizontal container scaling beyond single-node

---

## Prioritisation Framework

Items are evaluated on **Impact × Effort**:

```
High Impact + Low Effort  → Do first (Quick wins)
High Impact + High Effort → Plan carefully (Major features)
Low Impact + Low Effort   → Batch together (Polish sprints)
Low Impact + High Effort  → Don't build (Avoid)
```

**Non-negotiables** (ship blockers regardless of effort):
- Security patches — CVEs addressed within 7 days.
- Data loss bugs — treated as P0, hotfix immediately.
- Payment failures — treated as P0 for active subscribers.

---

## What We're NOT Building (Yet)

| Feature | Reason |
|---|---|
| Kubernetes support | Complexity disproportionate to current scale |
| Self-hosted on-premise | Out of scope for SaaS model |
| Mobile-first PWA dashboard | Mobile app planned for 2027 instead |
| Crypto payments | Regulatory risk, very low demand |
