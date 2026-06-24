#!/usr/bin/env bash
# scripts/services.sh — Canonical list of backend services
#
# Source this file in other scripts to iterate over services:
#   source "$(dirname "$0")/services.sh"
#   for svc in "${SERVICES[@]}"; do echo "$svc"; done
#
# Keep this list in sync with:
#   - Makefile           (SERVICES variable)
#   - .github/workflows  (matrix.service)
#   - docker-compose.yml (backend service definitions)

SERVICES=(
  api-gateway
  deploy-service
  payment-service
  seo-service
)

SRC_DIR="src"
