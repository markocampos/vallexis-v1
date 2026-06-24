#!/usr/bin/env bash
# scripts/build-all.sh — Build Docker images for all backend services
# Usage: ./scripts/build-all.sh [tag]
#        ./scripts/build-all.sh          (defaults to "latest")

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/services.sh"

TAG="${1:-latest}"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

for svc in "${SERVICES[@]}"; do
  echo "Building ${svc}:${TAG} ..."
  docker build -t "${svc}:${TAG}" -f "${REPO_ROOT}/${SRC_DIR}/${svc}/Dockerfile" "${REPO_ROOT}"
done

echo "All images built with tag :${TAG}"
