const fs = require("fs");
const path = require("path");

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
    const ldbFiles = entries.filter((name) => name.endsWith(".ldb"));
    const nonEmptyLdb = ldbFiles.filter((name) => {
      try {
        return fs.statSync(path.join(packDir, name)).size > 0;
      } catch {
        return false;
      }
    });

    if (nonEmptyLdb.length === 0) {
      failures.push(`${label}: no non-empty .ldb table files in ${pack.path} (found ${ldbFiles.length} .ldb file(s))`);
    }
  }

  return { ok: failures.length === 0, failures };
}

module.exports = { validateCompiledPacks };
