#!/usr/bin/env bash
# scripts/scan-all.sh — Run Trivy security scans on all backend service images
# Usage: ./scripts/scan-all.sh [tag]
#        ./scripts/scan-all.sh          (defaults to "latest")

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/services.sh"

TAG="${1:-latest}"
FAILED=()

for svc in "${SERVICES[@]}"; do
  echo "Scanning ${svc}:${TAG} ..."
  if ! trivy image --severity CRITICAL,HIGH "${svc}:${TAG}"; then
    FAILED+=("$svc")
  fi
done

if [ ${#FAILED[@]} -gt 0 ]; then
  echo "Scan failures: ${FAILED[*]}"
  exit 1
fi

echo "All scans passed."
