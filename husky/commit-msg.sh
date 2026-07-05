#!/bin/bash
[ -n "$CI" ] && exit 0
[ "$HUSKY" = "0" ] && exit 0

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=ensure-node-path.sh
. "$SCRIPT_DIR/ensure-node-path.sh"

npx --no -- commitlint --edit "$1"
