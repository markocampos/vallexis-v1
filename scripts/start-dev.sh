#!/bin/bash

set -e

cd "$(dirname "$0")/.."

echo "========================================="
echo " Starting Vallexis Local Development Env "
echo "========================================="

# --- Preflight checks ---

if ! command -v docker &> /dev/null; then
    echo "Error: docker is not installed."
    exit 1
fi

if ! command -v node &> /dev/null; then
    echo "Error: node is not installed."
    exit 1
fi

export PATH=$PATH:/usr/local/go/bin:$HOME/go/bin

if ! command -v go &> /dev/null; then
    echo "Error: go is not installed."
    echo "Install: https://go.dev/dl/"
    exit 1
fi

# --- Environment ---

if [ ! -f .env ]; then
    echo "Creating .env from .env.example..."
    cp .env.example .env
fi

# Generate JWT keys if missing
if [ ! -f secrets/jwt_private.pem ]; then
    echo "Generating JWT keys..."
    mkdir -p secrets
    openssl genrsa -out secrets/jwt_private.pem 4096 2>/dev/null
    openssl rsa -in secrets/jwt_private.pem -pubout -out secrets/jwt_public.pem 2>/dev/null
    echo "JWT keys created in secrets/"
fi

# --- Infrastructure (Docker) ---

echo ""
echo "[1/4] Starting infrastructure (postgres, redis, minio)..."
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d postgres redis minio

echo "Waiting for PostgreSQL..."
for i in $(seq 1 30); do
    if docker compose -f docker-compose.yml -f docker-compose.dev.yml exec -T postgres pg_isready -U vallexis >/dev/null 2>&1; then
        echo "PostgreSQL is ready."
        break
    fi
    if [ "$i" -eq 30 ]; then
        echo "Error: PostgreSQL did not become ready in time."
        exit 1
    fi
    sleep 1
done

echo "Waiting for Redis..."
for i in $(seq 1 15); do
    if docker compose -f docker-compose.yml -f docker-compose.dev.yml exec -T redis redis-cli ping >/dev/null 2>&1; then
        echo "Redis is ready."
        break
    fi
    sleep 1
done

# --- Migrations ---

echo ""
echo "[2/4] Running database migrations..."
make migrate

# --- Backend (local Go) ---

echo ""
echo "[3/4] Starting backend services..."

start_service() {
    local svc=$1
    local port=$2
    echo "  Starting $svc on :$port..."
    if command -v air &> /dev/null; then
        air -c .air.toml -- "$svc" &
    else
        go run -buildvcs=false "./src/$svc" &
    fi
}

start_service api-gateway 3000
start_service deploy-service 3001
start_service payment-service 3002
start_service seo-service 3003

# Wait for api-gateway
echo "Waiting for api-gateway..."
for i in $(seq 1 30); do
    if curl -sf http://localhost:3000/api/health >/dev/null 2>&1; then
        echo "api-gateway is ready."
        break
    fi
    if [ "$i" -eq 30 ]; then
        echo "Warning: api-gateway not responding yet."
        break
    fi
    sleep 1
done

# --- Frontend ---

echo ""
echo "[4/4] Starting frontend..."
cd src/frontend
npm install

echo ""
echo "========================================="
echo " Frontend:  http://localhost:5173"
echo " API:       http://localhost:3000/api/health"
echo " MinIO:     http://localhost:9001"
echo "========================================="
echo "Press Ctrl+C to stop."
echo "-----------------------------------------"

cleanup() {
    echo ""
    echo "Shutting down..."
    kill $(jobs -p) 2>/dev/null || true
    docker compose -f docker-compose.yml -f docker-compose.dev.yml stop postgres redis minio 2>/dev/null || true
    exit 0
}
trap cleanup SIGINT SIGTERM

npm run dev
