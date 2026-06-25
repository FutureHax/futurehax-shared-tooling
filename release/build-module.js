#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const archiver = require("archiver");
const { compilePacksIfNeeded } = require("./compile-packs-if-needed.cjs");

const ZIP_IGNORE = [
  "node_modules/**",
  ".git/**",
  ".gitignore",
  "module-dev.json",
  "__tests__/**",
  "**/__tests__/**",
  "**/__mocks__/**",
  "**/*.test.js",
  "**/*.test.mjs",
  "**/*.test.ts",
  "packs/_source/**",
  "packs/_backup_*/**",
];

async function buildModule() {
  const projectRoot = process.cwd();
  const modulePath = path.join(projectRoot, "foundry_vtt", "module.json");
  const moduleJson = JSON.parse(fs.readFileSync(modulePath, "utf8"));
  const moduleId = moduleJson.id;
  const version = moduleJson.version;

  console.log(`Building module: ${moduleId} v${version}`);

  compilePacksIfNeeded({ projectRoot });

  const distDir = path.join(projectRoot, "dist");
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }

  const outputPath = path.join(distDir, "module.zip");
  const output = fs.createWriteStream(outputPath);
  const archive = archiver("zip", { zlib: { level: 9 } });

  return new Promise((resolve, reject) => {
    output.on("close", () => {
      console.log(`✓ Created ${outputPath} (${archive.pointer()} bytes)`);
      resolve();
    });

    archive.on("error", reject);
    archive.pipe(output);

    archive.glob("**/*", {
      cwd: path.join(projectRoot, "foundry_vtt"),
      ignore: ZIP_IGNORE,
    });

    archive.finalize();
  });
}

buildModule().catch((err) => {
  console.error("Error building module:", err);
  process.exit(1);
});
