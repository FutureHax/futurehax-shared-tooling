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
  const prettierConfig = await import("eslint-config-prettier").then(
    (m) => m.default,
  );

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
        "@typescript-eslint/no-unused-vars": [
          "error",
          { argsIgnorePattern: "^_" },
        ],
        "@typescript-eslint/no-explicit-any": "warn",
        ...rules,
      },
    },
    prettierConfig,
  );
}

export default await createNextConfig();
