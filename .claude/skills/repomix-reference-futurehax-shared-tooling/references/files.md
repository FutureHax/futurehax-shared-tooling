# Files

## File: commitlint/base.ts

```typescript
import type { UserConfig } from "@commitlint/types";

const Configuration: UserConfig = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [
      1,
      "always",
      ["build", "chore", "ci", "docs", "feat", "fix", "perf", "refactor", "revert", "style", "test", "tweak"],
    ],
    "body-max-line-length": [1, "always", 100],
  },
};

export default Configuration;
```

## File: commitlint/foundry-module.ts

```typescript
import type { UserConfig } from "@commitlint/types";

const Configuration: UserConfig = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [
      1,
      "always",
      ["build", "chore", "ci", "docs", "feat", "fix", "perf", "refactor", "revert", "style", "test", "tweak"],
    ],
    "body-max-line-length": [1, "always", 100],
    "scope-empty": [2, "never"],
  },
};

export default Configuration;
```

## File: eslint/foundry-module-extended.mjs

```javascript
import { createFoundryConfig } from "./foundry-module.mjs";
import { appGlobals } from "./globals.mjs";

/**
 * Extended Foundry module ESLint config that includes legacy Application framework globals
 * (Dialog, Application, FormApplication, renderTemplate).
 * Use for modules that interact with the v1 Application API.
 */
export default createFoundryConfig({
  extraGlobals: appGlobals,
});
```

## File: eslint/foundry-module.mjs

```javascript
import globals from "globals";
import { coreGlobals, documentGlobals, utilityGlobals } from "./globals.mjs";

const baseFoundryGlobals = {
  ...coreGlobals,
  ...documentGlobals,
  DialogV2: "readonly",
  ApplicationV2: "readonly",
  ...utilityGlobals,
};

/**
 * Create an ESLint flat config for a Foundry VTT module.
 *
 * @param {object} [options]
 * @param {Record<string, string>} [options.extraGlobals] - Additional globals beyond the base set
 * @param {string[]} [options.ignores] - Additional ignore patterns
 * @param {Record<string, any>} [options.rules] - Rule overrides
 * @returns {import('eslint').Linter.Config[]}
 */
export function createFoundryConfig(options = {}) {
  const { extraGlobals = {}, ignores = [], rules = {} } = options;

  return [
    {
      languageOptions: {
        ecmaVersion: 2022,
        sourceType: "module",
        globals: {
          ...globals.browser,
          ...globals.node,
          ...baseFoundryGlobals,
          ...extraGlobals,
        },
      },
      rules: {
        "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
        "no-console": "off",
        "prefer-const": "warn",
        "no-var": "error",
        eqeqeq: ["error", "always"],
        ...rules,
      },
      ignores: [
        "node_modules/**",
        "dist/**",
        "coverage/**",
        ".devcontainer/**",
        ".devcontainer-common/**",
        ".shared-tooling/**",
        ...ignores,
      ],
    },
  ];
}

export default createFoundryConfig();
```

## File: eslint/globals.mjs

```javascript
/**
 * Foundry VTT global variable definitions for ESLint.
 * Import specific sets or spread them all into your config.
 */

export const coreGlobals = {
  game: "readonly",
  ui: "readonly",
  canvas: "readonly",
  CONFIG: "readonly",
  CONST: "readonly",
  foundry: "readonly",
  Hooks: "readonly",
};

export const documentGlobals = {
  Actor: "readonly",
  Item: "readonly",
  ChatMessage: "readonly",
  Roll: "readonly",
};

export const appGlobals = {
  DialogV2: "readonly",
  ApplicationV2: "readonly",
  Dialog: "readonly",
  Application: "readonly",
  FormApplication: "readonly",
};

export const utilityGlobals = {
  TextEditor: "readonly",
  fromUuid: "readonly",
  fromUuidSync: "readonly",
  duplicate: "readonly",
  mergeObject: "readonly",
  setProperty: "readonly",
  getProperty: "readonly",
  hasProperty: "readonly",
  randomID: "readonly",
  debounce: "readonly",
  loadTemplates: "readonly",
  renderTemplate: "readonly",
  Handlebars: "readonly",
};

export const allFoundryGlobals = {
  ...coreGlobals,
  ...documentGlobals,
  ...appGlobals,
  ...utilityGlobals,
};
```

## File: eslint/next-app.mjs

```javascript
/**
 * Create an ESLint flat config for a FutureHax Next.js web app.
 *
 * Uses only peer deps the consumer already installs:
 *   @eslint/js, typescript-eslint, eslint-config-prettier
 *
 * If the project also has eslint-config-next installed, add it manually
 * on top of this config (it ships its own flat-config entrypoint in v15+).
 *
 * @param {object} [options]
 * @param {string[]} [options.ignores] - Additional ignore patterns
 * @param {Record<string, any>} [options.rules] - Rule overrides
 * @returns {import('eslint').Linter.Config[]}
 */
export async function createNextConfig(options = {}) {
  const { ignores = [], rules = {} } = options;

  const js = await import("@eslint/js").then((m) => m.default);
  const tseslint = await import("typescript-eslint").then((m) => m.default);
  const prettierConfig = await import("eslint-config-prettier").then((m) => m.default);

  return tseslint.config(
    js.configs.recommended,
    ...tseslint.configs.recommended,
    {
      ignores: [
        "**/node_modules/**",
        "**/.next/**",
        "**/dist/**",
        "**/out/**",
        "**/coverage/**",
        "**/.shared-tooling/**",
        ...ignores,
      ],
    },
    {
      rules: {
        "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
        "@typescript-eslint/no-explicit-any": "warn",
        ...rules,
      },
    },
    prettierConfig,
  );
}

export default await createNextConfig();
```

## File: eslint/node-base.mjs

```javascript
import globals from "globals";

/**
 * Create an ESLint flat config for a generic Node.js project (no Foundry globals).
 *
 * @param {object} [options]
 * @param {Record<string, string>} [options.extraGlobals] - Additional globals
 * @param {string[]} [options.ignores] - Additional ignore patterns
 * @param {Record<string, any>} [options.rules] - Rule overrides
 * @returns {import('eslint').Linter.Config[]}
 */
export function createNodeConfig(options = {}) {
  const { extraGlobals = {}, ignores = [], rules = {} } = options;

  return [
    {
      languageOptions: {
        ecmaVersion: 2022,
        sourceType: "module",
        globals: {
          ...globals.browser,
          ...globals.node,
          ...extraGlobals,
        },
      },
      rules: {
        "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
        "no-console": "off",
        "prefer-const": "warn",
        "no-var": "error",
        eqeqeq: ["error", "always"],
        ...rules,
      },
      ignores: [
        "node_modules/**",
        "dist/**",
        "coverage/**",
        ".devcontainer/**",
        ".devcontainer-common/**",
        ".shared-tooling/**",
        ...ignores,
      ],
    },
  ];
}

export default createNodeConfig();
```

## File: eslint/typescript.mjs

```javascript
import tseslint from "typescript-eslint";

/**
 * TypeScript ESLint overlay. Spread this into your flat config array
 * after the base config to add TS support.
 *
 * @param {object} [options]
 * @param {string[]} [options.files] - File patterns to apply TS rules to
 * @param {boolean} [options.typeChecked] - Enable type-checked rules (requires tsconfig)
 * @returns {import('eslint').Linter.Config[]}
 */
export function createTypescriptOverlay(options = {}) {
  const { files = ["**/*.ts", "**/*.tsx"], typeChecked = false } = options;

  if (typeChecked) {
    return [
      ...tseslint.configs.recommendedTypeChecked.map((config) => ({
        ...config,
        files,
      })),
    ];
  }

  return [
    ...tseslint.configs.recommended.map((config) => ({
      ...config,
      files,
    })),
  ];
}

export default createTypescriptOverlay();
```

## File: husky/commit-msg.sh

```bash
#!/bin/bash
[ -n "$CI" ] && exit 0
[ "$HUSKY" = "0" ] && exit 0

npx --no -- commitlint --edit "$1"
```

## File: husky/pre-push.sh

