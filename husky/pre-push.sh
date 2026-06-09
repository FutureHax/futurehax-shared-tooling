#!/bin/bash
# Pre-push hook: warn if compendium _source files were modified in commits
# being pushed without corresponding pack rebuilds.
[ -n "$CI" ] && exit 0
[ "$HUSKY" = "0" ] && exit 0

cd "$(git rev-parse --show-toplevel)" || exit 1

# Only relevant for modules with compendium source files
SOURCE_DIR="foundry_vtt/packs/_source"
[ -d "$SOURCE_DIR" ] || exit 0

# Determine which commits are being pushed
BRANCH=$(git branch --show-current)
REMOTE_BRANCH="origin/$BRANCH"

if ! git rev-parse "$REMOTE_BRANCH" >/dev/null 2>&1; then
  # No remote branch yet — skip check on first push
  exit 0
fi

CHANGED_SOURCE=$(git diff --name-only "$REMOTE_BRANCH"...HEAD 2>/dev/null | grep 'packs/_source' | wc -l | tr -d ' ')
CHANGED_PACKS=$(git diff --name-only "$REMOTE_BRANCH"...HEAD 2>/dev/null | grep 'foundry_vtt/packs/' | grep -v '_source' | wc -l | tr -d ' ')

if [ "$CHANGED_SOURCE" -gt 0 ] && [ "$CHANGED_PACKS" -eq 0 ]; then
  echo ""
  echo "⚠  WARNING: Commits being pushed modify packs/_source but no compiled packs were updated."
  echo "   The shipped module will not reflect these source changes."
  echo ""
  echo "   To fix:"
  echo "     npm run pack"
  echo "     git add foundry_vtt/packs/"
  echo "     git commit --amend --no-edit"
  echo ""
  echo "   To push anyway (e.g. packs are rebuilt in CI): git push --no-verify"
  echo ""
  exit 1
fi

exit 0
