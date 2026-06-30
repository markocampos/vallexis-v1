#!/usr/bin/env bash
# scripts/push.sh — Stage, commit, and push changes to remote
# Usage: ./scripts/push.sh "commit message"
#        ./scripts/push.sh                  (uses auto-generated message)

set -euo pipefail

COMMIT_MSG="${1:-}"
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

# Check for git repo
if [ ! -d .git ]; then
  echo "Error: Not a git repository" >&2
  exit 1
fi

# Check for remote
REMOTE=$(git remote | head -1)
if [ -z "$REMOTE" ]; then
  echo "Error: No git remote configured." >&2
  echo "Add one with: git remote add origin <url>" >&2
  exit 1
fi

# Stage all changes (tracked + new), respecting .gitignore
git add -A

# Check if there's anything to commit
if git diff --cached --quiet; then
  echo "Nothing to commit."
  exit 0
fi

# Auto-generate detailed commit message if not provided
if [ -z "$COMMIT_MSG" ]; then
  # Categorize changed files
  BACKEND=$(git diff --cached --name-only -- 'src/api-gateway/' 'src/deploy-service/' 'src/payment-service/' 'src/seo-service/' 'src/internal/' | wc -l)
  FRONTEND=$(git diff --cached --name-only -- 'src/frontend/' | wc -l)
  DOCS=$(git diff --cached --name-only -- 'docs/' '*.md' | wc -l)
  INFRA=$(git diff --cached --name-only -- 'docker-compose*' 'Dockerfile*' 'caddy/' '.github/' 'Makefile' 'migrations/' 'scripts/' 'rules.yml' 'prometheus.yml' 'alertmanager.yml' 'Caddyfile' '.env*' | wc -l)
  TESTS=$(git diff --cached --name-only -- '*_test.go' '*.test.*' '*.spec.*' | wc -l)

  # Build summary line
  PARTS=""
  [ "$BACKEND" -gt 0 ] && PARTS="${PARTS}backend($BACKEND) "
  [ "$FRONTEND" -gt 0 ] && PARTS="${PARTS}frontend($FRONTEND) "
  [ "$DOCS" -gt 0 ] && PARTS="${PARTS}docs($DOCS) "
  [ "$INFRA" -gt 0 ] && PARTS="${PARTS}infra($INFRA) "
  [ "$TESTS" -gt 0 ] && PARTS="${PARTS}tests($TESTS) "
  PARTS=$(echo "$PARTS" | xargs)

  TOTAL=$(git diff --cached --name-only | wc -l)

  # List notable files (up to 8)
  NOTABLE=$(git diff --cached --name-only | head -8 | sed 's|^|  - |')
  REMAINING=$((TOTAL - 8))
  [ "$REMAINING" -gt 0 ] && NOTABLE="${NOTABLE}
  - ...and ${REMAINING} more"

  COMMIT_MSG="feat: v0.1.0 — ${PARTS}

Changed ${TOTAL} files across $(echo "$PARTS" | wc -w) areas:
${NOTABLE}"
fi

# Commit
git commit -m "$COMMIT_MSG"

# Push
BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$BRANCH" = "HEAD" ]; then
  echo "Error: Detached HEAD state. Check out a branch before pushing." >&2
  exit 1
fi
echo "Pushing to $REMOTE/$BRANCH..."
if ! git push "$REMOTE" "$BRANCH"; then
  echo "Error: Push to $REMOTE/$BRANCH failed." >&2
  exit 1
fi

echo "Done."
