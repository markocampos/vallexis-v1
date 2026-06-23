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
REMOTE=$(git remote 2>/dev/null | head -1)
if [ -z "$REMOTE" ]; then
  echo "Error: No git remote configured." >&2
  echo "Add one with: git remote add origin <url>" >&2
  exit 1
fi

# Auto-generate commit message if not provided
if [ -z "$COMMIT_MSG" ]; then
  CHANGED=$(git diff --name-only 2>/dev/null | wc -l)
  UNTRACKED=$(git ls-files --others --exclude-standard 2>/dev/null | wc -l)
  TOTAL=$((CHANGED + UNTRACKED))
  COMMIT_MSG="chore: update docs and config ($TOTAL files)"
fi

# Stage all changes
git add -A

# Check if there's anything to commit
if git diff --cached --quiet 2>/dev/null; then
  echo "Nothing to commit."
  exit 0
fi

# Commit
git commit -m "$COMMIT_MSG"

# Push
BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo "Pushing to $REMOTE/$BRANCH..."
git push "$REMOTE" "$BRANCH"

echo "Done."
