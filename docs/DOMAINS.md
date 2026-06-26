# DOMAINS.md — Custom Domain Setup Guide

> **Version:** 0.1.0
> **Last Updated:** June 23, 2026
> **Plan Required:** Pro (₱499/mo) or Enterprise

This guide explains how to connect a custom domain to your Vallexis project. Free plan projects use `<project>.vallexis.io` subdomains automatically.

---

## Table of Contents

1. [Overview](#overview)
2. [Add Domain in Dashboard](#add-domain-in-dashboard)
3. [Configure DNS](#configure-dns)
4. [SSL Certificate](#ssl-certificate)
5. [Verify](#verify)
6. [Troubleshooting](#troubleshooting)

---

## Overview

Custom domains use **CNAME delegation** via Cloudflare. When you add a custom domain:

1. Vallexis creates a CNAME record in Cloudflare via API
2. Caddy detects the new domain and provisions an SSL certificate via Let's Encrypt
3. Traffic flows: `User → Cloudflare → Caddy → your project container`

**Requirements:**
- Pro plan or higher
- Domain registered with any registrar
- Cloudflare account linked to Vallexis (or manual DNS configuration)

---

## Add Domain in Dashboard

1. Open your project in the Vallexis dashboard
2. Go to **Settings** → **Domains**
3. Click **Add Custom Domain**
4. Enter your domain (e.g., `myapp.example.com`)
5. Click **Add**

The dashboard will display DNS configuration instructions.

---

## Configure DNS

### Option A: Automatic (Cloudflare API)

If your domain uses Cloudflare and you've authorized Vallexis:

1. The CNAME record is created automatically
2. Wait 1-2 minutes for propagation
3. Skip to [Verify](#verify)

### Option B: Manual DNS Configuration

If you manage DNS manually or use a different provider:

1. Log into your DNS provider's dashboard
2. Add a CNAME record:

| Type | Name | Content | TTL |
|---|---|---|---|
| CNAME | `myapp` | `cname.vallexis.io` | Auto (300s) |

Or for apex domains, add an A record:

| Type | Name | Content | TTL |
|---|---|---|---|
| A | `@` | `<VALLEXIS_IP>` | Auto (300s) |

3. Wait for DNS propagation (typically 5-30 minutes, up to 24 hours)

---

## SSL Certificate

SSL certificates are provisioned automatically by Caddy via Let's Encrypt ACME.

- **Wildcard domains:** Not supported — each subdomain needs its own certificate
- **Certificate renewal:** Automatic, 30 days before expiry
- **Verification:** Caddy responds to ACME HTTP-01 challenges on port 80

No manual certificate management is required.

---

## Verify

### 1. Check DNS Resolution

```bash
# Should return CNAME target or Vallexis IP
dig +short myapp.example.com

# For CNAME
myapp.example.com.  300  IN  CNAME  cname.vallexis.io.

# For A record
myapp.example.com.  300  IN  A      <VALLEXIS_IP>
```

### 2. Check SSL Certificate

```bash
openssl s_client -connect myapp.example.com:443 -servername myapp.example.com </dev/null 2>/dev/null | \
  openssl x509 -noout -subject -dates -issuer
```

### 3. Check the Site

```bash
curl -sI https://myapp.example.com
# HTTP/2 200
# server: Caddy
# strict-transport-security: max-age=31536000; includeSubDomains; preload
```

Open https://myapp.example.com in your browser — you should see your project.

---

## Troubleshooting

### DNS not resolving

- **Wait longer.** DNS propagation can take up to 24 hours. Most changes propagate within 30 minutes.
- **Check nameservers.** Ensure your domain's nameservers point to Cloudflare (if using automatic setup).
- **Flush local cache:** `sudo systemd-resolve --flush-caches`

### SSL certificate not provisioning

- **Verify Caddy is running:** `docker compose ps caddy`
- **Check Caddy logs:** `docker compose logs caddy | grep -i acme`
- **Ensure port 80 is open** for ACME HTTP-01 challenges
- **Wait 5 minutes** after DNS resolves before expecting SSL

### 502 Bad Gateway

- **Project container not running:** `docker compose ps`
- **Check deploy status:** Verify the project shows `deployed` status in the dashboard
- **Check Caddy config:** `docker compose exec caddy cat /etc/caddy/Caddyfile`

### Domain shows Vallexis dashboard instead of your project

- **CNAME misconfigured.** Ensure the CNAME points to `cname.vallexis.io`, not `vallexis.io`
- **Check project association:** Verify the domain is linked to the correct project in Settings → Domains

### Rate limiting / 429 errors

- Vallexis applies rate limiting per IP. If you're hitting limits during development:
  - Check `CORS_ALLOWED_ORIGINS` includes your domain
  - Verify your IP isn't flagged by Cloudflare's bot detection

---

## API Reference

Custom domains can also be managed via the API:

```bash
# Add custom domain
curl -X POST https://api.vallexis.io/api/v1/projects/:id/domains \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"domain": "myapp.example.com"}'

# List domains
curl https://api.vallexis.io/api/v1/projects/:id/domains \
  -H "Authorization: Bearer <token>"

# Remove domain
curl -X DELETE https://api.vallexis.io/api/v1/projects/:id/domains/:domain_id \
  -H "Authorization: Bearer <token>"
```

---

## Next Steps

- [ARCHITECTURE.md](ARCHITECTURE.md) — Understanding Caddy and reverse proxy setup
- [SECURITY.md](SECURITY.md) — TLS configuration and HSTS
- [RUNBOOK.md](RUNBOOK.md) — SSL certificate troubleshooting
