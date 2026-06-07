#!/bin/bash
set -euo pipefail

# Migrate a project to use .shared-tooling submodule
# Usage: ./scripts/migrate-project.sh <repo-path> <project-type>
# Project types: foundry-module, foundry-module-extended, foundry-content, node-base

REPO_PATH="${1:?Usage: migrate-project.sh <repo-path> <project-type>}"
PROJECT_TYPE="${2:-foundry-module}"
SHARED_TOOLING_URL="${SHARED_TOOLING_URL:-https://github.com/FutureHax/futurehax-shared-tooling.git}"
BRANCH_NAME="chore/shared-tooling-migration"

cd "$REPO_PATH"

echo "=== Migrating $(basename "$REPO_PATH") (type: $PROJECT_TYPE) ==="

# Create migration branch
git checkout -b "$BRANCH_NAME" 2>/dev/null || git checkout "$BRANCH_NAME"

# Add submodule
if [ ! -d ".shared-tooling" ]; then
  git submodule add "$SHARED_TOOLING_URL" .shared-tooling
fi

# Generate eslint.config.mjs
case "$PROJECT_TYPE" in
  foundry-module)
    cat > eslint.config.mjs << 'EOF'
import { createFoundryConfig } from "./.shared-tooling/eslint/foundry-module.mjs";
export default createFoundryConfig();
EOF
    ;;
  foundry-module-extended)
    cat > eslint.config.mjs << 'EOF'
import { createFoundryConfig } from "./.shared-tooling/eslint/foundry-module.mjs";
import { appGlobals } from "./.shared-tooling/eslint/globals.mjs";
export default createFoundryConfig({ extraGlobals: appGlobals });
EOF
    ;;
  foundry-content)
    cat > eslint.config.mjs << 'EOF'
import { createFoundryConfig } from "./.shared-tooling/eslint/foundry-module.mjs";
import { appGlobals } from "./.shared-tooling/eslint/globals.mjs";
export default createFoundryConfig({
  extraGlobals: appGlobals,
  ignores: ["REFERENCE/**"],
});
EOF
    ;;
  node-base)
    cat > eslint.config.mjs << 'EOF'
import { createNodeConfig } from "./.shared-tooling/eslint/node-base.mjs";
export default createNodeConfig();
EOF
    ;;
esac

# Generate commitlint.config.ts
case "$PROJECT_TYPE" in
  node-base)
    cat > commitlint.config.ts << 'EOF'
export { default } from "./.shared-tooling/commitlint/base.ts";
EOF
    ;;
  *)
    cat > commitlint.config.ts << 'EOF'
export { default } from "./.shared-tooling/commitlint/foundry-module.ts";
EOF
    ;;
esac

# Generate lint-staged.config.js
case "$PROJECT_TYPE" in
  foundry-module|foundry-module-extended|foundry-content)
    if [ -f lint-staged.config.js ]; then
      # Check if it's the minimal variant (< 6 lines)
      LINE_COUNT=$(wc -l < lint-staged.config.js)
      if [ "$LINE_COUNT" -lt 6 ]; then
        cat > lint-staged.config.js << 'EOF'
module.exports = require("./.shared-tooling/lint-staged/minimal.js");
EOF
      else
        cat > lint-staged.config.js << 'EOF'
module.exports = require("./.shared-tooling/lint-staged/full.js");
EOF
      fi
    else
      cat > lint-staged.config.js << 'EOF'
module.exports = require("./.shared-tooling/lint-staged/minimal.js");
EOF
    fi
    ;;
  node-base)
    cat > lint-staged.config.js << 'EOF'
module.exports = require("./.shared-tooling/lint-staged/node-base.js");
EOF
    ;;
esac

# Generate .releaserc.js
case "$PROJECT_TYPE" in
  foundry-module|foundry-module-extended|foundry-content)
    cat > .releaserc.js << 'EOF'
const { createReleaseConfig } = require("./.shared-tooling/releaserc/foundry-module.js");
module.exports = createReleaseConfig();
EOF
    ;;
  node-base)
    cat > .releaserc.js << 'EOF'
const { createReleaseConfig } = require("./.shared-tooling/releaserc/node-base.js");
module.exports = createReleaseConfig();
EOF
    ;;
esac

# Update package.json prettier config
if command -v jq >/dev/null 2>&1; then
  jq '.prettier = "./.shared-tooling/prettier/base.json"' package.json > package.json.tmp
  mv package.json.tmp package.json
fi

# Wire husky hooks
mkdir -p .husky
cat > .husky/pre-commit << 'EOF'
./.shared-tooling/husky/pre-commit.sh
EOF
chmod +x .husky/pre-commit

cat > .husky/commit-msg << 'EOF'
./.shared-tooling/husky/commit-msg.sh "$1"
EOF
chmod +x .husky/commit-msg

# Remove old tasks/husky/ scripts (now in submodule)
rm -f tasks/husky/pre-commit.sh tasks/husky/commit-msg.sh
rmdir tasks/husky 2>/dev/null || true

# Remove old tasks/semantic-release/ (now in submodule)
rm -f tasks/semantic-release/foundry-module-plugin.cjs
rmdir tasks/semantic-release 2>/dev/null || true

# Remove duplicate lint-staged configs
rm -f .lintstagedrc.js .lintstagedrc.json

# Generate slim Taskfile.yml
if [ "$PROJECT_TYPE" != "node-base" ]; then
  MODULE_ID=$(jq -r '.name // .id // "unknown"' package.json 2>/dev/null || echo "unknown")
  cat > Taskfile.yml << EOF
version: "3"

dotenv: [".env"]

includes:
  shared: .shared-tooling/taskfile/foundry-module.yml

vars:
  MODULE_ID: ${MODULE_ID}

tasks:
  default:
    desc: "Show available tasks"
    cmds:
      - task --list
EOF
else
  cat > Taskfile.yml << 'EOF'
version: "3"

dotenv: [".env"]

includes:
  shared: .shared-tooling/taskfile/node-base.yml

tasks:
  default:
    desc: "Show available tasks"
    cmds:
      - task --list
EOF
fi

echo "✓ Migration complete for $(basename "$REPO_PATH")"
echo "  Review changes, then: git add -A && git commit && git push -u origin $BRANCH_NAME"
