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
      ["./.shared-tooling/release/changelog-summary-plugin.cjs", {}],
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
