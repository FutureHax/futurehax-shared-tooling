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
