const { createReleaseConfig } = require("./releaserc/node-base.js");

// Presets target consuming repos (./.shared-tooling/...). This repo IS
// shared-tooling, so remap those plugin paths to the local tree.
const config = createReleaseConfig();
config.plugins = config.plugins.map((entry) => {
  if (!Array.isArray(entry)) return entry;
  const [name, options] = entry;
  if (typeof name === "string" && name.startsWith("./.shared-tooling/")) {
    return [name.replace("./.shared-tooling/", "./"), options];
  }
  return entry;
});

module.exports = config;
