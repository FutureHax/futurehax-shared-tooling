#!/bin/bash
set -euo pipefail

# Bump .shared-tooling submodule across fleet modules.
# Usage: ./scripts/batch-bump-shared-tooling.sh [workspace-dir] [--dry-run]

WORKSPACE="/Users/marvin/Workspace"
DRY_RUN=false

for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=true ;;
    /*) WORKSPACE="$arg" ;;
  esac
done

COMMIT_MSG="chore(tooling): fix GitHub release asset upload via gh CLI"

PROJECTS=(
  pb-combat-helper-overlay
  pb-derelict-staging
  pb-job-board
  pb-naval-combat-overlay
  pb-pirate-forge
  pb-potion-bench
  pb-sea-travel
  pb-shanty-engine
  pb-storm-generator
  pb-suite-manager
  pb-tavern-plus
  pb-treasure-staging
  pb-wind-manager
  foundry-mob-actor
  foundry-character-vault-module
  Death-Effect-Reminder
  Me-Beloved-SHIP
  Pirate-Borg-Crew-and-Ship-Manager
  brightbeard-pirate-borg-adventure-module
  cabin-fever-classes-module
  saltwater-sacrament-module
  scattered-seafloor-module
  item-piles-pirateborg-module
  pirate-borg-loot-sheet-npc
  pirate-borg-statblock-importer
  pirate-borg-content-importer-module
  chaos-survival-mode
  Foundry-Module-Template
  foundry-adventure-module-template
  alpha-5-module
)

echo "=== Batch Shared-Tooling Submodule Bump ==="
echo "Workspace: $WORKSPACE"
echo "Dry run:   $DRY_RUN"
echo ""

PUSHED=0
SKIPPED=0
FAILED=0
FAILED_LIST=()

for project in "${PROJECTS[@]}"; do
  repo_path="$WORKSPACE/$project"
  if [ ! -d "$repo_path/.git" ]; then
    echo "SKIP: $project (not a git repo)"
    SKIPPED=$((SKIPPED + 1))
    continue
  fi
  if [ ! -f "$repo_path/.gitmodules" ] || ! grep -q '.shared-tooling' "$repo_path/.gitmodules" 2>/dev/null; then
    echo "SKIP: $project (no .shared-tooling submodule)"
    SKIPPED=$((SKIPPED + 1))
    continue
  fi

  echo "--- $project ---"
  set +e
  (
    cd "$repo_path"
    git submodule update --init --recursive .shared-tooling 2>/dev/null || true
    git submodule sync .shared-tooling 2>/dev/null || true
    git submodule update --remote .shared-tooling

    if git diff --quiet .shared-tooling && git diff --cached --quiet .shared-tooling; then
      echo "SKIP: $project (submodule already at latest)"
      exit 3
    fi

    if [ "$DRY_RUN" = true ]; then
      echo "  [dry-run] would commit and push submodule bump"
      exit 0
    fi

    git add .shared-tooling
    HUSKY=0 git commit -m "$COMMIT_MSG"
    git pull --rebase origin main
    git push origin main
  )
  status=$?
  set -e
  case $status in
    0) PUSHED=$((PUSHED + 1)); echo "OK: $project" ;;
    3) SKIPPED=$((SKIPPED + 1)) ;;
    *) FAILED=$((FAILED + 1)); FAILED_LIST+=("$project"); echo "FAIL: $project" ;;
  esac
  echo ""
done

echo "=== Summary ==="
echo "Pushed:  $PUSHED"
echo "Skipped: $SKIPPED"
echo "Failed:  $FAILED"
if [ ${#FAILED_LIST[@]} -gt 0 ]; then
  printf '  - %s\n' "${FAILED_LIST[@]}"
fi

exit $(( FAILED > 0 ? 1 : 0 ))
