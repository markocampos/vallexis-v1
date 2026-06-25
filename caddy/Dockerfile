# =============================================================================
# Vallexis — Custom Caddy Build (Go 1.26.4+)
# Rebuilds Caddy from source with patched Go stdlib to resolve:
#   CVE-2026-27145, CVE-2026-42504
# =============================================================================

FROM golang:1.26.4-alpine AS builder

RUN apk add --no-cache git

# Install xcaddy to build Caddy from source
RUN go install github.com/caddyserver/xcaddy/cmd/xcaddy@latest

# Build Caddy v2.11.4 with patched Go stdlib
ENV CADDY_VERSION=v2.11.4
RUN xcaddy build ${CADDY_VERSION} --output /usr/bin/caddy

# ---- Production Stage ----
FROM alpine:3.23

RUN apk add --no-cache ca-certificates libcap mailcap

COPY --from=builder /usr/bin/caddy /usr/bin/caddy
RUN setcap cap_net_bind_service=+ep /usr/bin/caddy

# Match official caddy image layout
RUN mkdir -p /config/caddy /data/caddy /etc/caddy /usr/share/caddy \
    && echo '<!DOCTYPE html><h1>Caddy works!</h1>' > /usr/share/caddy/index.html

ENV XDG_CONFIG_HOME=/config
ENV XDG_DATA_HOME=/data

EXPOSE 80
EXPOSE 443
EXPOSE 443/udp
EXPOSE 2019

WORKDIR /srv

CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"]
