const fs = require("fs");
const path = require("path");

/**
 * classic-level may keep small packs in the WAL only (CURRENT + MANIFEST, no SST .ldb yet).
 * Foundry still loads those directories.
 *
 * @param {string} packDir
 * @param {string[]} entries
 * @returns {boolean}
 */
function isCompiledLevelDb(packDir, entries) {
  const hasCurrent = entries.includes("CURRENT");
  const hasManifest = entries.some((name) => name.startsWith("MANIFEST-"));
  if (hasCurrent && hasManifest) return true;

  return entries.some((name) => {
    if (!name.endsWith(".ldb")) return false;
    try {
      return fs.statSync(path.join(packDir, name)).size > 0;
    } catch {
      return false;
    }
  });
}

/**
 * @param {string} projectRoot
 * @param {object} moduleJson
 * @returns {{ ok: boolean; failures: string[] }}
 */
function validateCompiledPacks(projectRoot, moduleJson) {
  const failures = [];
  const foundryRoot = path.join(projectRoot, "foundry_vtt");
  const packs = moduleJson.packs ?? [];

  for (const pack of packs) {
    if (!pack.path) continue;

    const packDir = path.join(foundryRoot, pack.path);
    const label = pack.name || pack.path;

    if (!fs.existsSync(packDir)) {
      failures.push(`${label}: pack directory missing (${pack.path})`);
      continue;
    }

    const entries = fs.readdirSync(packDir);
    if (!isCompiledLevelDb(packDir, entries)) {
      failures.push(
        `${label}: not a compiled LevelDB pack in ${pack.path} (need CURRENT + MANIFEST-* or a non-empty .ldb)`,
      );
    }
  }

  return { ok: failures.length === 0, failures };
}

module.exports = { validateCompiledPacks };
