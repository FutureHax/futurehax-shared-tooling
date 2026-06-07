module.exports = {
  "*": () => [
    "sh -c 'if command -v gitleaks >/dev/null 2>&1; then gitleaks protect --staged --no-banner -c .gitleaks.toml; else echo \"gitleaks not installed; skipping secret scan\"; fi'",
  ],

  "**/node_modules/**": () => [],

  "**/*.{js,mjs,cjs}": ["prettier --write", "eslint --fix"],
  "**/*.{json,yaml,yml}": ["prettier --write"],
  "**/*.{css,scss,less}": ["prettier --write"],
  "**/*.md": ["prettier --write"],

  "package.json": () => [
    "lockfile-lint --path package-lock.json --type npm --allowed-hosts npm --validate-https",
  ],
};
