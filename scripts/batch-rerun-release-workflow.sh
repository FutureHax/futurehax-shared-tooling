#!/bin/bash
set -euo pipefail

# Re-run Release and Doctor workflows without cutting new semver versions.
# Usage: ./scripts/batch-rerun-release-workflow.sh [workspace-dir] [--dry-run] [--release-only] [--doctor-only]

WORKSPACE="/Users/marvin/Workspace"
DRY_RUN=false
RUN_RELEASE=true
RUN_DOCTOR=true

for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=true ;;
    --release-only) RUN_DOCTOR=false ;;
    --doctor-only) RUN_RELEASE=false ;;
    /*) WORKSPACE="$arg" ;;
  esac
done

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
  brightbeard-adventure-module
  cabin-fever-classes-module
  saltwater-sacrament-module
  scattered-seafloor-module
  item-piles-pirateborg-module
  pirate-borg-loot-sheet-npc
  pirate-borg-content-importer-module
  chaos-survival-mode
  Foundry-Module-Template
  foundry-adventure-module-template
  alpha-5-module
)

echo "=== Batch Re-run Release/Doctor Workflows ==="
echo "Workspace: $WORKSPACE"
echo "Dry run:   $DRY_RUN"
echo ""

TRIGGERED=0
SKIPPED=0
FAILED=0
FAILED_LIST=()

for project in "${PROJECTS[@]}"; do
  repo="FutureHax/$project"
  repo_path="$WORKSPACE/$project"

  if [ ! -d "$repo_path/.git" ]; then
    echo "SKIP: $project (not a git repo)"
    SKIPPED=$((SKIPPED + 1))
    continue
  fi

  echo "--- $project ---"

  if [ "$RUN_RELEASE" = true ] && [ -f "$repo_path/.github/workflows/release.yml" ]; then
    if [ "$DRY_RUN" = true ]; then
      echo "  [dry-run] would: gh workflow run release.yml --repo $repo --ref main"
    elif gh workflow run release.yml --repo "$repo" --ref main 2>/dev/null; then
      echo "  Release workflow triggered"
    else
      echo "  WARN: could not trigger Release for $repo"
    fi
  fi

  if [ "$RUN_DOCTOR" = true ] && [ -f "$repo_path/.github/workflows/doctor.yml" ]; then
    if [ "$DRY_RUN" = true ]; then
      echo "  [dry-run] would: gh workflow run doctor.yml --repo $repo --ref main"
    elif gh workflow run doctor.yml --repo "$repo" --ref main 2>/dev/null; then
      echo "  Doctor workflow triggered"
    else
      echo "  WARN: could not trigger Doctor for $repo"
    fi
  fi

  TRIGGERED=$((TRIGGERED + 1))
  echo ""
done

echo "=== Summary ==="
echo "Triggered: $TRIGGERED"
echo "Skipped:   $SKIPPED"
echo "Failed:    $FAILED"
if [ ${#FAILED_LIST[@]} -gt 0 ]; then
  printf '  - %s\n' "${FAILED_LIST[@]}"
fi