```bash
#!/bin/bash
# Pre-push hook: warn if compendium _source files were modified in commits
# being pushed without corresponding pack rebuilds.
[ -n "$CI" ] && exit 0
[ "$HUSKY" = "0" ] && exit 0

cd "$(git rev-parse --show-toplevel)" || exit 1

# Only relevant for modules with compendium source files
SOURCE_DIR="foundry_vtt/packs/_source"
[ -d "$SOURCE_DIR" ] || exit 0

# Determine which commits are being pushed
BRANCH=$(git branch --show-current)
REMOTE_BRANCH="origin/$BRANCH"

if ! git rev-parse "$REMOTE_BRANCH" >/dev/null 2>&1; then
  # No remote branch yet — skip check on first push
  exit 0
fi

CHANGED_SOURCE=$(git diff --name-only "$REMOTE_BRANCH"...HEAD 2>/dev/null | grep 'packs/_source' | wc -l | tr -d ' ')
CHANGED_PACKS=$(git diff --name-only "$REMOTE_BRANCH"...HEAD 2>/dev/null | grep 'foundry_vtt/packs/' | grep -v '_source' | wc -l | tr -d ' ')

if [ "$CHANGED_SOURCE" -gt 0 ] && [ "$CHANGED_PACKS" -eq 0 ]; then
  echo ""
  echo "⚠  WARNING: Commits being pushed modify packs/_source but no compiled packs were updated."
  echo "   The shipped module will not reflect these source changes."
  echo ""
  echo "   To fix:"
  echo "     npm run pack"
  echo "     git add foundry_vtt/packs/"
  echo "     git commit --amend --no-edit"
  echo ""
  echo "   To push anyway (e.g. packs are rebuilt in CI): git push --no-verify"
  echo ""
  exit 1
fi

exit 0
```

## File: lint-staged/full.js

```javascript
module.exports = {
  "*": () => [
    "sh -c 'if command -v gitleaks >/dev/null 2>&1; then gitleaks protect --staged --no-banner -c .gitleaks.toml; else echo \"gitleaks not installed; skipping secret scan\"; fi'",
  ],

  "**/node_modules/**": () => [],

  "**/*.{js,mjs,cjs}": ["prettier --write", "eslint --fix"],
  "**/*.{json,yaml,yml}": ["prettier --write"],
  "**/*.{css,scss,less}": ["prettier --write"],
  "**/*.md": ["prettier --write"],

  "package.json": () => ["lockfile-lint --path package-lock.json --type npm --allowed-hosts npm --validate-https"],
};
```

## File: lint-staged/minimal.js

```javascript
module.exports = {
  "*.{js,mjs}": ["eslint --fix"],
  "*.{json,md,yml,yaml}": ["prettier --write"],
};
```

## File: lint-staged/node-base.js

```javascript
module.exports = {
  "**/*.{js,mjs,cjs,ts,tsx}": ["prettier --write", "eslint --fix"],
  "**/*.{json,yaml,yml}": ["prettier --write"],
  "**/*.{css,scss,less}": ["prettier --write"],
  "**/*.md": ["prettier --write"],
};
```

## File: prettier/base.json

```json
{
  "printWidth": 120
}
```

## File: release/build-module.js

```javascript
#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const archiver = require("archiver");

async function buildModule() {
  const projectRoot = process.cwd();
  const modulePath = path.join(projectRoot, "foundry_vtt", "module.json");
  const moduleJson = JSON.parse(fs.readFileSync(modulePath, "utf8"));
  const moduleId = moduleJson.id;
  const version = moduleJson.version;

  console.log(`Building module: ${moduleId} v${version}`);

  const distDir = path.join(projectRoot, "dist");
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }

  const outputPath = path.join(distDir, "module.zip");
  const output = fs.createWriteStream(outputPath);
  const archive = archiver("zip", { zlib: { level: 9 } });

  return new Promise((resolve, reject) => {
    output.on("close", () => {
      console.log(`✓ Created ${outputPath} (${archive.pointer()} bytes)`);
      resolve();
    });

    archive.on("error", reject);
    archive.pipe(output);

    archive.glob("**/*", {
      cwd: path.join(projectRoot, "foundry_vtt"),
      ignore: [
        "node_modules/**",
        ".git/**",
        ".gitignore",
        "module-dev.json",
        "__tests__/**",
        "**/__tests__/**",
        "**/__mocks__/**",
        "**/*.test.js",
        "**/*.test.mjs",
        "**/*.test.ts",
        "packs/_source/**",
        "packs/_backup_*/**",
      ],
    });

    archive.finalize();
  });
}

buildModule().catch((err) => {
  console.error("Error building module:", err);
  process.exit(1);
});
```

## File: release/foundry-module-plugin.cjs

```javascript
const fs = require("fs");
const path = require("path");
const archiver = require("archiver");
const { execSync } = require("child_process");
const { promisify } = require("util");
const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);

async function prepare(pluginConfig, context) {
  const { nextRelease, logger } = context;
  const { version } = nextRelease;

  const githubUrl = pluginConfig.githubUrl || "https://github.com";
  const repositoryPath = pluginConfig.repositoryPath || process.env.GITHUB_REPOSITORY;

  const modulePath = path.join(process.cwd(), "foundry_vtt", "module.json");
  const moduleContent = await readFile(modulePath, "utf8");
  const moduleJson = JSON.parse(moduleContent);

  moduleJson.version = version;

  const gcsBucket = process.env.GCS_BUCKET_NAME;
  const customDomain = process.env.CDN_DOMAIN || "downloads.r2plays.games";
  const packageId = pluginConfig.packageId || moduleJson.id;

  if (gcsBucket && customDomain) {
    moduleJson.manifest = `https://${customDomain}/futurehax/${packageId}/latest/module.json`;
    moduleJson.download = `https://${customDomain}/futurehax/${packageId}/v${version}/module.zip`;
    logger.log(`Using CDN URLs with domain: ${customDomain}`);
  } else if (gcsBucket) {
    moduleJson.manifest = `https://storage.googleapis.com/${gcsBucket}/futurehax/${packageId}/latest/module.json`;
    moduleJson.download = `https://storage.googleapis.com/${gcsBucket}/futurehax/${packageId}/v${version}/module.zip`;
    logger.log(`Using direct GCS URLs with bucket: ${gcsBucket}`);
  } else {
    moduleJson.manifest = `${githubUrl}/${repositoryPath}/releases/latest/download/module.json`;
    moduleJson.download = `${githubUrl}/${repositoryPath}/releases/download/v${version}/module.zip`;
    logger.log(`Using GitHub release URLs (CDN not configured)`);
  }

  await writeFile(modulePath, JSON.stringify(moduleJson, null, 2) + "\n");
  logger.log(`Updated module.json to version ${version}`);
  logger.log(`Set manifest URL: ${moduleJson.manifest}`);
  logger.log(`Set download URL: ${moduleJson.download}`);

  await writeFile(path.join(process.cwd(), "module.json"), JSON.stringify(moduleJson, null, 2) + "\n");
  logger.log(`Copied updated module.json to root for GitHub release upload`);

  await createModuleZip(version, logger);
}

async function createModuleZip(version, logger) {
  const modulePath = path.join(process.cwd(), "foundry_vtt", "module.json");
  const moduleContent = await readFile(modulePath, "utf8");
  const moduleJson = JSON.parse(moduleContent);

  if (moduleJson.version !== version) {
    logger.warn(`Warning: module.json version (${moduleJson.version}) doesn't match expected version (${version})`);
    moduleJson.version = version;
  }

  logger.log(`Creating module.zip with version ${version}`);

  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(path.join(process.cwd(), "module.zip"));
    const archive = archiver("zip", { zlib: { level: 9 } });

    output.on("close", () => {
      logger.log(`Created module.zip (${archive.pointer()} bytes)`);
      resolve();
    });

    archive.on("error", reject);
    archive.pipe(output);

    archive.glob("**/*", {
      cwd: path.join(process.cwd(), "foundry_vtt"),
      ignore: [
        "node_modules/**",
        ".git/**",
        ".gitignore",
        "module.json",
        "module-dev.json",
        "__tests__/**",
        "*.test.js",
      ],
    });

    archive.append(JSON.stringify(moduleJson, null, 2) + "\n", {
      name: "module.json",
    });

    archive.finalize();
  });
}

