# =============================================================================
# Vallexis Frontend — Multi-stage Docker Build
# Stage 1: Build the Vite/React app
# Stage 2: Serve via caddy:alpine
# =============================================================================

# ---- Build Stage ----
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
FROM caddy:2-alpine AS production

# Copy custom caddy config for SPA routing
COPY Caddyfile /etc/caddy/Caddyfile

# Copy built assets from builder
COPY --from=builder /app/dist /srv

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget --spider -q http://localhost/ || exit 1

