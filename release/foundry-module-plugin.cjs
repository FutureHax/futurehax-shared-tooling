const fs = require("fs");
const path = require("path");
const archiver = require("archiver");
const { execSync } = require("child_process");
const { promisify } = require("util");
const { compilePacksIfNeeded } = require("./compile-packs-if-needed.cjs");
const {
  applyCatalogUrls,
  buildProtectedManifest,
  foundryReleaseManifestUrl,
  gcsFoundryZipObject,
  isFoundryProtected,
} = require("./foundry-protected.cjs");
const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);

const ZIP_IGNORE = [
  "node_modules/**",
  ".git/**",
  ".gitignore",
  "module.json",
  "module-dev.json",
  "__tests__/**",
  "**/__tests__/**",
  "**/__mocks__/**",
  "*.test.js",
  "**/*.test.js",
  "**/*.test.mjs",
  "**/*.test.ts",
  "packs/_source/**",
  "packs/_backup_*/**",
];

async function prepare(pluginConfig, context) {
  const { nextRelease, logger } = context;
  const { version } = nextRelease;

  const githubUrl = pluginConfig.githubUrl || "https://github.com";
  const repositoryPath = pluginConfig.repositoryPath || process.env.GITHUB_REPOSITORY;

  const modulePath = path.join(process.cwd(), "foundry_vtt", "module.json");
  const moduleContent = await readFile(modulePath, "utf8");
  const moduleJson = JSON.parse(moduleContent);
  const packageId = pluginConfig.packageId || moduleJson.id;

  const { urls: catalogJson, mode } = applyCatalogUrls(moduleJson, {
    packageId,
    version,
    githubUrl,
    repositoryPath,
    gcsBucket: process.env.GCS_BUCKET_NAME,
    customDomain: process.env.CDN_DOMAIN || "downloads.r2plays.games",
    manifestBaseUrl: process.env.MANIFEST_BASE_URL,
  });

  logger.log(`Using ${mode} URLs for catalog/CMS zip`);

  await writeFile(modulePath, JSON.stringify(catalogJson, null, 2) + "\n");
  logger.log(`Updated module.json to version ${version}`);
  logger.log(`Set catalog manifest URL: ${catalogJson.manifest}`);
  logger.log(`Set catalog download URL: ${catalogJson.download}`);
  if (catalogJson.changelog) {
    logger.log(`Set changelog URL: ${catalogJson.changelog}`);
  }

  await writeFile(path.join(process.cwd(), "module.json"), JSON.stringify(catalogJson, null, 2) + "\n");
  logger.log(`Copied catalog module.json to root for GitHub release upload`);

  compilePacksIfNeeded({
    projectRoot: process.cwd(),
    log: (msg) => logger.log(msg),
    error: (msg) => logger.error(msg),
  });

  await createModuleZip(version, logger, { destName: "module.zip", moduleJson: catalogJson });

  if (isFoundryProtected()) {
    const hubJson = buildProtectedManifest(catalogJson, packageId);
    await writeFile(path.join(process.cwd(), "module-foundry.json"), JSON.stringify(hubJson, null, 2) + "\n");
    await createModuleZip(version, logger, { destName: "module-foundry.zip", moduleJson: hubJson });
    logger.log(`Built Foundry Hub zip with protected R2 manifest ${hubJson.manifest}`);
  }
}

function createModuleZip(version, logger, { destName, moduleJson }) {
  const payload = { ...moduleJson, version };
  logger.log(`Creating ${destName} with version ${version}`);

  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(path.join(process.cwd(), destName));
    const archive = archiver("zip", { zlib: { level: 9 } });

    output.on("close", () => {
      logger.log(`Created ${destName} (${archive.pointer()} bytes)`);
      resolve();
    });

    archive.on("error", reject);
    archive.pipe(output);

    archive.glob("**/*", {
      cwd: path.join(process.cwd(), "foundry_vtt"),
      ignore: ZIP_IGNORE,
    });

    archive.append(JSON.stringify(payload, null, 2) + "\n", {
      name: "module.json",
    });

    archive.finalize();
  });
}