async function publish(pluginConfig, context) {
  const { nextRelease, logger } = context;
  const { version } = nextRelease;

  const foundryToken = process.env.PACKAGE_RELEASE_TOKEN;
  if (!foundryToken) {
    logger.log("PACKAGE_RELEASE_TOKEN not set, skipping Foundry VTT package update");
    return;
  }

  const githubUrl = pluginConfig.githubUrl || "https://github.com";
  const repositoryPath = pluginConfig.repositoryPath || process.env.GITHUB_REPOSITORY;
  const modulePath = path.join(process.cwd(), "foundry_vtt", "module.json");
  const moduleContent = await readFile(modulePath, "utf8");
  const moduleJson = JSON.parse(moduleContent);
  const packageId = pluginConfig.packageId || moduleJson.id;
  const dryRun = pluginConfig.dryRun || false;

  const gcsBucket = process.env.GCS_BUCKET_NAME;
  const customDomain = process.env.CDN_DOMAIN;

  let manifestUrl;
  if (gcsBucket && customDomain) {
    manifestUrl = `https://${customDomain}/futurehax/${packageId}/latest/module.json`;
  } else if (gcsBucket) {
    manifestUrl = `https://storage.googleapis.com/${gcsBucket}/futurehax/${packageId}/latest/module.json`;
  } else {
    manifestUrl = `${githubUrl}/${repositoryPath}/releases/latest/download/module.json`;
  }

  const releaseData = {
    id: packageId,
    "dry-run": dryRun,
    release: {
      version: version,
      manifest: manifestUrl,
      notes: `${githubUrl}/${repositoryPath}/releases/tag/v${version}`,
      compatibility: moduleJson.compatibility || {
        minimum: "12",
        verified: "12",
        maximum: "",
      },
    },
  };

  logger.log(`Updating Foundry VTT package listing for ${packageId} v${version}...`);

  try {
    const response = await fetch("https://api.foundryvtt.com/_api/packages/release_version/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: foundryToken,
      },
      body: JSON.stringify(releaseData),
    });

    let responseData;
    const responseText = await response.text();

    try {
      responseData = JSON.parse(responseText);
    } catch (_e) {
      responseData = { error: responseText };
    }

    if (response.ok) {
      if (dryRun) {
        logger.log(`✓ Foundry API dry run successful: ${responseData.message || "Success"}`);
      } else {
        logger.log(`✓ Successfully updated Foundry VTT package listing!`);
        if (responseData.page) {
          logger.log(`  Package page: ${responseData.page}`);
        }
      }
    } else {
      logger.error(`Failed to update Foundry VTT package listing: ${response.status} ${response.statusText}`);
      if (typeof responseData === "object") {
        logger.error(`Response: ${JSON.stringify(responseData, null, 2)}`);
      } else {
        logger.error(`Response: ${responseText}`);
      }

      if (response.status === 429) {
        const retryAfter = response.headers.get("Retry-After");
        logger.warn(`Rate limited. Retry after ${retryAfter} seconds`);
      }
    }
  } catch (error) {
    logger.error("Error calling Foundry VTT API:", error.message);
  }

  if (gcsBucket) {
    logger.log(`Uploading artifacts to GCS CDN...`);

    try {
      const moduleZipPath = path.join(process.cwd(), "module.zip");
      const moduleJsonPath = path.join(process.cwd(), "module.json");

      if (!fs.existsSync(moduleZipPath)) {
        logger.warn("module.zip not found, skipping GCS upload");
        return;
      }

      execSync(`gsutil -q cp ${moduleZipPath} gs://${gcsBucket}/futurehax/${packageId}/v${version}/`, {
        stdio: "inherit",
      });
      execSync(`gsutil -q cp ${moduleJsonPath} gs://${gcsBucket}/futurehax/${packageId}/v${version}/`, {
        stdio: "inherit",
      });
      execSync(
        `gsutil -m setmeta -h "Cache-Control:public, max-age=31536000, immutable" "gs://${gcsBucket}/futurehax/${packageId}/v${version}/**"`,
        { stdio: "inherit" },
      );

      execSync(`gsutil -q cp ${moduleZipPath} gs://${gcsBucket}/futurehax/${packageId}/latest/`, { stdio: "inherit" });
      execSync(`gsutil -q cp ${moduleJsonPath} gs://${gcsBucket}/futurehax/${packageId}/latest/`, { stdio: "inherit" });
      execSync(
        `gsutil -m setmeta -h "Cache-Control:no-cache, no-store, must-revalidate" "gs://${gcsBucket}/futurehax/${packageId}/latest/**"`,
        { stdio: "inherit" },
      );

      logger.log(`✓ Artifacts uploaded to CDN`);
      logger.log(`  Versioned: https://storage.googleapis.com/${gcsBucket}/futurehax/${packageId}/v${version}/`);
      logger.log(`  Latest: https://storage.googleapis.com/${gcsBucket}/futurehax/${packageId}/latest/`);

      if (customDomain) {
        logger.log(`  CDN Version: https://${customDomain}/futurehax/${packageId}/v${version}/`);
        logger.log(`  CDN Latest: https://${customDomain}/futurehax/${packageId}/latest/`);
      }
    } catch (error) {
      logger.warn("Failed to upload to GCS:", error.message);
    }
  } else {
    logger.log("GCS_BUCKET_NAME not set, skipping CDN upload");
  }
}

async function success(pluginConfig, context) {
  const { logger } = context;
  logger.log("Leaving module.zip and module.json in place for downstream steps.");
}

module.exports = { prepare, publish, success };
```

## File: release/install-dev.sh

```bash
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
```

## File: release/install-prod.sh

```bash
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
```

## File: releaserc/foundry-module.js

```javascript
/**
 * Create a semantic-release config for a Foundry VTT module.
 *
 * @param {object} [options]
 * @param {string} [options.branch] - Release branch (default: "main")
 * @param {string[]} [options.extraAssets] - Additional git-committed assets
 * @returns {object} semantic-release configuration
 */
function createReleaseConfig(options = {}) {
  const { branch = "main", extraAssets = [] } = options;

  return {
    branches: [branch],
    plugins: [
      [
        "@semantic-release/commit-analyzer",
        {
          preset: "angular",
          releaseRules: [
            { breaking: true, release: "major" },
            { type: "feat", release: "minor" },
            { type: "fix", release: "patch" },
            { type: "perf", release: "patch" },
            { type: "build", scope: "deps", release: "patch" },
          ],
          parserOpts: {
            noteKeywords: ["BREAKING CHANGE", "BREAKING CHANGES", "BREAKING"],
          },
        },
      ],
      [
        "@semantic-release/release-notes-generator",
        {
          preset: "angular",
          presetConfig: {
            types: [
              { type: "feat", section: "Features" },
              { type: "fix", section: "Bug Fixes" },
              { type: "perf", section: "Performance Improvements" },
              { type: "revert", section: "Reverts" },
              { type: "docs", section: "Documentation" },
              { type: "style", hidden: true },
              { type: "chore", hidden: true },
              { type: "refactor", hidden: true },
              { type: "test", hidden: true },
              { type: "build", hidden: true },
              { type: "ci", section: "Continuous Integration" },
            ],
          },
        },
      ],
      [
        "@semantic-release/changelog",
        {
          changelogFile: "CHANGELOG.md",
        },
      ],
      [
        "@semantic-release/npm",
        {
          npmPublish: false,
        },
      ],
      [
        "./.shared-tooling/release/foundry-module-plugin.cjs",
        {
          githubUrl: process.env.GITHUB_URL || "https://github.com",
          repositoryPath: process.env.GITHUB_REPOSITORY,
          dryRun: false,
        },
      ],
      [
        "@semantic-release/github",
        {
          assets: [
            {
              path: "module.zip",
              name: "module.zip",
              label: "FoundryVTT Module (v${nextRelease.version})",
            },
            {
              path: "module.json",
              name: "module.json",
              label: "Module Manifest (v${nextRelease.version})",
            },
          ],
        },
      ],
      [
        "@semantic-release/git",
        {
          assets: ["package.json", "package-lock.json", "CHANGELOG.md", "foundry_vtt/module.json", ...extraAssets],
          message: "chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}",
        },
      ],
    ],
  };
}

module.exports = { createReleaseConfig };
```

## File: releaserc/next-app.js

```javascript
/**
 * Create a semantic-release config for a FutureHax Next.js web app.
 *
 * Builds on the conventional-commit analyzer/notes/changelog/github/git flow
 * and optionally versions the Helm chart via `semantic-release-helm3`.
 *
 * Peer dependencies (consumer): semantic-release, the @semantic-release/*
 * plugins, and (for chartPath) semantic-release-helm3.
 *
 * @param {object} [options]
 * @param {string} [options.branch] - Release branch (default: "main")
 * @param {string} [options.chartPath] - Path to the Helm chart dir to version
 * @param {string[]} [options.extraAssets] - Additional git-committed assets
 * @param {any[]} [options.extraPlugins] - Additional semantic-release plugins inserted before
 *   the final git/github steps (use for custom exec, exec-per-env, etc.)
 * @returns {object} semantic-release configuration
 */
