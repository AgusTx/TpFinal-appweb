#!/usr/bin/env bash
set -euo pipefail

echo "Running Phase 1 commit script..."

git add backup/placeholders
git commit -m "chore: backup placeholder files" || true

git add backend/src/main.ts
git commit -m "feat: add backend skeleton (Express server and stub routes)" || true

git add frontend/src/services/api.ts
git commit -m "chore: set frontend API base to http://localhost:4000" || true

git add README_PHASE1.md
git commit -m "docs: add README for Phase 1 architecture and run instructions" || true

echo "Phase 1 commit script finished. Review commits with: git --no-pager log --oneline --decorate -n 10"
