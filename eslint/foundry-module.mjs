import { createRequire } from "node:module";
import globals from "globals";
import { coreGlobals, documentGlobals, utilityGlobals } from "./globals.mjs";

const baseFoundryGlobals = {
  ...coreGlobals,
  ...documentGlobals,
  DialogV2: "readonly",
  ApplicationV2: "readonly",
  ...utilityGlobals,
};

export const FOUNDRY_JS_FILES = ["**/*.js", "**/*.mjs", "**/*.cjs"];
export const FOUNDRY_TS_FILES = ["**/*.ts", "**/*.mts", "**/*.cts", "**/*.tsx"];

const DEFAULT_IGNORES = [
  "node_modules/**",
  "dist/**",
  "coverage/**",
  ".devcontainer/**",
  ".devcontainer-common/**",
  ".shared-tooling/**",
];

/**
 * Load typescript-eslint (unified) or the split parser/plugin packages.
 * Resolution walks from this file up to the consuming app's node_modules.
 *
 * @returns {{ parser: object, plugin?: object } | null}
 */
function loadTypeScriptSupport() {
  const require = createRequire(import.meta.url);
  try {
    const tsEslint = require("typescript-eslint");
    return { parser: tsEslint.parser, plugin: tsEslint.plugin };
  } catch {
    try {
      return {
        parser: require("@typescript-eslint/parser"),
        plugin: require("@typescript-eslint/eslint-plugin"),
      };
    } catch {
      return null;
    }
  }
}

/**
 * Create an ESLint flat config for a Foundry VTT module.
 *
 * ESLint 10 only applies configs without `files` to `.js`/`.mjs`/`.cjs`.
 * TypeScript sources must be listed explicitly. When `@typescript-eslint/parser`
 * (or `typescript-eslint`) is installed, a second block lints those files.
 *
 * @param {object} [options]
 * @param {Record<string, string>} [options.extraGlobals] - Additional globals beyond the base set
 * @param {string[]} [options.ignores] - Additional ignore patterns
 * @param {Record<string, any>} [options.rules] - Rule overrides
 * @param {string[]} [options.files] - Override JS/CJS/MJS globs
 * @param {string[]} [options.tsFiles] - Override TypeScript globs
 * @param {boolean} [options.typescript=true] - When false, skip the TypeScript block
 * @param {object} [options.tsParser] - Inject a parser (tests / custom setups)
 * @param {object} [options.tsPlugin] - Inject @typescript-eslint plugin
 * @returns {import('eslint').Linter.Config[]}
 */
export function createFoundryConfig(options = {}) {
  const {
    extraGlobals = {},
    ignores = [],
    rules = {},
    files = FOUNDRY_JS_FILES,
    tsFiles = FOUNDRY_TS_FILES,
    typescript = true,
    tsParser,
    tsPlugin,
  } = options;

  const ignoreList = [...DEFAULT_IGNORES, ...ignores];

  const languageOptions = {
    ecmaVersion: 2022,
    sourceType: "module",
    globals: {
      ...globals.browser,
      ...globals.node,
      ...baseFoundryGlobals,
      ...extraGlobals,
    },
  };

  const baseRules = {
    "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    "no-console": "off",
    "prefer-const": "warn",
    "no-var": "error",
    eqeqeq: ["error", "always"],
    ...rules,
  };

  const configs = [
    {
      files,
      languageOptions,
      rules: baseRules,
      ignores: ignoreList,
    },
  ];

  if (typescript === false) {
    return configs;
  }

  const tsSupport = tsParser || tsPlugin ? { parser: tsParser, plugin: tsPlugin } : loadTypeScriptSupport();

  if (!tsSupport?.parser) {
    return configs;
  }

  configs.push({
    files: tsFiles,
    languageOptions: {
      ...languageOptions,
      parser: tsSupport.parser,
    },
    plugins: tsSupport.plugin ? { "@typescript-eslint": tsSupport.plugin } : {},
    rules: {
      ...baseRules,
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    },
    ignores: ignoreList,
  });

  return configs;
}

export default createFoundryConfig();
