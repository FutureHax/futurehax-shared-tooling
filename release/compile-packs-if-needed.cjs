const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const { validateCompiledPacks } = require("./validate-compiled-packs.cjs");

/**
 * Compile compendium packs from _source when present, then validate LevelDB output.
 *
 * @param {object} [options]
 * @param {string} [options.projectRoot]
 * @param {(msg: string) => void} [options.log]
 * @param {(msg: string) => void} [options.error]
 * @returns {{ compiled: boolean; validated: boolean }}
 */
function compilePacksIfNeeded(options = {}) {
  const projectRoot = options.projectRoot ?? process.cwd();
  const log = options.log ?? console.log;
  const error = options.error ?? console.error;

  const sourceDir = path.join(projectRoot, "foundry_vtt", "packs", "_source");
  if (!fs.existsSync(sourceDir)) {
    log("No packs/_source directory — skipping compendium compile.");
    return { compiled: false, validated: false };
  }

  const packageJsonPath = path.join(projectRoot, "package.json");
  if (!fs.existsSync(packageJsonPath)) {
    log("No package.json — skipping compendium compile.");
    return { compiled: false, validated: false };
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
  if (!packageJson.scripts?.pack) {
    log("No npm run pack script — skipping compendium compile.");
    return { compiled: false, validated: false };
  }

  log("Compiling compendium packs from _source...");
  execSync("npm run pack", { cwd: projectRoot, stdio: "inherit" });

  const moduleJsonPath = path.join(projectRoot, "foundry_vtt", "module.json");
  const moduleJson = JSON.parse(fs.readFileSync(moduleJsonPath, "utf8"));
  const result = validateCompiledPacks(projectRoot, moduleJson);

  if (!result.ok) {
    error("Compiled compendium pack validation failed:");
    for (const failure of result.failures) {
      error(`  - ${failure}`);
    }
    throw new Error(`Compendium pack validation failed (${result.failures.length} pack(s) missing or empty)`);
  }

  log(`✓ All ${(moduleJson.packs ?? []).length} declared compendium pack(s) validated.`);
  return { compiled: true, validated: true };
}

module.exports = { compilePacksIfNeeded, validateCompiledPacks };