function createReleaseConfig(options = {}) {
  const { branch = "main", chartPath, extraAssets = [], extraPlugins = [] } = options;

  const plugins = [
    [
      "@semantic-release/commit-analyzer",
      {
        preset: "angular",
        releaseRules: [
          { breaking: true, release: "major" },
          { type: "feat", release: "minor" },
          { type: "fix", release: "patch" },
          { type: "perf", release: "patch" },
          { type: "build", scope: "deps", release: "patch" },
        ],
        parserOpts: {
          noteKeywords: ["BREAKING CHANGE", "BREAKING CHANGES", "BREAKING"],
        },
      },
    ],
    [
      "@semantic-release/release-notes-generator",
      {
        preset: "angular",
        presetConfig: {
          types: [
            { type: "feat", section: "Features" },
            { type: "fix", section: "Bug Fixes" },
            { type: "perf", section: "Performance Improvements" },
            { type: "revert", section: "Reverts" },
            { type: "docs", section: "Documentation" },
            { type: "ci", section: "Continuous Integration" },
            { type: "style", hidden: true },
            { type: "chore", hidden: true },
            { type: "refactor", hidden: true },
            { type: "test", hidden: true },
            { type: "build", hidden: true },
          ],
        },
      },
    ],
    ["@semantic-release/changelog", { changelogFile: "CHANGELOG.md" }],
  ];

  if (chartPath) {
    plugins.push(["semantic-release-helm3", { chartPath, onlyUpdateVersion: true }]);
  }

  // Extra plugins (e.g. @semantic-release/exec for custom publish scripts).
  for (const p of extraPlugins) {
    plugins.push(p);
  }

  plugins.push("@semantic-release/github", [
    "@semantic-release/git",
    {
      assets: [
        "package.json",
        "package-lock.json",
        "CHANGELOG.md",
        ...(chartPath ? [`${chartPath}/Chart.yaml`] : []),
        ...extraAssets,
      ],
      message: "chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}",
    },
  ]);

  return { branches: [branch], plugins };
}

module.exports = { createReleaseConfig };
```

## File: releaserc/node-base.js

```javascript
/**
 * Create a semantic-release config for a generic Node.js project.
 *
 * @param {object} [options]
 * @param {string} [options.branch] - Release branch (default: "main")
 * @param {string[]} [options.extraAssets] - Additional git-committed assets
 * @param {boolean} [options.npmPublish] - Whether to publish to npm (default: false)
 * @returns {object} semantic-release configuration
 */
function createReleaseConfig(options = {}) {
  const { branch = "main", extraAssets = [], npmPublish = false } = options;

  return {
    branches: [branch],
    plugins: [
      [
        "@semantic-release/commit-analyzer",
        {
          preset: "angular",
          releaseRules: [
            { breaking: true, release: "major" },
            { type: "feat", release: "minor" },
            { type: "fix", release: "patch" },
            { type: "perf", release: "patch" },
            { type: "build", scope: "deps", release: "patch" },
          ],
          parserOpts: {
            noteKeywords: ["BREAKING CHANGE", "BREAKING CHANGES", "BREAKING"],
          },
        },
      ],
      [
        "@semantic-release/release-notes-generator",
        {
          preset: "angular",
          presetConfig: {
            types: [
              { type: "feat", section: "Features" },
              { type: "fix", section: "Bug Fixes" },
              { type: "perf", section: "Performance Improvements" },
              { type: "revert", section: "Reverts" },
              { type: "docs", section: "Documentation" },
              { type: "style", hidden: true },
              { type: "chore", hidden: true },
              { type: "refactor", hidden: true },
              { type: "test", hidden: true },
              { type: "build", hidden: true },
              { type: "ci", section: "Continuous Integration" },
            ],
          },
        },
      ],
      [
        "@semantic-release/changelog",
        {
          changelogFile: "CHANGELOG.md",
        },
      ],
      [
        "@semantic-release/npm",
        {
          npmPublish,
        },
      ],
      "@semantic-release/github",
      [
        "@semantic-release/git",
        {
          assets: ["package.json", "package-lock.json", "CHANGELOG.md", ...extraAssets],
          message: "chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}",
        },
      ],
    ],
  };
}

module.exports = { createReleaseConfig };
```

## File: rules/next-app/next-app-spec.mdc

```
---
description: Baseline conventions for FutureHax Next.js web apps (Chakra UI + Prisma + Helm/Flux)
alwaysApply: true
---

# FutureHax Next.js App Conventions

This project is a FutureHax Next.js web app scaffolded from
`nextjs-webapp-template`. Hold to the canonical stack and structure. Drift is
audited by `futurehax-next-doctor`.

## Stack (do not substitute)

- **Framework**: Next.js (App Router) under `src/app/`. No `pages/` router.
- **Language**: TypeScript, `strict` mode. Keep a `type-check` script (`tsc --noEmit`).
- **UI**: Chakra UI v3 + Emotion (`@chakra-ui/react`, `@emotion/react`, `@emotion/styled`).
  Do **not** introduce shadcn/ui or Tailwind. Theme lives in `src/theme.ts`;
  the app is wrapped by `src/providers/ChakraProviders.tsx`.
- **Data**: Prisma + PostgreSQL. Schema in `prisma/schema.prisma`; keep
  `db:generate` / `db:migrate` / `db:seed` scripts.
- **Validation**: `zod`.

## Tooling

- ESLint via the shared preset (`.shared-tooling/eslint/next-app.mjs`) extending
  `next/core-web-vitals`, `next/typescript`, and `prettier`.
- Prettier: `printWidth: 120`, `singleQuote: true`, `trailingComma: "es5"`.
- Husky + commitlint (conventional commits) + lint-staged.
- Tests with Vitest; keep `test` and `test:run` scripts.

## Delivery

- Dockerfile + `docker-bake.hcl`; `.dockerignore` excludes `node_modules`/`.env*`.
- Helm chart under `chart/` (with `secret-provider` + `certificate` templates);
  Flux GitOps manifests under `flux/`.
- Release via `semantic-release` (+ `semantic-release-helm3`) on `main`.
- CI runs lint, type-check, build, and release.

## Security & infra

- Commit `package-lock.json`. Never commit `.env*` or service-account keys;
  keep `.env*` in `.gitignore` and document vars in `.env.example`.
- Dependabot (`npm`) and a code-scanning workflow must be enabled.
- Deploy/release workflows source non-secret CDN/GCP config from repository
  variables (`vars.*`) and authenticate to GCP via `google-github-actions/auth`
  with secrets. Define reviewers in `.github/CODEOWNERS`.
```

## File: scripts/batch-migrate.sh

```bash
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
```

## File: scripts/migrate-project.sh

```bash
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
```

## File: scripts/open-prs.sh

```bash
#!/bin/bash
set -euo pipefail

# Open PRs for all migrated projects
# Usage: ./scripts/open-prs.sh [workspace-dir]
# Requires: gh CLI authenticated

WORKSPACE="${1:-/Users/marvin/Workspace}"
BRANCH_NAME="chore/shared-tooling-migration"

PR_TITLE="chore(tooling): migrate to shared-tooling submodule + reusable CI"
PR_BODY="$(cat << 'EOF'
## Summary

- Added `.shared-tooling` git submodule pointing to `FutureHax/futurehax-shared-tooling`
- Replaced inline ESLint, commitlint, prettier, lint-staged, and releaserc configs with thin wrappers that import from the submodule
- Standardized husky hooks to delegate to submodule scripts (with CI skip)
- Slimmed Taskfile.yml to use shared includes
- Removed duplicated `tasks/husky/` and `tasks/semantic-release/` scripts

## Why

Consolidates ~40 copies of identical tooling configs into a single source of truth.
Future updates only need to be made in one place.

## Test plan

- [ ] `npm ci` installs cleanly
- [ ] `npm run lint` passes
- [ ] `npm run test:ci` passes
- [ ] `git commit` triggers commitlint via husky
- [ ] `npx semantic-release --dry-run` resolves the plugin correctly
EOF
)"

OPENED=0
FAILED=0

find_repos() {
  for dir in "$WORKSPACE/tmp-upgrade"/*/ "$WORKSPACE"/*/; do
    if [ -d "$dir/.git" ] && git -C "$dir" rev-parse --verify "$BRANCH_NAME" >/dev/null 2>&1; then
      echo "$dir"
    fi
  done
}

for repo in $(find_repos); do
  project="$(basename "$repo")"
  echo "--- $project ---"

  cd "$repo"
  git checkout "$BRANCH_NAME"

  # Stage and commit if needed
  if [ -n "$(git status --porcelain)" ]; then
    git add -A
    git commit -m "chore(tooling): migrate to shared-tooling submodule

