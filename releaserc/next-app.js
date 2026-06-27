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
    // Bump package.json version (without publishing to npm) so the app's
    // runtime version (read from package.json) matches the released tag.
    ["@semantic-release/npm", { npmPublish: false }],
  ];

  if (chartPath) {
    plugins.push([
      "semantic-release-helm3",
      { chartPath, onlyUpdateVersion: true },
    ]);
  }

  // Extra plugins (e.g. @semantic-release/exec for custom publish scripts).
  for (const p of extraPlugins) {
    plugins.push(p);
  }

  plugins.push(
    "@semantic-release/github",
    [
      "@semantic-release/git",
      {
        assets: [
          "package.json",
          "package-lock.json",
          "CHANGELOG.md",
          ...(chartPath ? [`${chartPath}/Chart.yaml`] : []),
          ...extraAssets,
        ],
        message:
          "chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}",
      },
    ],
  );

  return { branches: [branch], plugins };
}

module.exports = { createReleaseConfig };
