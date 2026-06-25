# =============================================================================
# Vallexis Frontend — Multi-stage Docker Build
# Stage 1: Build Caddy from source with Go 1.26.4+ (CVE-2026-27145/42504 fix)
# Stage 2: Build the Vite/React app
# Stage 3: Serve via patched Caddy on Alpine
# =============================================================================

# ---- Caddy Build Stage ----
FROM golang:1.26.4-alpine AS caddy-builder

RUN apk add --no-cache git
RUN go install github.com/caddyserver/xcaddy/cmd/xcaddy@latest

ENV CADDY_VERSION=v2.11.4
RUN xcaddy build ${CADDY_VERSION} --output /usr/bin/caddy

# ---- Frontend Build Stage ----
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files first for layer caching
COPY package.json package-lock.json ./

# Install ALL deps (including devDeps — needed for vite build)
RUN npm ci --frozen-lockfile

# Copy source code
COPY . .

# Build production bundle
ARG VITE_API_URL=/api/v1
ENV VITE_API_URL=${VITE_API_URL}

RUN npm run build

# ---- Production Stage ----
FROM alpine:3.23 AS production

RUN apk add --no-cache ca-certificates libcap mailcap

COPY --from=caddy-builder /usr/bin/caddy /usr/bin/caddy
RUN setcap cap_net_bind_service=+ep /usr/bin/caddy

RUN mkdir -p /config/caddy /data/caddy /etc/caddy /srv

ENV XDG_CONFIG_HOME=/config
ENV XDG_DATA_HOME=/data

# Copy custom caddy config for SPA routing
COPY Caddyfile /etc/caddy/Caddyfile

# Copy built assets from builder
COPY --from=builder /app/dist /srv

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget --spider -q http://localhost/ || exit 1

CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"]