Replace inline configs with thin wrappers importing from .shared-tooling
submodule. Standardize husky hooks, Taskfile, and release configuration."
  fi

  # Push branch
  if ! git push -u origin "$BRANCH_NAME" 2>/dev/null; then
    echo "FAIL: Could not push $project"
    FAILED=$((FAILED + 1))
    continue
  fi

  # Create PR
  if gh pr create --title "$PR_TITLE" --body "$PR_BODY" --base main 2>/dev/null; then
    OPENED=$((OPENED + 1))
  else
    echo "WARN: PR may already exist for $project"
    OPENED=$((OPENED + 1))
  fi

  cd - > /dev/null
done

echo ""
echo "=== PRs Opened: $OPENED | Failed: $FAILED ==="
```

## File: skills/next-app/writing-nextjs-app-spec/SKILL.md

```markdown
---
name: writing-nextjs-app-spec
description: Use when authoring or updating docs/SPEC.md for a FutureHax Next.js web app, scoping a new app from nextjs-webapp-template, or changing its public surface (routes, env vars, data model, deploy infra). Keeps the spec aligned with the Chakra/Prisma/Helm baseline that futurehax-next-doctor audits.
---

# Writing a FutureHax Next.js App Spec

Every FutureHax Next.js web app keeps a `docs/SPEC.md` describing its purpose,
surface, and operational contract. Update the spec **before** non-trivial
changes, and keep it consistent with the `nextjs-webapp-template` baseline.

## When to use

- Scaffolding a new app from `nextjs-webapp-template`.
- Adding/removing routes, API endpoints, or env vars.
- Changing the Prisma data model.
- Changing deploy infra (Helm chart, Flux, GCP config).

## Required sections

1. **Overview & user value** — what the app does and for whom.
2. **Scope** — in/out of scope; out-of-scope should list anything off the
   canonical stack.
3. **Routes & API** — App Router routes (`src/app`), server actions, API handlers.
4. **Data model** — Prisma models and key relations; migration notes.
5. **Environment** — every variable, mirrored in `.env.example`; mark secrets.
6. **Deploy** — Helm chart values per env, Flux wiring, GCP/CDN variables
   (sourced from repo `vars.*`), required GitHub secrets.
7. **Testing** — Vitest unit coverage and any e2e suite.
8. **Change log** — dated entries per release.

## Guardrails

- Do not document or introduce shadcn/Tailwind — the UI stack is **Chakra UI**.
- Keep Node engines, lint/format, hooks, and release tooling delegated to
  `.shared-tooling` presets.
- After editing the spec, run `next-doctor audit .` to confirm no new drift.
```

## File: taskfile/next-app.yml

```yaml
version: "3"

tasks:
  # Husky
  husky:commit-msg:
    silent: true
    cmds:
      - ./.shared-tooling/husky/commit-msg.sh

  husky:pre-commit:
    silent: true
    cmds:
      - ./.shared-tooling/husky/pre-commit.sh

  # Dependencies
  dependencies:install:
    silent: true
    desc: "Install Node.js dependencies"
    cmds:
      - |
        if [ -f package-lock.json ]; then npm ci; else npm install; fi
      - npm run prepare

  # Next.js dev / build
  dev:
    desc: "Start the Next.js dev server"
    cmds:
      - npm run dev

  build:
    desc: "Build the Next.js app"
    cmds:
      - npm run build

  lint:
    desc: "Run ESLint"
    cmds:
      - npm run lint

  type-check:
    desc: "Run TypeScript type checking"
    cmds:
      - npm run type-check

  test:
    desc: "Run tests"
    cmds:
      - npm test

  test:run:
    desc: "Run tests once"
    cmds:
      - npm run test:run

  # Prisma
  db:generate:
    desc: "Generate the Prisma client"
    cmds:
      - npm run db:generate

  db:migrate:
    desc: "Run Prisma migrations (dev)"
    cmds:
      - npm run db:migrate

  db:seed:
    desc: "Seed the database"
    cmds:
      - npm run db:seed

  # Release
  release:
    desc: "Create a new release using semantic-release"
    env:
      GITHUB_TOKEN: "{{.GITHUB_TOKEN}}"
      GH_TOKEN: "{{.GITHUB_TOKEN}}"
    cmds:
      - |
        if [ -z "$GITHUB_TOKEN" ]; then
          echo "ERROR: GITHUB_TOKEN is required. Set it in your .env file"
          exit 1
        fi
      - npx semantic-release
```

## File: taskfile/node-base.yml

```yaml
version: "3"

tasks:
  # Husky Tasks
  husky:init:
    silent: true
    desc: "Initialize Husky"
    cmds:
      - npx husky init

  husky:commit-msg:
    silent: true
    cmds:
      - ./.shared-tooling/husky/commit-msg.sh

  husky:pre-commit:
    silent: true
    cmds:
      - ./.shared-tooling/husky/pre-commit.sh

  # Dependency Tasks
  dependencies:install:
    silent: true
    desc: "Install Node.js dependencies"
    cmds:
      - |
        if [ -f package-lock.json ]; then
          npm ci
        else
          npm install
        fi
      - npm run prepare

  # Lint and Test
  lint:
    desc: "Run ESLint"
    cmds:
      - npm run lint

  lint:fix:
    desc: "Run ESLint and fix issues"
    cmds:
      - npm run lint:fix

  test:
    desc: "Run tests"
    cmds:
      - npm test

  test:watch:
    desc: "Run tests in watch mode"
    cmds:
      - npm run test:watch

  test:coverage:
    desc: "Run tests with coverage report"
    cmds:
      - npm run test:coverage

  test:ci:
    desc: "Run CI test suite"
    cmds:
      - npm run test:ci

  # Release
  release:
    desc: "Create a new release using semantic-release"
    env:
      GITHUB_TOKEN: "{{.GITHUB_TOKEN}}"
      GH_TOKEN: "{{.GITHUB_TOKEN}}"
    cmds:
      - |
        if [ -z "$GITHUB_TOKEN" ]; then
          echo "ERROR: GITHUB_TOKEN is required. Set it in your .env file"
          exit 1
        fi
      - npx semantic-release

  release:dry-run:
    desc: "Preview what would be released"
    env:
      GITHUB_TOKEN: "{{.GITHUB_TOKEN}}"
      GH_TOKEN: "{{.GITHUB_TOKEN}}"
    cmds:
      - |
        if [ -z "$GITHUB_TOKEN" ]; then
          echo "ERROR: GITHUB_TOKEN is required. Set it in your .env file"
          exit 1
        fi
      - npx semantic-release --dry-run

  release:manual:
    desc: "Create a manual release (--no-ci)"
    env:
      GITHUB_TOKEN: "{{.GITHUB_TOKEN}}"
      GH_TOKEN: "{{.GITHUB_TOKEN}}"
    cmds:
      - |
        if [ -z "$GITHUB_TOKEN" ]; then
          echo "ERROR: GITHUB_TOKEN is required. Set it in your .env file"
          exit 1
        fi
      - npx semantic-release --no-ci

  # Devcontainer
  devcontainer:build:
    silent: true
    desc: "Build devcontainer from common + specific"
    cmds:
      - git submodule update --init --recursive
      - node .devcontainer-common/build-devcontainer.js

  devcontainer:update:
    silent: true
    desc: "Update devcontainer submodule to latest"
    cmds:
      - git submodule update --remote .devcontainer-common
      - task: devcontainer:build
```

## File: LICENSE

```
Copyright (c) 2011-2026 FutureHax. All Rights Reserved.

This software and all associated files (the "Software") are the proprietary and
confidential property of FutureHax. No license or right to use, copy, modify,
merge, publish, distribute, sublicense, or sell any portion of the Software is
granted, by implication or otherwise, without the prior express written
permission of FutureHax.

Unauthorized copying, distribution, modification, public display, or use of the
Software, via any medium, is strictly prohibited.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```

## File: .github/workflows/ci.yml

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

permissions:
  contents: read

env:
  HUSKY: "0"

jobs:
  validate:
    name: Validate shared tooling configs
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: "24"

      - name: Validate YAML workflow syntax
        run: |
          for f in .github/workflows/*.yml; do
            echo "Checking $f..."
            python3 -c "import yaml; yaml.safe_load(open('$f'))" || exit 1
          done
          echo "All workflows have valid YAML syntax"

      - name: Check key config files are present
        run: |
          for f in eslint/node-base.mjs commitlint/base.ts lint-staged/node-base.js releaserc/node-base.js husky/pre-commit.sh husky/commit-msg.sh; do
            [ -f "$f" ] || { echo "MISSING: $f"; exit 1; }
          done
          echo "All key config files present"
```

## File: .github/workflows/release.yml

