# SECURITY.md — Security Policies & Procedures

> **Version:** 0.1.0
> **Last Updated:** June 23, 2026
> **Owner:** Engineering Lead
> **Review Cycle:** Quarterly

---

## Table of Contents

1. [Threat Model](#threat-model)
2. [Authentication & Session Management](#authentication--session-management)
3. [Data Protection](#data-protection)
4. [Infrastructure Security](#infrastructure-security)
5. [Application Security](#application-security)
6. [Secrets Management](#secrets-management)
7. [Dependency & Supply Chain](#dependency--supply-chain)
8. [Compliance](#compliance)
9. [Incident Response SLAs](#incident-response-slas)
10. [Vulnerability Disclosure](#vulnerability-disclosure)

---

## Threat Model

### High-Priority Threats

| Threat | Attack Vector | Mitigation |
|---|---|---|
| **Unauthorized account access** | Credential stuffing, brute force | Rate limiting (10 login/hr), bcrypt cost 12, HIBP check on registration |
| **Session hijacking** | XSS, cookie theft | HttpOnly + SameSite=Strict cookies, short JWT TTL (15 min) |
| **SQL injection** | Malicious input in API params | Parameterized queries only (`pgx`), no raw string interpolation |
| **Container escape** | Compromised user app | Docker `--no-new-privileges`, read-only rootfs, non-root user |
| **Payment fraud** | Stolen card data, subscription abuse | PayMongo fraud detection, 3D Secure, webhook signature verification (HMAC-SHA256) |
| **DDoS** | Volumetric / L7 attacks | Cloudflare WAF + rate limiting, Nginx connection limits |
| **Data breach** | DB exfiltration | AES-256 at rest, TLS 1.3 in transit, principle of least privilege |
| **Supply chain attack** | Malicious dependencies | Dependabot auto-PRs, `go mod verify`, Trivy container scanning |
| **Privilege escalation** | Exploiting API logic bugs | Role checks on every request, audit log for all admin actions |
| **Secrets exposure** | Committed credentials | Pre-commit hooks, GitHub secret scanning, no secrets in env |

---

## Authentication & Session Management

### JWT Tokens

| Property | Value |
|---|---|
| Algorithm | RS256 (RSA 4096-bit key pair) |
| Access token TTL | 15 minutes |
| Refresh token TTL | 7 days (rotated on each use) |
| Storage | HttpOnly, SameSite=Strict, Secure cookies |
| Revocation | Refresh tokens stored in Redis; delete on logout |

### OAuth (GitHub + Google)

- **Scopes:** `email` + `profile` only — no repo or write access requested.
- **State parameter:** CSRF-safe nonce verified on callback.
- **Account linking:** OAuth accounts linked to existing email if already registered.

### Password Policy

- Minimum length: **12 characters**
- Must include: uppercase, lowercase, number or symbol
- Checked against HaveIBeenPwned breach database on registration and password change
- bcrypt cost factor: **12** (re-evaluated annually as hardware speeds increase)
- No password expiry policy (reduces user friction; breach alerts handle compromises)

### Rate Limiting

| Endpoint | Limit |
|---|---|
| `POST /auth/login` | 10 attempts / hour / IP |
| `POST /auth/register` | 5 attempts / hour / IP |
| `POST /auth/refresh` | 30 attempts / hour / user |
| All authenticated endpoints | 100–500 req/min (by plan, see API.md) |

---

## Data Protection

### At Rest

| Data | Encryption |
|---|---|
| PostgreSQL data files | AES-256 via dm-crypt (OCI Block Volume encryption) |
| Sensitive fields (e.g. PayMongo customer IDs) | `pgcrypto` column-level encryption |
| MinIO object storage | SSE-S3 (AES-256) per-object |
| Database backups | GPG-encrypted before offsite transfer |

### In Transit

- **TLS version:** 1.3 enforced; TLS 1.0/1.1 disabled.
- **HSTS:** `max-age=31536000; includeSubDomains; preload`
- **Certificate:** Let's Encrypt via Caddy auto-renewal (renewed 30 days before expiry).
- **Internal service communication:** Docker bridge network (not exposed to host); mTLS planned for Q3 2026.

### Data Minimisation

- Only essential personal data collected (email, name).
- Payment data never stored — handled entirely by PayMongo PCI-DSS infrastructure.
- IP addresses logged in `audit_log` for security investigations; purged after 90 days.

---

## Infrastructure Security

### Server Hardening

| Control | Implementation |
|---|---|
| SSH access | Key-only (RSA 4096 / Ed25519); password auth disabled; non-standard port |
| Firewall | UFW: only ports 80, 443, and SSH port open |
| Intrusion prevention | Fail2Ban: 5 SSH failures → 1-hour ban |
| Automatic updates | `unattended-upgrades` for security patches |
| Login banner | Legal warning banner on SSH |

### Docker / Container Security

| Control | Detail |
|---|---|
| Rootless containers | All app containers run as non-root users |
| No privileged containers | `--privileged` flag never used |
| Read-only rootfs | `--read-only` flag on all production containers |
| Image scanning | Trivy scans on every build in CI; blocks deploy on CRITICAL CVEs |
| Network isolation | Services communicate on isolated Docker bridge networks |
| Secrets injection | Secrets passed via Docker secrets or env at runtime — never baked into images |

### Web Application Firewall

Managed via **Caddy + Cloudflare**:

- `Content-Security-Policy` header — allowlist of trusted sources
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` — microphone, camera, geolocation all denied

---

## Application Security

### Input Validation

- All API inputs validated at the handler layer before any DB interaction.
- Struct-level validation using `go-playground/validator`.
- File uploads: MIME type verified server-side (not just Content-Type header); max 100 MB per upload.

### Output Encoding

- JSON responses only (no HTML rendering in API layer).
- Frontend uses React's built-in XSS protection (JSX escaping by default).
- No `dangerouslySetInnerHTML` usage.

### CORS Policy

```
Access-Control-Allow-Origin: https://vallexis.io
Access-Control-Allow-Credentials: true
Access-Control-Allow-Methods: GET, POST, PATCH, DELETE, OPTIONS
```

No wildcard (`*`) origin allowed on credentialed requests.

---

## Secrets Management

- **Secrets at rest:** Stored in OCI Vault (KMS). Never in `.env` files committed to version control.
- **Runtime injection:** Secrets mounted as environment variables via Docker secrets at container start.
- **Rotation policy:** PayMongo API keys and DB passwords rotated every 90 days.
- **Pre-commit hooks:** `detect-secrets` hook blocks commits containing high-entropy strings.
- **GitHub:** Secret scanning enabled; alerts routed to `security@vallexis.io`.

---

## Dependency & Supply Chain

| Control | Tool | Frequency |
|---|---|---|
| Go dependency updates | Dependabot | Weekly PRs |
| npm dependency updates | Dependabot | Weekly PRs |
| Container image CVE scanning | Trivy | On every CI build |
| License compliance | `go-licenses` | Monthly |
| SBOM generation | `syft` | On every release |
| Lockfile audit | `go mod verify` + `npm ci` | On every CI build |

CVE response SLA:
- **CRITICAL / HIGH** — patch within 7 days; hotfix release if in production.
- **MEDIUM** — patch in next sprint (≤2 weeks).
- **LOW** — batch in monthly dependency update PR.

---

## Compliance

| Regulation | Status | Notes |
|---|---|---|
| **GDPR** | ✅ Compliant | Data deletion within 30 days of request; data export endpoint; DPA available |
| **PCI-DSS** | ✅ SAQ-A | Payment data never touches Vallexis servers; PayMongo hosted page handles PCI scope |
| **BSP Compliance** | ✅ | PayMongo is licensed by Bangko Sentral ng Pilipinas (BSP) for payment facilitation |
| **WCAG 2.1 AA** | ✅ Compliant | See DESIGN.md for accessibility details |
| **SOC 2 Type II** | 💡 Planned 2027 | Gap analysis required |

### GDPR Specifics

- **Data Controller:** Vallexis (operator of the platform)
- **Lawful basis:** Contract (service provision) + Legitimate interest (security logging)
- **Data export:** `GET /users/me/export` returns all personal data as JSON (planned Q3 2026)
- **Right to erasure:** `DELETE /users/me` triggers soft-delete; hard purge within 30 days
- **Data Processing Agreement (DPA):** Available on request at `legal@vallexis.io`
- **Sub-processors:** PayMongo (payments), SendGrid (email), Cloudflare (CDN/WAF), GitHub (source control)

---

## Incident Response SLAs

| Severity | Definition | Response Time | Resolution Target |
|---|---|---|---|
| **P0** | Active breach / data exfiltration | ≤15 minutes | ≤4 hours |
| **P1** | Full service outage | ≤1 hour | ≤8 hours |
| **P2** | Partial service degradation | ≤4 hours | ≤24 hours |
| **P3** | Minor issue / cosmetic | ≤24 hours | ≤72 hours |

See [RUNBOOK.md](RUNBOOK.md) for step-by-step incident response procedures.

After every P0/P1, a post-mortem is required within 48 hours using the template in RUNBOOK.md.

---

## Vulnerability Disclosure

Vallexis operates a **responsible disclosure** policy.

**To report a vulnerability:**
- Email: `security@vallexis.io`
- PGP key: Available at `https://vallexis.io/.well-known/security.txt`
- Response SLA: Acknowledgement within 48 hours; status update within 7 days

**Safe Harbor:**
Researchers who follow this policy in good faith will not face legal action. We ask that you:
1. Do not access or modify user data beyond what is necessary to demonstrate the vulnerability.
2. Do not perform denial-of-service attacks.
3. Do not publicly disclose before we have had 90 days to remediate.

**Bug Bounty:** No formal bounty programme yet; we will publicly credit researchers (with permission) in the changelog.
