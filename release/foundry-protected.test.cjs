"use strict";

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const {
  applyCatalogUrls,
  buildProtectedManifest,
  foundryHubManifestUrl,
  foundryReleaseManifestUrl,
  isFoundryProtected,
} = require("./foundry-protected.cjs");

const base = { id: "death-ledger", title: "Death Ledger", version: "1.0.0" };

describe("isFoundryProtected", () => {
  it("is true only when FOUNDRY_PROTECTED=true and Foundry API is not skipped", () => {
    assert.equal(isFoundryProtected({ FOUNDRY_PROTECTED: "true" }), true);
    assert.equal(isFoundryProtected({ FOUNDRY_PROTECTED: "true", SKIP_FOUNDRY_API: "true" }), false);
    assert.equal(isFoundryProtected({}), false);
  });
});

describe("buildProtectedManifest", () => {
  it("sets the R2 manifest, protected true, and omits download", () => {
    const catalog = applyCatalogUrls(base, {
      packageId: "boss-effect-reminder",
      version: "1.1.1",
      manifestBaseUrl: "https://cms.futurehax.com/api/v1/manifest",
    }).urls;
    const hub = buildProtectedManifest(catalog, "boss-effect-reminder");
    assert.equal(hub.protected, true);
    assert.equal(hub.manifest, foundryHubManifestUrl("boss-effect-reminder"));
    assert.equal(Object.hasOwn(hub, "download"), false);
  });
});

describe("foundryReleaseManifestUrl", () => {
  it("uses R2 for protected Hub releases", () => {
    assert.equal(
      foundryReleaseManifestUrl({
        protectedHub: true,
        packageId: "death-ledger",
        catalogManifestUrl: "https://example.com/latest/module.json",
      }),
      foundryHubManifestUrl("death-ledger"),
    );
  });
});
