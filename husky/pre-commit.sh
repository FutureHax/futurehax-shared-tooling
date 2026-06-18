#!/bin/bash
[ -n "$CI" ] && exit 0
[ "$HUSKY" = "0" ] && exit 0

cd "$(git rev-parse --show-toplevel)" || exit 1
npx lint-staged

# Verify the project builds whenever source files are staged.
if git diff --cached --name-only | grep -qE '\.(ts|tsx|js|jsx|mjs|cjs|svelte|vue)$'; then
  npm run build
fi

# Run module-doctor and block the commit on any error-severity findings.
# Requires @futurehax/module-doctor in devDependencies (file:../futurehax-module-doctor).
if npx --no -- module-doctor --version >/dev/null 2>&1; then
  npx module-doctor audit . --fail-on errors --output -
fi
