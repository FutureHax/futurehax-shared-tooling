#!/bin/bash
set -euo pipefail

# Open PRs for all migrated projects
# Usage: ./scripts/open-prs.sh [workspace-dir]
# Requires: gh CLI authenticated

WORKSPACE="${1:-/Users/marvin/Workspace}"
BRANCH_NAME="chore/shared-tooling-migration"

PR_TITLE="chore(tooling): migrate to shared-tooling submodule + reusable CI"
PR_BODY="$(cat << 'EOF'
## Summary

- Added `.shared-tooling` git submodule pointing to `FutureHax/futurehax-shared-tooling`
- Replaced inline ESLint, commitlint, prettier, lint-staged, and releaserc configs with thin wrappers that import from the submodule
- Standardized husky hooks to delegate to submodule scripts (with CI skip)
- Slimmed Taskfile.yml to use shared includes
- Removed duplicated `tasks/husky/` and `tasks/semantic-release/` scripts

## Why

Consolidates ~40 copies of identical tooling configs into a single source of truth.
Future updates only need to be made in one place.

## Test plan

- [ ] `npm ci` installs cleanly
- [ ] `npm run lint` passes
- [ ] `npm run test:ci` passes
- [ ] `git commit` triggers commitlint via husky
- [ ] `npx semantic-release --dry-run` resolves the plugin correctly
EOF
)"

OPENED=0
FAILED=0

find_repos() {
  for dir in "$WORKSPACE/tmp-upgrade"/*/ "$WORKSPACE"/*/; do
    if [ -d "$dir/.git" ] && git -C "$dir" rev-parse --verify "$BRANCH_NAME" >/dev/null 2>&1; then
      echo "$dir"
    fi
  done
}

for repo in $(find_repos); do
  project="$(basename "$repo")"
  echo "--- $project ---"

  cd "$repo"
  git checkout "$BRANCH_NAME"

  # Stage and commit if needed
  if [ -n "$(git status --porcelain)" ]; then
    git add -A
    git commit -m "chore(tooling): migrate to shared-tooling submodule

Replace inline configs with thin wrappers importing from .shared-tooling
submodule. Standardize husky hooks, Taskfile, and release configuration."
  fi

  # Push branch
  if ! git push -u origin "$BRANCH_NAME" 2>/dev/null; then
    echo "FAIL: Could not push $project"
    FAILED=$((FAILED + 1))
    continue
  fi

  # Create PR
  if gh pr create --title "$PR_TITLE" --body "$PR_BODY" --base main 2>/dev/null; then
    OPENED=$((OPENED + 1))
  else
    echo "WARN: PR may already exist for $project"
    OPENED=$((OPENED + 1))
  fi

  cd - > /dev/null
done

echo ""
echo "=== PRs Opened: $OPENED | Failed: $FAILED ==="
