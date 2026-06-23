# PRODUCTION.md — Production Deployment Guide

> **Last Updated:** June 23, 2026
> **Target:** Oracle Cloud Always Free ARM A1 (2 OCPU / 12 GB RAM)

This guide walks you through deploying Vallexis to production on OCI from scratch. For local development, see [ONBOARDING.md](ONBOARDING.md).

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Provision OCI Instance](#provision-oci-instance)
3. [Install Docker](#install-docker)
4. [Deploy Vallexis](#deploy-vallexis)
5. [Configure DNS](#configure-dns)
6. [Verify Deployment](#verify-deployment)
7. [Post-Deploy Checklist](#post-deploy-checklist)

---

## Prerequisites

| Requirement | Details |
|---|---|
| OCI account | Always Free tier — https://cloud.oracle.com/free |
| Domain name | Pointed to Cloudflare (for DDoS/WAF protection) |
| Cloudflare account | Free plan sufficient — https://dash.cloudflare.com |
| PayMongo account | Live API keys — https://dashboard.paymongo.com |
| SendGrid or Resend account | Transactional email — https://sendgrid.com or https://resend.com |

---

## Provision OCI Instance

### 1. Create ARM A1 Instance

1. OCI Console → **Compute** → **Instances** → **Create Instance**
2. Image: **Canonical Ubuntu 24.04** (aarch64)
3. Shape: **VM.Standard.A1.Flex** — 2 OCPU, 12 GB RAM
4. Networking: Create a new VCN with default internet gateway
5. Add SSH key for access
6. Boot volume: 100 GB (sufficient for Docker images + backups)

### 2. Open Firewall Rules

In OCI Console → **Networking** → **Virtual Cloud Networks** → your VCN → **Security Lists**:

| Direction | Protocol | Port | Source | Purpose |
|---|---|---|---|---|
| Ingress | TCP | 22 | Your IP only | SSH access |
| Ingress | TCP | 80 | 0.0.0.0/0 | HTTP (redirects to HTTPS) |
| Ingress | TCP | 443 | 0.0.0.0/0 | HTTPS |
| Egress | All | All | 0.0.0.0/0 | Outbound (PayMongo, GitHub, email) |

### 3. SSH into the Instance

```bash
ssh ubuntu@<PUBLIC_IP>
```

---

## Install Docker

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | sudo sh

# Add user to docker group (no sudo needed for docker commands)
sudo usermod -aG docker $USER
newgrp docker

# Verify
docker --version          # Docker version 27.x.x
docker compose version    # Docker Compose v2.x.x
```

---

## Deploy Vallexis

### 1. Clone the Repository

```bash
git clone https://github.com/vallexis/vallexis.git
cd vallexis
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with production values. Key differences from local dev:

| Variable | Local Value | Production Value |
|---|---|---|
| `API_ENV` | `development` | `production` |
| `PAYMONGO_SECRET_KEY` | `sk_test_...` | `sk_live_...` |
| `PAYMONGO_PUBLIC_KEY` | `pk_test_...` | `pk_live_...` |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:5173` | `https://app.vallexis.io` |
| `POSTGRES_PASSWORD` | `vallexis_dev` | Generate: `openssl rand -base64 24` |
| `REDIS_PASSWORD` | `devpassword` | Generate: `openssl rand -base64 24` |
| `MINIO_ROOT_PASSWORD` | `minioadmin` | Generate: `openssl rand -base64 24` |
| `GRAFANA_ADMIN_PASSWORD` | `admin` | Generate: `openssl rand -base64 16` |
| `INTERNAL_SECRET` | placeholder | Generate: `openssl rand -hex 32` |

### 3. Generate JWT Keys

```bash
mkdir -p secrets
openssl genrsa -out secrets/jwt_private.pem 4096
openssl rsa -in secrets/jwt_private.pem -pubout -out secrets/jwt_public.pem
```

Update `.env`:
```env
JWT_PRIVATE_KEY_PATH=/home/ubuntu/vallexis/secrets/jwt_private.pem
JWT_PUBLIC_KEY_PATH=/home/ubuntu/vallexis/secrets/jwt_public.pem
```

### 4. Create Caddyfile

```bash
cat > Caddyfile << 'EOF'
vallexis.io {
    redir https://app.vallexis.io{uri}
}

app.vallexis.io {
    reverse_proxy react-frontend:5173
}

api.vallexis.io {
    reverse_proxy api-gateway:3000 {
        header_up X-Real-IP {remote_host}
    }
}

# Rate limiting headers
    header {
        X-Content-Type-Options nosniff
        X-Frame-Options DENY
        Referrer-Policy strict-origin-when-cross-origin
        Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
    }
}
EOF
```

### 5. Start Services

```bash
# Build and start all services
docker compose up -d --build

# Wait ~30 seconds for services to initialize
# Then run migrations
docker exec -i vallexis-postgres psql -U vallexis -d vallexis_db < migrations/001_initial_schema.sql
docker exec -i vallexis-postgres psql -U vallexis -d vallexis_db < migrations/002_add_audit_log.sql
docker exec -i vallexis-postgres psql -U vallexis -d vallexis_db < migrations/003_add_seo_audits.sql
```

---

## Configure DNS

### Cloudflare Setup

1. Add your domain to Cloudflare (free plan)
2. Set nameservers at your registrar to Cloudflare's
3. Add DNS records:

| Type | Name | Content | Proxy |
|---|---|---|---|
| A | `@` | `<OCI_PUBLIC_IP>` | Proxied |
| CNAME | `app` | `vallexis.io` | Proxied |
| CNAME | `api` | `vallexis.io` | Proxied |

4. In Cloudflare → **SSL/TLS** → **Full (Strict)**

---

## Verify Deployment

```bash
# Health checks
curl -s https://api.vallexis.io/api/health | jq .
# {"status":"ok","version":"0.2.0"}

# Frontend
curl -sI https://app.vallexis.io
# HTTP/2 200

# Check all services
docker compose ps
# All services should show "Up" status
```

Open https://app.vallexis.io — you should see the Vallexis dashboard.

---

## Post-Deploy Checklist

| Task | Command / Action |
|---|---|
| Verify health endpoints | `curl https://api.vallexis.io/api/health` |
| Test login flow | Register a test account |
| Configure PayMongo webhook | Point to `https://api.vallexis.io/webhooks/paymongo` |
| Verify email delivery | Trigger a password reset or invite |
| Set up backups | Verify cron: `crontab -l` — backup-agent should run daily at 03:00 UTC |
| Check Grafana | `https://app.vallexis.io:3100` (or internal port) |
| Enable maintenance mode test | Set `FEATURE_MAINTENANCE_MODE=true`, verify 503 response |
| Review security | Run `docker compose exec api-gateway go run ./cmd/security-scan` |

---

## Next Steps

- [OBSERVABILITY.md](OBSERVABILITY.md) — Set up monitoring dashboards and alerts
- [DISASTER-RECOVERY.md](DISASTER-RECOVERY.md) — Document recovery procedures
- [RUNBOOK.md](RUNBOOK.md) — Operational procedures for ongoing management
- [SECURITY.md](SECURITY.md) — Security hardening checklist
