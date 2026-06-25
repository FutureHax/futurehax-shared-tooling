#!/bin/bash
set -euo pipefail

# Batch rollout: bump .shared-tooling, dedupe local build scripts, push to main.
# Usage: ./scripts/batch-rollout-pack-fix.sh [workspace-dir] [--dry-run]

WORKSPACE="${1:-/Users/marvin/Workspace}"
DRY_RUN=false
if [[ "${2:-}" == "--dry-run" ]] || [[ "${1:-}" == "--dry-run" ]]; then
  DRY_RUN=true
  if [[ "${1:-}" == "--dry-run" ]]; then
    WORKSPACE="${2:-/Users/marvin/Workspace}"
  fi
fi

COMMIT_MSG="chore(tooling): dedupe build scripts and bump shared-tooling for pack-at-release"

# Foundry modules with shared-tooling submodule (from batch-migrate PROJECTS map)
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
)

resolve_build_script() {
  local repo_path="$1"
  local pkg
  pkg=$(node -e "console.log(JSON.stringify(require('$repo_path/package.json').scripts||{}))")

  if echo "$pkg" | grep -q '"build".*vite build'; then
    echo "vite build && node .shared-tooling/release/build-module.js"
  elif [ -f "$repo_path/Taskfile.yml" ] && grep -q 'release:build-module:' "$repo_path/.shared-tooling/taskfile/foundry-module.yml" 2>/dev/null; then
    echo "node .shared-tooling/release/build-module.js"
  else
    echo "node .shared-tooling/release/build-module.js"
  fi
}

update_package_build() {
  local repo_path="$1"
  local new_build="$2"
  node - <<EOF
const fs = require('fs');
const path = '$repo_path/package.json';
const pkg = JSON.parse(fs.readFileSync(path, 'utf8'));
pkg.scripts = pkg.scripts || {};
const current = pkg.scripts.build || '';
if (current.includes('tasks/release/build-module') || !current.includes('.shared-tooling/release/build-module')) {
  if (!current.includes('vite build &&')) {
    pkg.scripts.build = '$new_build';
  } else {
    pkg.scripts.build = 'vite build && node .shared-tooling/release/build-module.js';
  }
}
fs.writeFileSync(path, JSON.stringify(pkg, null, 2) + '\n');
EOF
}

echo "=== Batch Pack-at-Release Rollout ==="
echo "Workspace: $WORKSPACE"
echo "Dry run:   $DRY_RUN"
echo ""

PUSHED=0
SKIPPED=0
FAILED=0
FAILED_LIST=()

for project in "${PROJECTS[@]}"; do
  repo_path="$WORKSPACE/$project"
  if [ ! -d "$repo_path" ]; then
    echo "SKIP: $project (not found)"
    SKIPPED=$((SKIPPED + 1))
    continue
  fi

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
  (
    cd "$repo_path"

    if [ "$DRY_RUN" = false ]; then
      git submodule update --init --recursive .shared-tooling 2>/dev/null || true
      git submodule update --remote .shared-tooling
    else
      echo "  [dry-run] would: git submodule update --remote .shared-tooling"
    fi

    if [ -f "tasks/release/build-module.js" ]; then
      if [ "$DRY_RUN" = false ]; then
        rm -f tasks/release/build-module.js
        rmdir tasks/release 2>/dev/null || true
        rmdir tasks 2>/dev/null || true
      else
        echo "  [dry-run] would: delete tasks/release/build-module.js"
      fi
    fi

    if [ -f "package.json" ]; then
      new_build=$(resolve_build_script "$repo_path")
      if [ "$DRY_RUN" = false ]; then
        update_package_build "$repo_path" "$new_build"
      else
        echo "  [dry-run] would: set build script to $new_build"
      fi
    fi

    if [ "$DRY_RUN" = false ] && command -v module-doctor >/dev/null 2>&1; then
      if ! module-doctor audit . --fail-on errors --quiet 2>/dev/null; then
        if ! npx --no module-doctor audit . --fail-on errors 2>/dev/null; then
          echo "FAIL: $project (module-doctor errors)"
          exit 2
        fi
      fi
    fi

    if [ "$DRY_RUN" = true ]; then
      echo "  [dry-run] would commit and push"
      exit 0
    fi

    if git diff --quiet && git diff --cached --quiet; then
      echo "SKIP: $project (no changes)"
      exit 3
    fi

    git add -A
    git commit -m "$COMMIT_MSG"
    git push origin main
  )
  status=$?
  case $status in
    0) PUSHED=$((PUSHED + 1)); echo "OK: $project" ;;
    3) SKIPPED=$((SKIPPED + 1)); echo "SKIP: $project (no changes)" ;;
    *) FAILED=$((FAILED + 1)); FAILED_LIST+=("$project"); echo "FAIL: $project" ;;
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
