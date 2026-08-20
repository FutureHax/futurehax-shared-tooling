"use strict";

const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { validateCompiledPacks } = require("./validate-compiled-packs.cjs");

describe("validateCompiledPacks", () => {
  let root;

  before(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), "validate-packs-"));
  });

  after(() => {
    fs.rmSync(root, { recursive: true, force: true });
  });

  it("accepts a small classic-level pack that has CURRENT and MANIFEST but no .ldb SST yet", () => {
    const packDir = path.join(root, "foundry_vtt", "packs", "actors");
    fs.mkdirSync(packDir, { recursive: true });
    fs.writeFileSync(path.join(packDir, "CURRENT"), "MANIFEST-000002\n");
    fs.writeFileSync(path.join(packDir, "MANIFEST-000002"), "small-db");
    fs.writeFileSync(path.join(packDir, "LOG"), "wal");
    fs.writeFileSync(path.join(packDir, "000003.log"), "");

    const result = validateCompiledPacks(root, {
      packs: [{ name: "actors", path: "packs/actors" }],
    });
    assert.equal(result.ok, true, result.failures.join("; "));
  });

  it("rejects an empty pack directory", () => {
    const packDir = path.join(root, "foundry_vtt", "packs", "items");
    fs.mkdirSync(packDir, { recursive: true });

    const result = validateCompiledPacks(root, {
      packs: [{ name: "items", path: "packs/items" }],
    });
    assert.equal(result.ok, false);
    assert.match(result.failures[0], /items:/);
  });
});
