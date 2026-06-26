#!/bin/bash
set -euo pipefail

# Create missing GitHub Releases for git tags and upload assets from CDN.
# Usage: ./scripts/batch-backfill-github-releases.sh [--dry-run]

DRY_RUN=false
if [[ "${1:-}" == "--dry-run" ]]; then
  DRY_RUN=true
fi

CDN_DOMAIN="${CDN_DOMAIN:-downloads.r2plays.games}"

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
  pirate-borg-statblock-importer
  pirate-borg-content-importer-module
  chaos-survival-mode
  alpha-5-module
)

echo "=== Backfill Missing GitHub Releases ==="
echo "Dry run: $DRY_RUN"
echo ""

CREATED=0
SKIPPED=0
FAILED=0

for project in "${PROJECTS[@]}"; do
  repo="FutureHax/$project"
  echo "--- $project ---"

  if ! gh repo view "$repo" >/dev/null 2>&1; then
    echo "SKIP: repo not found"
    SKIPPED=$((SKIPPED + 1))
    continue
  fi

  latest_tag=$(gh api "repos/$repo/tags" --jq '.[0].name' 2>/dev/null || echo "")
  if [ -z "$latest_tag" ] || [ "$latest_tag" = "null" ]; then
    echo "SKIP: no tags"
    SKIPPED=$((SKIPPED + 1))
    continue
  fi

  if gh release view "$latest_tag" --repo "$repo" >/dev/null 2>&1; then
    assets=$(gh release view "$latest_tag" --repo "$repo" --json assets --jq '.assets | length')
    if [ "$assets" -ge 2 ]; then
      echo "OK: $latest_tag release exists with $assets assets"
      SKIPPED=$((SKIPPED + 1))
      continue
    fi
    echo "Release $latest_tag exists but missing assets ($assets)"
  else
    echo "Missing release for tag $latest_tag"
  fi

  version="${latest_tag#v}"
  package_id=$(gh api "repos/$repo/contents/foundry_vtt/module.json" --jq '.content' 2>/dev/null | base64 -d 2>/dev/null | jq -r '.id' || echo "$project")
  if [ -z "$package_id" ] || [ "$package_id" = "null" ] || [[ "$package_id" == *"{{"* ]]; then
    package_id="$project"
  fi

  tmpdir=$(mktemp -d)
  trap 'rm -rf "$tmpdir"' EXIT

  zip_url="https://${CDN_DOMAIN}/futurehax/${package_id}/v${version}/module.zip"
  json_url="https://${CDN_DOMAIN}/futurehax/${package_id}/v${version}/module.json"

  if ! curl -fsSL "$zip_url" -o "$tmpdir/module.zip"; then
    echo "FAIL: could not download $zip_url"
    FAILED=$((FAILED + 1))
    rm -rf "$tmpdir"
    trap - EXIT
    continue
  fi
  if ! curl -fsSL "$json_url" -o "$tmpdir/module.json"; then
    echo "FAIL: could not download $json_url"
    FAILED=$((FAILED + 1))
    rm -rf "$tmpdir"
    trap - EXIT
    continue
  fi

  if [ "$DRY_RUN" = true ]; then
    echo "  [dry-run] would create/upload release $latest_tag from CDN"
    SKIPPED=$((SKIPPED + 1))
    rm -rf "$tmpdir"
    trap - EXIT
    continue
  fi

  if ! gh release view "$latest_tag" --repo "$repo" >/dev/null 2>&1; then
    gh release create "$latest_tag" --repo "$repo" --title "$latest_tag" --verify-tag
  fi
  gh release upload "$latest_tag" --repo "$repo" "$tmpdir/module.zip" "$tmpdir/module.json" --clobber
  echo "OK: backfilled $latest_tag"
  CREATED=$((CREATED + 1))

  rm -rf "$tmpdir"
  trap - EXIT
  echo ""
done

echo "=== Summary ==="
echo "Created/backfilled: $CREATED"
echo "Skipped:            $SKIPPED"
echo "Failed:             $FAILED"

exit $(( FAILED > 0 ? 1 : 0 ))
