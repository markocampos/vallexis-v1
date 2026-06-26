# INFRASTRUCTURE.md — Infrastructure Provisioning Guide

> **Version:** 0.1.0
> **Last Updated:** June 23, 2026

Step-by-step guide for provisioning the infrastructure that Vallexis runs on. This covers the initial setup from a bare OCI account to a running production environment.

---

## Table of Contents

1. [OCI Account Setup](#oci-account-setup)
2. [ARM A1 Instance](#arm-a1-instance)
3. [Base Server Configuration](#base-server-configuration)
4. [Docker Installation](#docker-installation)
5. [Cloudflare Setup](#cloudflare-setup)
6. [OCI Vault for Secrets](#oci-vault-for-secrets)
7. [Security Hardening](#security-hardening)

---

## OCI Account Setup

### 1. Create OCI Account

1. Go to https://cloud.oracle.com/free
2. Sign up for an Oracle Cloud account (Always Free tier)
3. Verify email and complete registration

### 2. Enable Always Free Resources

After account creation:

1. OCI Console → **Home** → **Create a Compartment** (optional, for organization)
2. Verify Always Free resources are available:
   - 2 AMD-based VMs (1/8 OCPU, 1 GB each) — not used
   - **4 Ampere A1 cores, 24 GB RAM** — we use 2 cores / 12 GB
   - 200 GB block storage
   - 10 GB Object Storage

---

## ARM A1 Instance

### 1. Create Instance

1. OCI Console → **Compute** → **Instances** → **Create Instance**
2. Configure:
   - **Name:** `vallexis-prod`
   - **Image:** Canonical Ubuntu 24.04 (aarch64)
   - **Shape:** VM.Standard.A1.Flex
     - OCPUs: **2**
     - RAM: **12 GB**
   - **Networking:** Create new VCN with default internet gateway
   - **Add SSH keys:** Upload or generate
   - **Boot volume:** 100 GB

3. Click **Create** and wait 2-3 minutes

### 2. Note Instance Details

After creation, note:
- **Public IP:** `x.x.x.x`
- **Private IP:** `10.0.0.x`
- **OCID:** `ocid1.instance.oc1..xxxx`

### 3. Configure Security List

Networking → Virtual Cloud Networks → your VCN → Default Security List → Add Ingress Rules:

| Source | Protocol | Destination Port | Description |
|---|---|---|---|
| Your IP/32 | TCP | 22 | SSH access |
| 0.0.0.0/0 | TCP | 80 | HTTP |
| 0.0.0.0/0 | TCP | 443 | HTTPS |

---

## Base Server Configuration

### 1. SSH into Instance

```bash
ssh ubuntu@<PUBLIC_IP>
```

### 2. Update System

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git ufw fail2ban
```

### 3. Configure Firewall

```bash
# Allow SSH, HTTP, HTTPS
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable
sudo ufw status
```

### 4. Configure Fail2Ban

```bash
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

---

## Docker Installation

### 1. Install Docker

```bash
curl -fsSL https://get.docker.com | sudo sh
```

### 2. Add User to Docker Group

```bash
sudo usermod -aG docker $USER
newgrp docker
```

### 3. Verify

```bash
docker --version          # Docker version 27.x.x
docker compose version    # Docker Compose v2.x.x
docker run hello-world    # Should print "Hello from Docker!"
```

### 4. Configure Docker Daemon

```bash
sudo mkdir -p /etc/docker
cat << EOF | sudo tee /etc/docker/daemon.json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "storage-driver": "overlay2"
}
EOF
sudo systemctl restart docker
```

---

## Cloudflare Setup

### 1. Add Domain to Cloudflare

1. Sign up at https://dash.cloudflare.com (free plan)
2. Click **Add a Site** → Enter your domain
3. Select **Free** plan
4. Cloudflare scans existing DNS records — review and continue

### 2. Update Nameservers

At your domain registrar, update nameservers to the ones Cloudflare provides:

```
anna.ns.cloudflare.com
bob.ns.cloudflare.com
```

### 3. Add DNS Records

Cloudflare → DNS → Records:

| Type | Name | Content | Proxy |
|---|---|---|---|
| A | `@` | `<OCI_PUBLIC_IP>` | Proxied |
| CNAME | `app` | `vallexis.io` | Proxied |
| CNAME | `api` | `vallexis.io` | Proxied |

### 4. SSL/TLS Settings

Cloudflare → SSL/TLS:
- **Mode:** Full (Strict)
- **Always Use HTTPS:** On
- **Automatic HTTPS Rewrites:** On

### 5. Create Cloudflare API Token

For Vallexis to manage DNS (custom domains):

1. Cloudflare → **My Profile** → **API Tokens** → **Create Token**
2. Use template: **Edit zone DNS**
3. Permissions: Zone → DNS → Edit
4. Zone Resources: Include → Specific zone → your domain
5. Copy the token — add to Vallexis environment

---

## OCI Vault for Secrets

### 1. Create Vault

1. OCI Console → **Identity & Security** → **Vault** → **Create Vault**
2. Name: `vallexis-secrets`
3. Compartment: your compartment
4. Click **Create Vault**

### 2. Create Master Encryption Key

1. Open the vault → **Master Encryption Keys** → **Create Key**
2. Name: `vallexis-master-key`
3. Algorithm: **AES**
4. Click **Create Key**

### 3. Store Secrets

Store each secret as a secret in the vault:

| Secret Name | Value |
|---|---|
| `paymongo-secret-key` | `sk_live_...` |
| `paymongo-public-key` | `pk_live_...` |
| `paymongo-webhook-secret` | `whsk_...` |
| `jwt-private-key` | Contents of `secrets/jwt_private.pem` |
| `jwt-public-key` | Contents of `secrets/jwt_public.pem` |
| `database-password` | Generated password |
| `redis-password` | Generated password |
| `internal-secret` | Generated hex string |

### 4. Access Secrets from Server

```bash
# Install OCI CLI
pip3 install oci

# Configure OCI CLI
oci setup config

# Retrieve a secret
oci secrets secret-bundle get \
  --secret-id <SECRET_OCID> \
  --query "data.content" \
  --raw-output | base64 -d
```

---

## Security Hardening

### SSH Hardening

```bash
# Edit SSH config
sudo nano /etc/ssh/sshd_config
```

Set:
```
PermitRootLogin no
PasswordAuthentication no
MaxAuthTries 3
ClientAliveInterval 300
ClientAliveCountMax 2
```

```bash
sudo systemctl restart sshd
```

### Automatic Security Updates

```bash
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

### Docker Security

```bash
# Run containers as non-root
# Use read-only rootfs where possible
# Limit container resources (CPU, memory)
# Scan images with Trivy
```

See [SECURITY.md](SECURITY.md) for the full security checklist.

---

## Post-Provisioning Checklist

| Step | Command / Action |
|---|---|
| SSH access works | `ssh ubuntu@<IP>` |
| Firewall active | `sudo ufw status` |
| Fail2Ban running | `sudo systemctl status fail2ban` |
| Docker installed | `docker --version` |
| Domain resolves | `dig +short app.vallexis.io` |
| SSL working | `curl -sI https://app.vallexis.io` |
| Vault accessible | `oci secrets secret-bundle get ...` |

---

## Next Steps

- [PRODUCTION.md](PRODUCTION.md) — Deploy Vallexis to the provisioned server
- [OBSERVABILITY.md](OBSERVABILITY.md) — Set up monitoring
- [SECURITY.md](SECURITY.md) — Security hardening checklist
- [RUNBOOK.md](RUNBOOK.md) — Operational procedures
