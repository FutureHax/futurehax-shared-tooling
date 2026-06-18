const fs = require("fs");
const path = require("path");
const archiver = require("archiver");
const { execSync } = require("child_process");
const { promisify } = require("util");
const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);

async function prepare(pluginConfig, context) {
  const { nextRelease, logger } = context;
  const { version } = nextRelease;

  const githubUrl = pluginConfig.githubUrl || "https://github.com";
  const repositoryPath = pluginConfig.repositoryPath || process.env.GITHUB_REPOSITORY;

  const modulePath = path.join(process.cwd(), "foundry_vtt", "module.json");
  const moduleContent = await readFile(modulePath, "utf8");
  const moduleJson = JSON.parse(moduleContent);

  moduleJson.version = version;

  const gcsBucket = process.env.GCS_BUCKET_NAME;
  const customDomain = process.env.CDN_DOMAIN || "downloads.r2plays.games";
  const packageId = pluginConfig.packageId || moduleJson.id;

  if (gcsBucket && customDomain) {
    moduleJson.manifest = `https://${customDomain}/futurehax/${packageId}/latest/module.json`;
    moduleJson.download = `https://${customDomain}/futurehax/${packageId}/v${version}/module.zip`;
    moduleJson.changelog = `https://${customDomain}/futurehax/${packageId}/CHANGELOG.md`;
    logger.log(`Using CDN URLs with domain: ${customDomain}`);
  } else if (gcsBucket) {
    moduleJson.manifest = `https://storage.googleapis.com/${gcsBucket}/futurehax/${packageId}/latest/module.json`;
    moduleJson.download = `https://storage.googleapis.com/${gcsBucket}/futurehax/${packageId}/v${version}/module.zip`;
    moduleJson.changelog = `https://storage.googleapis.com/${gcsBucket}/futurehax/${packageId}/CHANGELOG.md`;
    logger.log(`Using direct GCS URLs with bucket: ${gcsBucket}`);
  } else {
    moduleJson.manifest = `${githubUrl}/${repositoryPath}/releases/latest/download/module.json`;
    moduleJson.download = `${githubUrl}/${repositoryPath}/releases/download/v${version}/module.zip`;
    logger.log(`Using GitHub release URLs (CDN not configured)`);
  }

  await writeFile(modulePath, JSON.stringify(moduleJson, null, 2) + "\n");
  logger.log(`Updated module.json to version ${version}`);
  logger.log(`Set manifest URL: ${moduleJson.manifest}`);
  logger.log(`Set download URL: ${moduleJson.download}`);
  if (moduleJson.changelog) {
    logger.log(`Set changelog URL: ${moduleJson.changelog}`);
  }

  await writeFile(path.join(process.cwd(), "module.json"), JSON.stringify(moduleJson, null, 2) + "\n");
  logger.log(`Copied updated module.json to root for GitHub release upload`);

  await createModuleZip(version, logger);
}

async function createModuleZip(version, logger) {
  const modulePath = path.join(process.cwd(), "foundry_vtt", "module.json");
  const moduleContent = await readFile(modulePath, "utf8");
  const moduleJson = JSON.parse(moduleContent);

  if (moduleJson.version !== version) {
    logger.warn(`Warning: module.json version (${moduleJson.version}) doesn't match expected version (${version})`);
    moduleJson.version = version;
  }

  logger.log(`Creating module.zip with version ${version}`);

  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(path.join(process.cwd(), "module.zip"));
    const archive = archiver("zip", { zlib: { level: 9 } });

    output.on("close", () => {
      logger.log(`Created module.zip (${archive.pointer()} bytes)`);
      resolve();
    });

    archive.on("error", reject);
    archive.pipe(output);

    archive.glob("**/*", {
      cwd: path.join(process.cwd(), "foundry_vtt"),
      ignore: [
        "node_modules/**",
        ".git/**",
        ".gitignore",
        "module.json",
        "module-dev.json",
        "__tests__/**",
        "*.test.js",
      ],
    });

    archive.append(JSON.stringify(moduleJson, null, 2) + "\n", {
      name: "module.json",
    });

    archive.finalize();
  });
}

