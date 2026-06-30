#!/usr/bin/env bash
# start-dev.sh — Start full local development environment
# Usage: ./start-dev.sh
set -euo pipefail

cd "$(dirname "$0")"

echo "=== Vallexis Dev Environment ==="

# Check prerequisites
for cmd in docker go node; do
  if ! command -v "$cmd" &>/dev/null; then
    echo "ERROR: $cmd is not installed. See docs/ONBOARDING.md"
    exit 1
  fi
done

# Check .env exists
if [ ! -f .env ]; then
  echo "No .env found. Copying from .env.example..."
  cp .env.example .env
  echo "Please edit .env with your actual values, then re-run this script."
  exit 1
fi

# Check JWT keys exist
if [ ! -f secrets/jwt_private.pem ] || [ ! -f secrets/jwt_public.pem ]; then
  echo "JWT keys not found. Generating..."
  mkdir -p secrets
  openssl genrsa -out secrets/jwt_private.pem 4096 2>/dev/null
  openssl rsa -in secrets/jwt_private.pem -pubout -out secrets/jwt_public.pem 2>/dev/null
  echo "JWT keys generated in secrets/"
fi

# Start infrastructure (Postgres, Redis, MinIO)
echo ""
echo "--- Starting infrastructure (Postgres, Redis, MinIO) ---"
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d postgres redis minio

echo "Waiting for services to be healthy..."
sleep 5

for i in $(seq 1 10); do
  if docker compose exec -T postgres pg_isready -U "${POSTGRES_USER:-vallexis}" -q 2>/dev/null; then
    echo "  Postgres: ready"
    break
  fi
  [ "$i" -eq 10 ] && echo "  Postgres: still starting..."
  sleep 1
done

for i in $(seq 1 10); do
  if docker compose exec -T redis redis-cli -a "${REDIS_PASSWORD:-vallexis_dev}" ping 2>/dev/null | grep -q PONG; then
    echo "  Redis: ready"
    break
  fi
  [ "$i" -eq 10 ] && echo "  Redis: still starting..."
  sleep 1
done

echo "  MinIO console: http://localhost:9001 (minioadmin/minioadmin)"

# Run migrations
echo ""
echo "--- Running migrations ---"
make migrate 2>/dev/null || echo "  (migrations may have already been applied)"

# Seed data
echo ""
echo "--- Seeding dev data ---"
make seed 2>/dev/null || echo "  (seed may have already been applied)"

# Kill any existing dev processes
echo ""
echo "--- Cleaning up old processes ---"
for port in 3000 3001 3002 3003; do
  pid=$(lsof -ti:"$port" 2>/dev/null || true)
  if [ -n "$pid" ]; then
    kill -9 $pid 2>/dev/null || true
    echo "  Killed process on port $port"
  fi
done
sleep 1

# Load ONLY the vars we need from .env (NOT API_PORT which would conflict)
DATABASE_URL="${DATABASE_URL:-postgres://vallexis:vallexis@localhost:5432/vallexis_db?sslmode=disable}"
REDIS_URL="${REDIS_URL:-redis://:vallexis_dev@localhost:6379/0}"
JWT_PRIVATE_KEY_PATH="${JWT_PRIVATE_KEY_PATH:-./secrets/jwt_private.pem}"
JWT_PUBLIC_KEY_PATH="${JWT_PUBLIC_KEY_PATH:-./secrets/jwt_public.pem}"
CORS_ALLOWED_ORIGINS="${CORS_ALLOWED_ORIGINS:-http://localhost:5173}"
FRONTEND_URL="${FRONTEND_URL:-http://localhost:5173}"
OAUTH_REDIRECT_BASE_URL="${OAUTH_REDIRECT_BASE_URL:-http://localhost:3000}"

# Start all 4 backend services — each with its OWN port
echo ""
echo "--- Starting backend services ---"
echo "  api-gateway     → http://localhost:3000"
echo "  deploy-service  → http://localhost:3001"
echo "  payment-service → http://localhost:3002"
echo "  seo-service     → http://localhost:3003"
echo ""

API_PORT=3000 \
DATABASE_URL="$DATABASE_URL" \
REDIS_URL="$REDIS_URL" \
JWT_PRIVATE_KEY_PATH="$JWT_PRIVATE_KEY_PATH" \
JWT_PUBLIC_KEY_PATH="$JWT_PUBLIC_KEY_PATH" \
CORS_ALLOWED_ORIGINS="$CORS_ALLOWED_ORIGINS" \
FRONTEND_URL="$FRONTEND_URL" \
OAUTH_REDIRECT_BASE_URL="$OAUTH_REDIRECT_BASE_URL" \
go run ./src/api-gateway &

DEPLOY_PORT=3001 \
DATABASE_URL="$DATABASE_URL" \
REDIS_URL="$REDIS_URL" \
JWT_PRIVATE_KEY_PATH="$JWT_PRIVATE_KEY_PATH" \
JWT_PUBLIC_KEY_PATH="$JWT_PUBLIC_KEY_PATH" \
CORS_ALLOWED_ORIGINS="$CORS_ALLOWED_ORIGINS" \
go run ./src/deploy-service &

PAYMENT_PORT=3002 \
DATABASE_URL="$DATABASE_URL" \
REDIS_URL="$REDIS_URL" \
JWT_PRIVATE_KEY_PATH="$JWT_PRIVATE_KEY_PATH" \
JWT_PUBLIC_KEY_PATH="$JWT_PUBLIC_KEY_PATH" \
CORS_ALLOWED_ORIGINS="$CORS_ALLOWED_ORIGINS" \
FRONTEND_URL="$FRONTEND_URL" \
go run ./src/payment-service &

SEO_PORT=3003 \
DATABASE_URL="$DATABASE_URL" \
REDIS_URL="$REDIS_URL" \
JWT_PRIVATE_KEY_PATH="$JWT_PRIVATE_KEY_PATH" \
JWT_PUBLIC_KEY_PATH="$JWT_PUBLIC_KEY_PATH" \
CORS_ALLOWED_ORIGINS="$CORS_ALLOWED_ORIGINS" \
go run ./src/seo-service &

echo "All services started. Press Ctrl+C to stop."
wait