```yaml
name: Release

on:
  push:
    branches: [main]

permissions:
  contents: write
  issues: write
  pull-requests: write

env:
  HUSKY: "0"

jobs:
  release:
    name: Semantic Release
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - uses: actions/setup-node@v4
        with:
          node-version: "24"
          cache: npm

      - name: Install dependencies
        run: npm install --ignore-scripts

      - name: Release
        run: npx semantic-release
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

## File: .husky/commit-msg

```
./husky/commit-msg.sh "$1"
```

## File: .husky/pre-commit

```
./husky/pre-commit.sh
```

## File: husky/pre-commit.sh

```bash
#!/bin/bash
[ -n "$CI" ] && exit 0
[ "$HUSKY" = "0" ] && exit 0

cd "$(git rev-parse --show-toplevel)" || exit 1
npx lint-staged

# Verify the project builds whenever source files are staged.
if git diff --cached --name-only | grep -qE '\.(ts|tsx|js|jsx|mjs|cjs|svelte|vue)$'; then
  npm run build
fi
```

## File: release/inject-patrons.js

```javascript
#!/usr/bin/env node
"use strict";

/**
 * inject-patrons.js
 *
 * Fetches the active patron list from the Patreon Creator API and injects a
 * "Thank You, Patrons!" section into every Foundry VTT compendium journal page
 * that contains the FutureHax Patreon link.
 *
 * Run from the module root:
 *   node .shared-tooling/release/inject-patrons.js
 *
 * Required env vars (set in .env or CI secrets):
 *   PATREON_CREATOR_TOKEN  — Creator Access Token from patreon.com/portal
 *   PATREON_CAMPAIGN_ID    — Your campaign ID (e.g. 16174438)
 *
 * The injection is idempotent: subsequent runs replace the block between
 * <!-- PATRONS_START --> and <!-- PATRONS_END --> markers rather than appending.
 */

const fs = require("fs");
const path = require("path");

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const ROOT = process.cwd();

function loadEnv(dir) {
  try {
    const text = fs.readFileSync(path.join(dir, ".env"), "utf8");
    for (const line of text.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq);
      const val = trimmed.slice(eq + 1);
      if (!process.env[key]) process.env[key] = val;
    }
  } catch {
    // no .env — rely on environment
  }
}

loadEnv(ROOT);

const PATREON_TOKEN = process.env.PATREON_CREATOR_TOKEN;
const CAMPAIGN_ID = process.env.PATREON_CAMPAIGN_ID;
const PATREON_BASE = "https://www.patreon.com/api/oauth2/v2";

const PATREON_LINK = "patreon.com/r2plays";
const PATRONS_START = "<!-- PATRONS_START -->";
const PATRONS_END = "<!-- PATRONS_END -->";

// ---------------------------------------------------------------------------
// Patreon API
// ---------------------------------------------------------------------------

async function fetchAllActivePatronNames() {
  if (!PATREON_TOKEN) {
    console.log("PATREON_CREATOR_TOKEN not set — skipping patron injection.");
    process.exit(0);
  }
  if (!CAMPAIGN_ID) {
    console.log("PATREON_CAMPAIGN_ID not set — skipping patron injection.");
    process.exit(0);
  }

  const names = [];
  let cursor = null;
  let page = 0;

  while (true) {
    page++;
    const params = new URLSearchParams({
      "fields[member]": "full_name,patron_status",
      "page[count]": "500",
    });
    if (cursor) params.set("page[cursor]", cursor);

    const url = `${PATREON_BASE}/campaigns/${CAMPAIGN_ID}/members?${params}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${PATREON_TOKEN}` },
    });

    if (!res.ok) {
      throw new Error(`Patreon API error ${res.status}: ${await res.text()}`);
    }

    const json = await res.json();

    for (const member of json.data) {
      const { patron_status, full_name } = member.attributes;
      if (patron_status === "active_patron" && full_name) {
        names.push(full_name.trim());
      }
    }

    cursor = json.meta?.pagination?.cursors?.next;
    if (!cursor) break;
  }

  return names.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
}

// ---------------------------------------------------------------------------
// HTML helpers
// ---------------------------------------------------------------------------

function escapeHtml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function buildPatronBlock(names) {
  const items = names.map((n) => `<li>${escapeHtml(n)}</li>`).join("");
  return `${PATRONS_START}<hr /><h3>Thank You, Patrons!</h3><ul>${items}</ul>${PATRONS_END}`;
}

/**
 * Given a page's text.content, inject or replace the patron block.
 * Returns the updated content string, or null if this page has no injection point.
 */
function injectIntoContent(content, patronBlock) {
  // Case 1: marker block already exists — replace it (idempotent)
  if (content.includes(PATRONS_START)) {
    const startIdx = content.indexOf(PATRONS_START);
    const endIdx = content.indexOf(PATRONS_END, startIdx);
    if (endIdx !== -1) {
      return content.slice(0, startIdx) + patronBlock + content.slice(endIdx + PATRONS_END.length);
    }
  }

  // Case 2: Patreon link present — insert after the </p> that closes it
  const linkIdx = content.indexOf(PATREON_LINK);
  if (linkIdx === -1) return null; // not a credits page we can inject into

  const pCloseIdx = content.indexOf("</p>", linkIdx);
  if (pCloseIdx === -1) return null;

  const insertAt = pCloseIdx + "</p>".length;
  return content.slice(0, insertAt) + patronBlock + content.slice(insertAt);
}

// ---------------------------------------------------------------------------
// File walking
// ---------------------------------------------------------------------------

function walkJsonFiles(dir) {
  const results = [];
  if (!fs.existsSync(dir)) return results;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkJsonFiles(full));
    } else if (entry.isFile() && entry.name.endsWith(".json")) {
      results.push(full);
    }
  }
  return results;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const sourceDir = path.join(ROOT, "foundry_vtt", "packs", "_source");

  if (!fs.existsSync(sourceDir)) {
    console.log("No foundry_vtt/packs/_source directory found — skipping patron injection.");
    process.exit(0);
  }

  console.log("Fetching active patrons from Patreon...");
  const names = await fetchAllActivePatronNames();
  console.log(`  Found ${names.length} active patron(s).`);

  if (names.length === 0) {
    console.warn("  WARNING: Patreon returned 0 active patrons. Skipping injection to avoid accidental wipe.");
    process.exit(0);
  }

  const patronBlock = buildPatronBlock(names);
  const jsonFiles = walkJsonFiles(sourceDir);

  let injectedCount = 0;
  let skippedCount = 0;

  for (const filePath of jsonFiles) {
    let journal;
    try {
      journal = JSON.parse(fs.readFileSync(filePath, "utf8"));
    } catch {
      continue;
    }

    if (!journal.pages || !Array.isArray(journal.pages)) continue;

    let fileModified = false;

    for (const page of journal.pages) {
      if (page.type !== "text" || !page.text?.content) continue;

      const updated = injectIntoContent(page.text.content, patronBlock);

      if (updated === null) {
        skippedCount++;
        continue;
      }

      if (updated !== page.text.content) {
        page.text.content = updated;
        fileModified = true;
        injectedCount++;
        console.log(`  Injected into: ${path.relative(ROOT, filePath)} → page "${page.name}"`);
      } else {
        // Content was already up to date (same patron list)
        injectedCount++;
        console.log(`  Up to date:    ${path.relative(ROOT, filePath)} → page "${page.name}"`);
      }
    }

    if (fileModified) {
      fs.writeFileSync(filePath, JSON.stringify(journal, null, 2) + "\n", "utf8");
    }
  }

  if (injectedCount === 0) {
    console.log("\n  No journal pages with a FutureHax Patreon link found — nothing to inject.");
    console.log("  Add the Patreon link to a credits page or run `module-doctor apply --patreon` to wire it up.");
  } else {
    console.log(`\n✓ Patron list processed for ${injectedCount} page(s).`);
  }
}

main().catch((err) => {
  console.error("\nFATAL:", err.message);
  process.exit(1);
});
```

## File: .releaserc.js

```javascript
const { createReleaseConfig } = require("./releaserc/node-base.js");
module.exports = createReleaseConfig();
```

## File: commitlint.config.ts

```typescript
export { default } from "./commitlint/base.ts";
```

## File: eslint.config.mjs

```javascript
import { createNodeConfig } from "./eslint/node-base.mjs";
export default createNodeConfig();
```

## File: lint-staged.config.js

```javascript
module.exports = require("./lint-staged/node-base.js");
```

## File: Taskfile.yml

```yaml
version: "3"

dotenv: [".env"]

includes:
  shared: ./taskfile/node-base.yml