async function publish(pluginConfig, context) {
  const { nextRelease, logger } = context;
  const { version } = nextRelease;

  const foundryToken = process.env.PACKAGE_RELEASE_TOKEN;

  const githubUrl = pluginConfig.githubUrl || "https://github.com";
  const repositoryPath = pluginConfig.repositoryPath || process.env.GITHUB_REPOSITORY;
  const modulePath = path.join(process.cwd(), "foundry_vtt", "module.json");
  const moduleContent = await readFile(modulePath, "utf8");
  const moduleJson = JSON.parse(moduleContent);
  const packageId = pluginConfig.packageId || moduleJson.id;
  const dryRun = pluginConfig.dryRun || false;

  const gcsBucket = process.env.GCS_BUCKET_NAME;
  const customDomain = process.env.CDN_DOMAIN;

  let manifestUrl;
  if (gcsBucket && customDomain) {
    manifestUrl = `https://${customDomain}/futurehax/${packageId}/latest/module.json`;
  } else if (gcsBucket) {
    manifestUrl = `https://storage.googleapis.com/${gcsBucket}/futurehax/${packageId}/latest/module.json`;
  } else {
    manifestUrl = `${githubUrl}/${repositoryPath}/releases/latest/download/module.json`;
  }

  if (foundryToken) {
    const releaseData = {
      id: packageId,
      "dry-run": dryRun,
      release: {
        version: version,
        manifest: manifestUrl,
        notes: `${githubUrl}/${repositoryPath}/releases/tag/v${version}`,
        compatibility: moduleJson.compatibility || {
          minimum: "12",
          verified: "12",
          maximum: "",
        },
      },
    };

    logger.log(`Updating Foundry VTT package listing for ${packageId} v${version}...`);

    try {
      const response = await fetch("https://api.foundryvtt.com/_api/packages/release_version/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: foundryToken,
        },
        body: JSON.stringify(releaseData),
      });

      let responseData;
      const responseText = await response.text();

      try {
        responseData = JSON.parse(responseText);
      } catch (_e) {
        responseData = { error: responseText };
      }

      if (response.ok) {
        if (dryRun) {
          logger.log(`✓ Foundry API dry run successful: ${responseData.message || "Success"}`);
        } else {
          logger.log(`✓ Successfully updated Foundry VTT package listing!`);
          if (responseData.page) {
            logger.log(`  Package page: ${responseData.page}`);
          }
        }
      } else {
        logger.error(`Failed to update Foundry VTT package listing: ${response.status} ${response.statusText}`);
        if (typeof responseData === "object") {
          logger.error(`Response: ${JSON.stringify(responseData, null, 2)}`);
        } else {
          logger.error(`Response: ${responseText}`);
        }

        if (response.status === 429) {
          const retryAfter = response.headers.get("Retry-After");
          logger.warn(`Rate limited. Retry after ${retryAfter} seconds`);
        }
      }
    } catch (error) {
      logger.error("Error calling Foundry VTT API:", error.message);
    }
  } else {
    logger.log("PACKAGE_RELEASE_TOKEN not set, skipping Foundry VTT package update");
  }

  if (gcsBucket) {
    logger.log(`Uploading artifacts to GCS CDN...`);

    try {
      const moduleZipPath = path.join(process.cwd(), "module.zip");
      const moduleJsonPath = path.join(process.cwd(), "module.json");

      if (!fs.existsSync(moduleZipPath)) {
        logger.warn("module.zip not found, skipping GCS upload");
        return;
      }

      execSync(`gsutil -q cp ${moduleZipPath} gs://${gcsBucket}/futurehax/${packageId}/v${version}/`, {
        stdio: "inherit",
      });
      execSync(`gsutil -q cp ${moduleJsonPath} gs://${gcsBucket}/futurehax/${packageId}/v${version}/`, {
        stdio: "inherit",
      });
      execSync(
        `gsutil -m setmeta -h "Cache-Control:public, max-age=31536000, immutable" "gs://${gcsBucket}/futurehax/${packageId}/v${version}/**"`,
        { stdio: "inherit" },
      );

      execSync(`gsutil -q cp ${moduleZipPath} gs://${gcsBucket}/futurehax/${packageId}/latest/`, { stdio: "inherit" });
      execSync(`gsutil -q cp ${moduleJsonPath} gs://${gcsBucket}/futurehax/${packageId}/latest/`, { stdio: "inherit" });
      execSync(
        `gsutil -m setmeta -h "Cache-Control:no-cache, no-store, must-revalidate" "gs://${gcsBucket}/futurehax/${packageId}/latest/**"`,
        { stdio: "inherit" },
      );

      const changelogPath = path.join(process.cwd(), "CHANGELOG.md");
      if (fs.existsSync(changelogPath)) {
        execSync(`gsutil -q cp ${changelogPath} gs://${gcsBucket}/futurehax/${packageId}/CHANGELOG.md`, {
          stdio: "inherit",
        });
        execSync(
          `gsutil -m setmeta -h "Cache-Control:no-cache, no-store, must-revalidate" "gs://${gcsBucket}/futurehax/${packageId}/CHANGELOG.md"`,
          { stdio: "inherit" },
        );
        logger.log(`✓ CHANGELOG.md uploaded to CDN`);
      }

      logger.log(`✓ Artifacts uploaded to CDN`);
      logger.log(`  Versioned: https://storage.googleapis.com/${gcsBucket}/futurehax/${packageId}/v${version}/`);
      logger.log(`  Latest: https://storage.googleapis.com/${gcsBucket}/futurehax/${packageId}/latest/`);

      if (customDomain) {
        logger.log(`  CDN Version: https://${customDomain}/futurehax/${packageId}/v${version}/`);
        logger.log(`  CDN Latest: https://${customDomain}/futurehax/${packageId}/latest/`);
      }
    } catch (error) {
      logger.warn("Failed to upload to GCS:", error.message);
    }
  } else {
    logger.log("GCS_BUCKET_NAME not set, skipping CDN upload");
  }
}

async function success(pluginConfig, context) {
  const { logger } = context;
  logger.log("Leaving module.zip and module.json in place for downstream steps.");
}

module.exports = { prepare, publish, success };
