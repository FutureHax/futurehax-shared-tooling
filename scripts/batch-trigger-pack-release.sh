#!/bin/bash
set -euo pipefail

# Trigger patch releases so CDN zips compile compendium packs at build time.
# Usage: ./scripts/batch-trigger-pack-release.sh [workspace-dir] [--dry-run] [--priority-only]

WORKSPACE="${1:-/Users/marvin/Workspace}"
DRY_RUN=false
PRIORITY_ONLY=false

for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=true ;;
    --priority-only) PRIORITY_ONLY=true ;;
  esac
done

COMMIT_MSG="fix(release): compile compendium packs at release time"

# Broken on CDN — release first
PRIORITY=(
  chaos-survival-mode
  pirate-borg-content-importer-module
)

# Rest of fleet (cabin-fever already released v1.7.9 with fix)
FLEET=(
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
  saltwater-sacrament-module
  scattered-seafloor-module
  item-piles-pirateborg-module
  pirate-borg-loot-sheet-npc
  Foundry-Module-Template
)

SKIP=(
  cabin-fever-classes-module
  foundry-adventure-module-template
)

if [ "$PRIORITY_ONLY" = true ]; then
  PROJECTS=("${PRIORITY[@]}")
else
  PROJECTS=("${PRIORITY[@]}" "${FLEET[@]}")
fi

should_skip() {
  local project="$1"
  for s in "${SKIP[@]}"; do
    if [ "$project" = "$s" ]; then
      return 0
    fi
  done
  return 1
}

echo "=== Batch Pack Release Trigger ==="
echo "Workspace:      $WORKSPACE"
echo "Dry run:        $DRY_RUN"
echo "Priority only:  $PRIORITY_ONLY"
echo "Projects:       ${#PROJECTS[@]}"
echo ""

PUSHED=0
SKIPPED=0
FAILED=0
FAILED_LIST=()

for project in "${PROJECTS[@]}"; do
  if should_skip "$project"; then
    echo "SKIP: $project (excluded)"
    SKIPPED=$((SKIPPED + 1))
    continue
  fi

  repo_path="$WORKSPACE/$project"
  if [ ! -d "$repo_path/.git" ]; then
    echo "SKIP: $project (not a git repo)"
    SKIPPED=$((SKIPPED + 1))
    continue
  fi

  if [ ! -f "$repo_path/.github/workflows/release.yml" ]; then
    echo "SKIP: $project (no release workflow)"
    SKIPPED=$((SKIPPED + 1))
    continue
  fi

  echo "--- $project ---"
  set +e
  (
    cd "$repo_path"
    git fetch origin main --quiet 2>/dev/null || true

    if git log -1 --pretty=%B | grep -Fq "$COMMIT_MSG"; then
      echo "SKIP: $project (release trigger commit already at HEAD)"
      exit 3
    fi

    if [ "$DRY_RUN" = true ]; then
      echo "  [dry-run] would commit: $COMMIT_MSG"
      echo "  [dry-run] would push origin main"
      exit 0
    fi

    git pull --rebase origin main
    git commit --allow-empty -m "$COMMIT_MSG"
    git push origin main
  )
  status=$?
  set -e

  case $status in
    0) PUSHED=$((PUSHED + 1)); echo "OK: $project" ;;
    3) SKIPPED=$((SKIPPED + 1)) ;;
    *) FAILED=$((FAILED + 1)); FAILED_LIST+=("$project"); echo "FAIL: $project (exit $status)" ;;
  esac
  echo ""
done

echo "=== Summary ==="
echo "Pushed:  $PUSHED"
echo "Skipped: $SKIPPED"
echo "Failed:  $FAILED"
if [ ${#FAILED_LIST[@]} -gt 0 ]; then
  echo "Failed repos:"
  printf '  - %s\n' "${FAILED_LIST[@]}"
fi

exit $(( FAILED > 0 ? 1 : 0 ))
