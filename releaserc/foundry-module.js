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
      ["./.shared-tooling/release/foundryvtt-changelog-summary-plugin.cjs", {}],
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
