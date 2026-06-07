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