async function publish(pluginConfig, context) {
  const { nextRelease, logger } = context;
  const { version } = nextRelease;

  const skipFoundryApi = process.env.SKIP_FOUNDRY_API === "true";
  const foundryToken = process.env.PACKAGE_RELEASE_TOKEN;
  const protectedHub = isFoundryProtected();

  if (skipFoundryApi) {
    logger.log("SKIP_FOUNDRY_API=true, skipping Foundry VTT package update");
  }

  const githubUrl = pluginConfig.githubUrl || "https://github.com";
  const repositoryPath = pluginConfig.repositoryPath || process.env.GITHUB_REPOSITORY;
  const modulePath = path.join(process.cwd(), "foundry_vtt", "module.json");
  const moduleContent = await readFile(modulePath, "utf8");
  const moduleJson = JSON.parse(moduleContent);
  const packageId = pluginConfig.packageId || moduleJson.id;
  const dryRun = pluginConfig.dryRun || false;

  const manifestBaseUrl = process.env.MANIFEST_BASE_URL;
  const gcsBucket = process.env.GCS_BUCKET_NAME;
  const gcsPrivateBucket = process.env.GCS_PRIVATE_BUCKET_NAME;
  const uploadBucket = manifestBaseUrl && gcsPrivateBucket ? gcsPrivateBucket : gcsBucket;
  const customDomain = process.env.CDN_DOMAIN;

  let catalogManifestUrl;
  if (gcsBucket && customDomain) {
    catalogManifestUrl = `https://${customDomain}/futurehax/${packageId}/latest/module.json`;
  } else if (gcsBucket) {
    catalogManifestUrl = `https://storage.googleapis.com/${gcsBucket}/futurehax/${packageId}/latest/module.json`;
  } else {
    catalogManifestUrl = `${githubUrl}/${repositoryPath}/releases/latest/download/module.json`;
  }

  if (!skipFoundryApi && foundryToken) {
    const manifestUrl = foundryReleaseManifestUrl({
      protectedHub,
      packageId,
      catalogManifestUrl,
    });

    const releaseData = {
      id: packageId,
      "dry-run": dryRun,
      release: {
        version: version,
        manifest: manifestUrl,
        notes:
          gcsBucket && customDomain
            ? `https://${customDomain}/futurehax/${packageId}/CHANGELOG.md`
            : `${githubUrl}/${repositoryPath}/releases/tag/v${version}`,
        compatibility: moduleJson.compatibility || {
          minimum: "12",
          verified: "12",
          maximum: "",
        },
      },
    };

    logger.log(`Updating Foundry VTT package listing for ${packageId} v${version}...`);
    if (protectedHub) {
      logger.log(
        "Protected Hub zip is module-foundry.zip. Foundry hosts premium packages via the Premium Content Uploader (https://foundryvtt.com/me/packages); the JSON release API only records the R2 manifest URL.",
      );
    }

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
  } else if (!skipFoundryApi) {
    logger.log("PACKAGE_RELEASE_TOKEN not set, skipping Foundry VTT package update");
  }

  if (uploadBucket) {
    const isPrivate = !!(manifestBaseUrl && gcsPrivateBucket);
    logger.log(`Uploading catalog artifacts to GCS ${isPrivate ? "private" : "CDN"} bucket (${uploadBucket})...`);

    try {
      const moduleZipPath = path.join(process.cwd(), "module.zip");
      const moduleJsonPath = path.join(process.cwd(), "module.json");

      if (!fs.existsSync(moduleZipPath)) {
        logger.warn("module.zip not found, skipping GCS upload");
        return;
      }

      execSync(`gsutil -q cp ${moduleZipPath} gs://${uploadBucket}/futurehax/${packageId}/v${version}/`, {
        stdio: "inherit",
      });
      execSync(`gsutil -q cp ${moduleJsonPath} gs://${uploadBucket}/futurehax/${packageId}/v${version}/`, {
        stdio: "inherit",
      });

      const hubZipPath = path.join(process.cwd(), "module-foundry.zip");
      const hasHubZip = fs.existsSync(hubZipPath);
      if (hasHubZip) {
        execSync(`gsutil -q cp ${hubZipPath} gs://${uploadBucket}/${gcsFoundryZipObject(packageId, version)}`, {
          stdio: "inherit",
        });
      }

      execSync(
        `gsutil -m setmeta -h "Cache-Control:public, max-age=31536000, immutable" "gs://${uploadBucket}/futurehax/${packageId}/v${version}/**"`,
        { stdio: "inherit" },
      );

      execSync(`gsutil -q cp ${moduleZipPath} gs://${uploadBucket}/futurehax/${packageId}/latest/`, {
        stdio: "inherit",
      });
      execSync(`gsutil -q cp ${moduleJsonPath} gs://${uploadBucket}/futurehax/${packageId}/latest/`, {
        stdio: "inherit",
      });
      if (hasHubZip) {
        execSync(
          `gsutil -q cp ${hubZipPath} gs://${uploadBucket}/${gcsFoundryZipObject(packageId, version, "latest")}`,
          {
            stdio: "inherit",
          },
        );
      }
      execSync(
        `gsutil -m setmeta -h "Cache-Control:no-cache, no-store, must-revalidate" "gs://${uploadBucket}/futurehax/${packageId}/latest/**"`,
        { stdio: "inherit" },
      );

      const changelogPath = path.join(process.cwd(), "CHANGELOG.md");
      if (fs.existsSync(changelogPath)) {
        execSync(`gsutil -q cp ${changelogPath} gs://${uploadBucket}/futurehax/${packageId}/CHANGELOG.md`, {
          stdio: "inherit",
        });
        execSync(
          `gsutil -m setmeta -h "Cache-Control:no-cache, no-store, must-revalidate" "gs://${uploadBucket}/futurehax/${packageId}/CHANGELOG.md"`,
          { stdio: "inherit" },
        );
        logger.log(`✓ CHANGELOG.md uploaded to CDN`);
      }

      logger.log(`✓ Catalog artifacts uploaded to ${isPrivate ? "private" : "CDN"} bucket`);
      if (hasHubZip) {
        logger.log(`✓ Hub zip uploaded as ${gcsFoundryZipObject(packageId, version)}`);
      }
      logger.log(`  Versioned: gs://${uploadBucket}/futurehax/${packageId}/v${version}/`);
      logger.log(`  Latest: gs://${uploadBucket}/futurehax/${packageId}/latest/`);

      if (!isPrivate && customDomain) {
        logger.log(`  CDN Version: https://${customDomain}/futurehax/${packageId}/v${version}/`);
        logger.log(`  CDN Latest: https://${customDomain}/futurehax/${packageId}/latest/`);
      }
    } catch (error) {
      logger.warn("Failed to upload to GCS:", error.message);
    }
  } else {
    logger.log("GCS_BUCKET_NAME not set, skipping GCS upload");
  }
}

async function success(pluginConfig, context) {
  const { logger } = context;
  logger.log("Leaving module.zip, module.json, and any module-foundry.* artifacts in place for downstream steps.");
}

module.exports = { prepare, publish, success };
