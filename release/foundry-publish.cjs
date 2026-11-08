#!/usr/bin/env node
"use strict";

// Re-publish the version in foundry_vtt/module.json to the Foundry Package Release API with the
// same payload the release plugin sends. Safe to repeat: a version Foundry already has counts as
// success. Usage (from a checkout of the release tag, with the CDN env the release used):
//   PACKAGE_RELEASE_TOKEN=... GCS_BUCKET_NAME=... CDN_DOMAIN=... node .shared-tooling/release/foundry-publish.cjs [--dry-run]

const fs = require("fs");
const path = require("path");
const { foundryReleasePayload } = require("./foundry-module-plugin.cjs");
const {
  assertFoundryToken,
  foundryApiEnabled,
  publishFoundryRelease,
  releaseToken,
} = require("./foundry-release-api.cjs");

async function main(argv) {
  const dryRun = argv.includes("--dry-run");
  if (!foundryApiEnabled()) {
    console.log("SKIP_FOUNDRY_API=true, nothing to publish");
    return 0;
  }
  assertFoundryToken();

  const moduleJson = JSON.parse(fs.readFileSync(path.join(process.cwd(), "foundry_vtt", "module.json"), "utf8"));
  const { payload } = await foundryReleasePayload({}, moduleJson.version, { dryRun });
  const { outcome } = await publishFoundryRelease({ token: releaseToken(), payload });
  console.log(`Foundry ${payload.id} v${moduleJson.version}: ${outcome}`);
  return 0;
}

main(process.argv.slice(2)).then(
  (code) => process.exit(code),
  (error) => {
    console.error(`${error.code ? `${error.code} ` : ""}${error.message}`);
    if (error.details) console.error(error.details);
    process.exit(1);
  },
);
