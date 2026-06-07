#!/bin/bash
set -euo pipefail

if [ -f ".env" ]; then
  # shellcheck disable=SC1091
  source ".env"
fi

target="${1:-f14}"
case "$target" in
  f14) remote_host="${FOUNDRY14:-${FOUNDRY_HOST:-}}" ; default_data_path="foundry14data" ;;
  f13) remote_host="${FOUNDRY13:-${FOUNDRY_HOST:-}}" ; default_data_path="foundry13data" ;;
  f12) remote_host="${FOUNDRY12:-${FOUNDRY_HOST:-}}" ; default_data_path="foundry12data" ;;
  *)
    echo "ERROR: Invalid target '$target'. Use f14, f13, or f12."
    exit 1
    ;;
esac

if [ -z "${remote_host:-}" ]; then
  echo "ERROR: No remote host configured for $target. Set FOUNDRY14/13/12 or FOUNDRY_HOST."
  exit 1
fi

module_id="$(jq -r '.id' foundry_vtt/module.json)"
module_title="$(jq -r '.title' foundry_vtt/module.json)"
data_path="${FOUNDRY_DATA_PATH:-$default_data_path}"
modules_root="${FOUNDRY_MODULES_PATH:-$data_path/Data/modules}"
module_path="${modules_root}/${module_id}"

if [[ "$module_path" != *"/Data/modules/"* ]]; then
  echo "ERROR: Refusing unsafe module path: $module_path"
  exit 1
fi

temp_dir="$(mktemp -d)"
trap 'rm -rf "$temp_dir"' EXIT

cp -r foundry_vtt/* "$temp_dir/"
rm -rf "$temp_dir/packs/_source" "$temp_dir/packs/_source/"* "$temp_dir/packs/_backup_"* 2>/dev/null || true
rm -f "$temp_dir/module-dev.json"

if [ ! -f "$temp_dir/module.json" ]; then
  echo "ERROR: module.json missing from deployment payload"
  exit 1
fi

artifact_rel=""
if [ -f "$temp_dir/dist/module.js" ]; then
  artifact_rel="dist/module.js"
elif [ -f "$temp_dir/module.js" ]; then
  artifact_rel="module.js"
elif [ -f "$temp_dir/scripts/main.js" ]; then
  artifact_rel="scripts/main.js"
fi

echo "Installing ${module_title} (${module_id}) to ${remote_host}:${module_path}"
ssh "$remote_host" "rm -rf \"$module_path\" && mkdir -p \"$module_path\""
scp -r "$temp_dir"/* "$remote_host:$module_path/"

ssh "$remote_host" "test -f \"$module_path/module.json\""
if [ -n "$artifact_rel" ]; then
  ssh "$remote_host" "test -f \"$module_path/$artifact_rel\""
fi

echo "✓ Production install complete: ${module_id}"
