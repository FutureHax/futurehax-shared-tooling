#!/bin/bash
set -euo pipefail

if [ -f ".env" ]; then
  # shellcheck disable=SC1091
  source ".env"
fi

target="${1:-f14}"
case "$target" in
  f14) remote_host="${FOUNDRY_HOST_DEV:-${FOUNDRY14:-${FOUNDRY_HOST:-}}}" ; default_data_path="foundry14data" ;;
  f13) remote_host="${FOUNDRY_HOST_DEV:-${FOUNDRY13:-${FOUNDRY_HOST:-}}}" ; default_data_path="foundry13data" ;;
  f12) remote_host="${FOUNDRY_HOST_DEV:-${FOUNDRY12:-${FOUNDRY_HOST:-}}}" ; default_data_path="foundry12data" ;;
  *)
    echo "ERROR: Invalid target '$target'. Use f14, f13, or f12."
    exit 1
    ;;
esac

if [ -z "${remote_host:-}" ]; then
  echo "ERROR: No remote host configured for $target. Set FOUNDRY_HOST_DEV or FOUNDRY14/13/12."
  exit 1
fi

temp_dir="$(mktemp -d)"
trap 'rm -rf "$temp_dir"' EXIT

cp -r foundry_vtt/* "$temp_dir/"
rm -rf "$temp_dir/packs/_source" "$temp_dir/packs/_source/"* "$temp_dir/packs/_backup_"* 2>/dev/null || true

if [ -f "foundry_vtt/module-dev.json" ]; then
  cp "foundry_vtt/module-dev.json" "$temp_dir/module.json"
else
  jq '.id=(.id + "-dev") | .title=(.title + " (Development)") | .version=(.version + "-dev")' "foundry_vtt/module.json" > "$temp_dir/module.json"
fi
rm -f "$temp_dir/module-dev.json"

module_id="$(jq -r '.id' "$temp_dir/module.json")"
module_title="$(jq -r '.title' "$temp_dir/module.json")"
data_path="${FOUNDRY_DATA_PATH:-$default_data_path}"
modules_root="${FOUNDRY_MODULES_PATH:-$data_path/Data/modules}"
module_path="${modules_root}/${module_id}"

if [[ "$module_path" != *"/Data/modules/"* ]]; then
  echo "ERROR: Refusing unsafe module path: $module_path"
  exit 1
fi

if [ ! -f "$temp_dir/module.json" ]; then
  echo "ERROR: module.json missing from development payload"
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

echo "✓ Development install complete: ${module_id}"