tasks:
  default:
    desc: "Show available tasks"
    cmds:
      - task --list
```

## File: taskfile/foundry-module.yml

```yaml
version: "3"

tasks:
  # Husky Tasks
  husky:init:
    silent: true
    desc: "Initialize Husky"
    cmds:
      - npx husky init

  husky:commit-msg:
    silent: true
    cmds:
      - ./.shared-tooling/husky/commit-msg.sh

  husky:pre-commit:
    silent: true
    cmds:
      - ./.shared-tooling/husky/pre-commit.sh

  # Dependency Tasks
  dependencies:install:
    silent: true
    desc: "Install Node.js dependencies"
    cmds:
      - |
        if [ -f package-lock.json ]; then
          npm ci
        else
          npm install
        fi
      - npm run prepare

  # Install to Foundry
  install:foundry:
    silent: true
    desc: "Install production module into Foundry (TARGET=f14|f13|f12)"
    cmds:
      - bash ./.shared-tooling/release/install-prod.sh "${TARGET:-f14}"

  install:foundry:dev:
    silent: true
    desc: "Install development module into Foundry (TARGET=f14|f13|f12)"
    cmds:
      - bash ./.shared-tooling/release/install-dev.sh "${TARGET:-f14}"

  install:foundry:both:
    silent: true
    desc: "Install both production and development versions"
    cmds:
      - task: install:foundry
      - task: install:foundry:dev

  # Lint and Test
  lint:
    desc: "Run ESLint"
    cmds:
      - npm run lint

  lint:fix:
    desc: "Run ESLint and fix issues"
    cmds:
      - npm run lint:fix

  test:
    desc: "Run tests"
    cmds:
      - npm test

  test:watch:
    desc: "Run tests in watch mode"
    cmds:
      - npm run test:watch

  test:coverage:
    desc: "Run tests with coverage report"
    cmds:
      - npm run test:coverage

  test:ci:
    desc: "Run CI test suite"
    cmds:
      - npm run test:ci

  # Validation
  validate:module:
    desc: "Validate runtime JavaScript syntax"
    cmds:
      - node -c foundry_vtt/scripts/main.js
      - echo "✓ scripts/main.js syntax valid"

  validate:manifests:
    desc: "Validate module manifests"
    cmds:
      - jq . foundry_vtt/module.json > /dev/null && echo "✓ module.json valid"
      - |
        if [ -f foundry_vtt/module-dev.json ]; then
          jq . foundry_vtt/module-dev.json > /dev/null && echo "✓ module-dev.json valid"
        fi

  validate:all:
    desc: "Run all validation checks"
    cmds:
      - task: validate:module
      - task: validate:manifests

  # Release
  release:
    desc: "Create a new release using semantic-release"
    env:
      GITHUB_TOKEN: "{{.GITHUB_TOKEN}}"
      GH_TOKEN: "{{.GITHUB_TOKEN}}"
    cmds:
      - |
        if [ -z "$GITHUB_TOKEN" ]; then
          echo "ERROR: GITHUB_TOKEN is required. Set it in your .env file"
          exit 1
        fi
      - npx semantic-release

  release:dry-run:
    desc: "Preview what would be released without creating a release"
    env:
      GITHUB_TOKEN: "{{.GITHUB_TOKEN}}"
      GH_TOKEN: "{{.GITHUB_TOKEN}}"
    cmds:
      - |
        if [ -z "$GITHUB_TOKEN" ]; then
          echo "ERROR: GITHUB_TOKEN is required. Set it in your .env file"
          exit 1
        fi
      - npx semantic-release --dry-run

  release:manual:
    desc: "Create a manual release (semantic-release with --no-ci)"
    env:
      GITHUB_TOKEN: "{{.GITHUB_TOKEN}}"
      GH_TOKEN: "{{.GITHUB_TOKEN}}"
      PACKAGE_RELEASE_TOKEN: "{{.PACKAGE_RELEASE_TOKEN}}"
    cmds:
      - |
        if [ -z "$GITHUB_TOKEN" ]; then
          echo "ERROR: GITHUB_TOKEN is required. Set it in your .env file"
          exit 1
        fi
      - npx semantic-release --no-ci

  release:build-module:
    desc: "Build the module ZIP file"
    cmds:
      - node .shared-tooling/release/build-module.js

  inject:patrons:
    desc: "Inject active Patreon patron list into credits journal pages (requires PATREON_CREATOR_TOKEN + PATREON_CAMPAIGN_ID)"
    cmds:
      - node .shared-tooling/release/inject-patrons.js

  pack:check:
    desc: "Verify compiled compendium packs are up to date with packs/_source (fails if _source changed without rebuilding)"
    silent: true
    cmds:
      - |
        if [ ! -d "foundry_vtt/packs/_source" ]; then
          echo "No packs/_source directory — skipping pack freshness check."
          exit 0
        fi
        BRANCH=$(git branch --show-current)
        REMOTE_BRANCH="origin/$BRANCH"
        if ! git rev-parse "$REMOTE_BRANCH" >/dev/null 2>&1; then
          echo "No remote branch found — skipping pack freshness check."
          exit 0
        fi
        CHANGED_SOURCE=$(git diff --name-only "$REMOTE_BRANCH"...HEAD 2>/dev/null | grep 'packs/_source' | wc -l | tr -d ' ')
        CHANGED_PACKS=$(git diff --name-only "$REMOTE_BRANCH"...HEAD 2>/dev/null | grep 'foundry_vtt/packs/' | grep -v '_source' | wc -l | tr -d ' ')
        if [ "$CHANGED_SOURCE" -gt 0 ] && [ "$CHANGED_PACKS" -eq 0 ]; then
          echo "ERROR: packs/_source changed but compiled packs not rebuilt."
          echo "Run: npm run pack"
          exit 1
        fi
        echo "✓ Compendium packs are up to date."

  release:check-status:
    desc: "Check current release status and version"
    cmds:
      - echo "Module version:" && jq -r .version foundry_vtt/module.json
      - echo "Package version:" && jq -r .version package.json
      - echo "Latest tag:" && git describe --tags --abbrev=0 2>/dev/null || echo "No tags"
      - echo "Commits since tag:" && git log $(git describe --tags --abbrev=0 2>/dev/null)..HEAD --oneline 2>/dev/null | wc -l || echo "N/A"

  # Dev build
  dev:build:
    desc: "Build development module ZIP"
    cmds:
      - |
        TEMP_DIR=$(mktemp -d)
        trap "rm -rf $TEMP_DIR" EXIT
        cp -r foundry_vtt/* "$TEMP_DIR/"
        if [ -f "$TEMP_DIR/module-dev.json" ]; then
          cp "$TEMP_DIR/module-dev.json" "$TEMP_DIR/module.json"
          rm -f "$TEMP_DIR/module-dev.json"
        fi
        MODULE_ID=$(jq -r '.id' "$TEMP_DIR/module.json")
        cd "$TEMP_DIR" && zip -r "$OLDPWD/${MODULE_ID}.zip" .
        echo "✓ Created ${MODULE_ID}.zip"

  # Spec validation
  spec:check:
    desc: "Verify docs/SPEC.md exists and has canonical sections"
    silent: true
    cmds:
      - |
        if [ ! -f docs/SPEC.md ]; then
          echo "ERROR: docs/SPEC.md is missing"
          exit 1
        fi
        if [ ! -s docs/SPEC.md ]; then
          echo "ERROR: docs/SPEC.md is empty"
          exit 1
        fi
      - |
        REQUIRED_SECTIONS=(
          "## 1. Overview & user value"
          "## 2. Core features"
          "## 3. Data model"
          "## 4. Settings & configuration"
          "## 5. Hooks & API"
          "## 6. UI & UX"
          "## 7. Compatibility"
          "## 8. Performance & limits"
          "## 9. Future / out-of-scope"
          "## 10. Change log"
        )
        MISSING=0
        for section in "${REQUIRED_SECTIONS[@]}"; do
          if ! grep -qF "$section" docs/SPEC.md; then
            echo "MISSING: $section"
            MISSING=$((MISSING + 1))
          fi
        done
        if [ "$MISSING" -gt 0 ]; then
          echo "ERROR: $MISSING required section(s) missing from docs/SPEC.md"
          exit 1
        fi
        echo "✓ docs/SPEC.md has all 10 required sections"

  # Devcontainer
  devcontainer:build:
    silent: true
    desc: "Build devcontainer from common + specific"
    cmds:
      - git submodule update --init --recursive
      - node .devcontainer-common/build-devcontainer.js

  devcontainer:update:
    silent: true
    desc: "Update devcontainer submodule to latest"
    cmds:
      - git submodule update --remote .devcontainer-common
      - task: devcontainer:build
```

## File: README.md

````markdown
# futurehax-shared-tooling

[![CI](https://github.com/FutureHax/futurehax-shared-tooling/actions/workflows/ci.yml/badge.svg)](https://github.com/FutureHax/futurehax-shared-tooling/actions/workflows/ci.yml) [![Release](https://github.com/FutureHax/futurehax-shared-tooling/actions/workflows/release.yml/badge.svg)](https://github.com/FutureHax/futurehax-shared-tooling/actions/workflows/release.yml) [![Latest Release](https://img.shields.io/github/v/release/FutureHax/futurehax-shared-tooling?sort=semver)](https://github.com/FutureHax/futurehax-shared-tooling/releases) ![License: All Rights Reserved](https://img.shields.io/badge/license-All%20Rights%20Reserved-red)

Shared development tooling for all FutureHax projects. Added as a git submodule at `.shared-tooling/` in each consuming project.

## Quick Start

Add to an existing project:

```bash
git submodule add https://github.com/FutureHax/futurehax-shared-tooling.git .shared-tooling
```

Or use the automated migration script:

```bash
.shared-tooling/scripts/migrate-project.sh /path/to/project foundry-module
```

## What's Included

| Directory      | Purpose                                                                                  |
| -------------- | ---------------------------------------------------------------------------------------- |
| `eslint/`      | ESLint flat configs (Foundry module, extended, Node base, TypeScript)                    |
| `commitlint/`  | Commitlint presets (Foundry module with `tweak` type, generic base)                      |
| `prettier/`    | Prettier config (`printWidth: 120`)                                                      |
| `lint-staged/` | lint-staged configs (full with gitleaks, minimal, Node base)                             |
| `husky/`       | Pre-commit and commit-msg hook scripts with CI skip                                      |
| `taskfile/`    | Taskfile.yml includes for common tasks                                                   |
| `release/`     | Build scripts, Foundry semantic-release plugin, install scripts, Patreon patron injector |
| `releaserc/`   | semantic-release config factories                                                        |
| `rules/`       | Baseline Cursor rules per project type (e.g. `next-app/`)                                |
| `skills/`      | Baseline agent skills per project type (e.g. `next-app/`)                                |
| `scripts/`     | Migration and setup utilities                                                            |

## Project Types

### `foundry-module` (default)

Standard Foundry VTT module with base globals (`game`, `ui`, `Hooks`, `Actor`, `Item`, etc.).

### `foundry-module-extended`

Adds legacy Application framework globals (`Dialog`, `Application`, `FormApplication`, `renderTemplate`).

### `foundry-content`

Extended globals + REFERENCE directory ignores for content/adventure modules.

### `node-base`

Generic Node.js project without Foundry globals.

### `next-app`

FutureHax Next.js web app (Chakra UI + Prisma + Helm/Flux), scaffolded from
[`nextjs-webapp-template`](https://github.com/FutureHax/nextjs-webapp-template)
and audited by [`futurehax-next-doctor`](https://github.com/FutureHax/futurehax-next-doctor).
Provides:

- `eslint/next-app.mjs` — `createNextConfig()` (wraps `eslint-config-next` + Prettier)
- `releaserc/next-app.js` — `createReleaseConfig({ chartPath })` (optional Helm versioning)
- `taskfile/next-app.yml` — dev/build/lint/type-check/test/db/release tasks
- `rules/next-app/next-app-spec.mdc` — baseline Cursor rule
- `skills/next-app/writing-nextjs-app-spec/` — baseline agent skill

Consumer examples:

```javascript
// eslint.config.mjs
import { createNextConfig } from "./.shared-tooling/eslint/next-app.mjs";
export default createNextConfig();
```

```javascript
// release.config.cjs
const { createReleaseConfig } = require("./.shared-tooling/releaserc/next-app.js");
module.exports = createReleaseConfig({ chartPath: "chart/my-app" });
```

```typescript
// commitlint.config.ts
export { default } from "./.shared-tooling/commitlint/base.ts";
```

Copy the baseline rule and skill into the app's `.cursor/`:

```bash
mkdir -p .cursor/rules .cursor/skills
cp .shared-tooling/rules/next-app/next-app-spec.mdc .cursor/rules/
cp -r .shared-tooling/skills/next-app/writing-nextjs-app-spec .cursor/skills/
```

## Consumer Config Examples

### eslint.config.mjs

```javascript
import { createFoundryConfig } from "./.shared-tooling/eslint/foundry-module.mjs";
export default createFoundryConfig({
  extraGlobals: { ActorSheet: "readonly" },
  ignores: ["REFERENCE/**"],
});
```

### commitlint.config.ts

```typescript
export { default } from "./.shared-tooling/commitlint/foundry-module.ts";
```

### lint-staged.config.js

```javascript
module.exports = require("./.shared-tooling/lint-staged/full.js");
```

### .releaserc.js

```javascript
const { createReleaseConfig } = require("./.shared-tooling/releaserc/foundry-module.js");
module.exports = createReleaseConfig();
```

### Taskfile.yml

```yaml
version: "3"
dotenv: [".env"]
includes:
  shared: .shared-tooling/taskfile/foundry-module.yml
vars:
  MODULE_ID: my-module
tasks:
  default:
    cmds: [task --list]
```

### .husky/pre-commit

```sh
./.shared-tooling/husky/pre-commit.sh
```

### package.json

```json
{
  "prettier": "./.shared-tooling/prettier/base.json"
}
```

## Patreon Patron Injection (Foundry modules)

`release/inject-patrons.js` fetches the active patron list from the Patreon Creator API and injects a "Thank You, Patrons!" section into any compendium journal page that contains the FutureHax Patreon link.

### Required env vars

| Variable                | Source                                                                                             | Description                           |
| ----------------------- | -------------------------------------------------------------------------------------------------- | ------------------------------------- |
| `PATREON_CREATOR_TOKEN` | [patreon.com/portal](https://www.patreon.com/portal) → Clients & API Keys → Creator's Access Token | Long-lived token for your campaign    |
| `PATREON_CAMPAIGN_ID`   | Same portal page, or from `futurehax-patreon/.env`                                                 | Numeric campaign ID (e.g. `16174438`) |

These should be set in each module's `.env` (for local development) and as GitHub Actions secrets for CI.

### How modules use it

```json
// package.json
{
  "scripts": {
    "inject-patrons": "node .shared-tooling/release/inject-patrons.js",
    "pack": "npm run inject-patrons && node tasks/pack-compendiums.js"
  }
}
```

Or via Taskfile:

```bash
task inject:patrons
```

### Injection marker

The script looks for `<!-- PATRONS_START -->...<!-- PATRONS_END -->` in journal page HTML and replaces it on each run (idempotent). If no marker is found but the Patreon link paragraph is present, the marker is inserted automatically after the `</p>`. Use `module-doctor apply --yes` to add both the link and marker to a module that is missing them.

### Zero active patrons safety

If the API returns 0 active patrons (possible API hiccup), the script exits 0 with a warning and does **not** overwrite the existing list.

## Updating

To update all projects to the latest shared tooling:

```bash
cd /path/to/project
git submodule update --remote .shared-tooling
git add .shared-tooling
git commit -m "chore(deps): update shared-tooling"
```

## Development

Changes to this repo automatically propagate when consumers run `git submodule update --remote`.
Tag releases for stability if needed.

## License

Copyright (c) 2011-2026 FutureHax. All Rights Reserved.

This is proprietary software. See [LICENSE](LICENSE) for full terms. No part of this project may be used, copied, modified, or distributed without the prior written permission of FutureHax.
````

## File: package.json

```json
{
  "name": "@futurehax/shared-tooling",
  "version": "1.0.0",
  "description": "Shared development tooling for FutureHax projects",
  "private": true,
  "license": "UNLICENSED",
  "engines": {
    "node": ">=24"
  },
  "peerDependencies": {
    "@commitlint/cli": ">=20",
    "@commitlint/config-conventional": ">=20",
    "eslint": ">=10",
    "globals": ">=17",
    "husky": ">=9",
    "lint-staged": ">=16",
    "prettier": ">=3",
    "semantic-release": ">=25"
  },
  "peerDependenciesMeta": {
    "typescript-eslint": {
      "optional": true
    },
    "lockfile-lint": {
      "optional": true
    }
  },
  "scripts": {
    "prepare": "husky"
  },
  "devDependencies": {
    "husky": ">=9"
  },
  "prettier": "./prettier/base.json"
}
```
