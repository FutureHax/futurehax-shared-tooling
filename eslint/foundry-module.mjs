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
