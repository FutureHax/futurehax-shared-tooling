#!/bin/bash
set -euo pipefail

# Batch migrate all FutureHax projects to .shared-tooling
# Usage: ./scripts/batch-migrate.sh [workspace-dir]

WORKSPACE="${1:-/Users/marvin/Workspace}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
MIGRATE="$SCRIPT_DIR/migrate-project.sh"

# Project type mappings
declare -A PROJECTS=(
  # pb-* modules (minimal lint-staged tier)
  ["pb-combat-helper-overlay"]="foundry-module"
  ["pb-derelict-staging"]="foundry-module"
  ["pb-encounter-atlas-alpha"]="foundry-module"
  ["pb-job-board"]="foundry-module"
  ["pb-naval-combat-overlay"]="foundry-module"
  ["pb-pirate-forge"]="foundry-module"
  ["pb-potion-bench"]="foundry-module"
  ["pb-sea-travel"]="foundry-module"
  ["pb-shanty-engine"]="foundry-module"
  ["pb-storm-generator"]="foundry-module"
  ["pb-suite-manager"]="foundry-module"
  ["pb-tavern-plus"]="foundry-module"
  ["pb-treasure-staging"]="foundry-module"
  ["pb-wind-manager"]="foundry-module"

  # Template-derived modules (extended globals)
  ["foundry-mob-actor"]="foundry-module-extended"
  ["foundry-mob-actor-1"]="foundry-module-extended"
  ["foundry-character-vault-module"]="foundry-module-extended"
  ["Death-Effect-Reminder"]="foundry-module"
  ["Me-Beloved-SHIP"]="foundry-module"
  ["Pirate-Borg-Crew-and-Ship-Manager"]="foundry-module-extended"
  ["verbose-parakeet"]="foundry-module"

  # Content modules
  ["brightbeard-pirate-borg-adventure-module"]="foundry-content"
  ["cabin-fever-classes-module"]="foundry-content"
  ["saltwater-sacrament-module"]="foundry-content"
  ["scattered-seafloor-module"]="foundry-content"
  ["item-piles-pirateborg-module"]="foundry-content"
  ["pirate-borg-loot-sheet-npc"]="foundry-content"
  ["pirate-borg-statblock-importer"]="foundry-content"
  ["trapped-in-the-tropics"]="foundry-module"
  ["trapped-in-the-tropics-actors"]="foundry-module"

  # Non-Foundry Node projects
  ["alpha-5-bot"]="node-base"
  ["futurehax-website"]="node-base"
  ["travelling-merchant"]="node-base"
  ["zordon"]="node-base"
  ["tavern-tongue"]="node-base"
  ["reddimanye"]="node-base"
  ["safe-zones-dashboard"]="node-base"
  ["clippii"]="node-base"

  # Templates
  ["foundry-module-template"]="foundry-module"
  ["foundry-adventure-module-template"]="foundry-content"
)

echo "=== Batch Migration ==="
echo "Workspace: $WORKSPACE"
echo "Projects: ${#PROJECTS[@]}"
echo ""

MIGRATED=0
SKIPPED=0
FAILED=0

for project in "${!PROJECTS[@]}"; do
  type="${PROJECTS[$project]}"

  # Check both tmp-upgrade and workspace root
  if [ -d "$WORKSPACE/tmp-upgrade/$project" ]; then
    repo_path="$WORKSPACE/tmp-upgrade/$project"
  elif [ -d "$WORKSPACE/$project" ]; then
    repo_path="$WORKSPACE/$project"
  else
    echo "SKIP: $project (not found)"
    SKIPPED=$((SKIPPED + 1))
    continue
  fi

  if [ -d "$repo_path/.shared-tooling" ]; then
    echo "SKIP: $project (already migrated)"
    SKIPPED=$((SKIPPED + 1))
    continue
  fi

  echo "--- Migrating: $project ($type) ---"
  if bash "$MIGRATE" "$repo_path" "$type"; then
    MIGRATED=$((MIGRATED + 1))
  else
    echo "FAIL: $project"
    FAILED=$((FAILED + 1))
  fi
  echo ""
done

echo "=== Summary ==="
echo "Migrated: $MIGRATED"
echo "Skipped:  $SKIPPED"
echo "Failed:   $FAILED"
