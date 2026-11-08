"use strict";

const fs = require("fs");
const path = require("path");

const FOUNDRY_RELEASE_API_URL = "https://api.foundryvtt.com/_api/packages/release_version/";
const STATUS_FILE = "foundry-release-status.json";
const DEFAULT_RETRY_AFTER_SECONDS = 60;
const MAX_RETRY_AFTER_SECONDS = 120;
const TRANSIENT_RETRY_SECONDS = 5;

class FoundryReleaseError extends Error {
  constructor(message, { code = "EFOUNDRYRELEASE", details, status } = {}) {
    super(message);
    this.name = "SemanticReleaseError";
    this.semanticRelease = true;
    this.code = code;
    this.details = details;
    this.status = status;
  }
}

function foundryApiEnabled(env = process.env) {
  return env.SKIP_FOUNDRY_API !== "true";
}

function releaseToken(env = process.env) {
  return (env.PACKAGE_RELEASE_TOKEN || "").trim();
}

function missingTokenError() {
  return new FoundryReleaseError("PACKAGE_RELEASE_TOKEN is not set but Foundry publishing is enabled.", {
    code: "ENOFOUNDRYTOKEN",
    details: [
      "SKIP_FOUNDRY_API is not true, so this release must update the foundryvtt.com package listing.",
      "Add a PACKAGE_RELEASE_TOKEN repository secret (Package Release Token on the package's Foundry edit page)",
      "and pass it to the release job (`secrets: inherit` for the reusable workflow).",
      "Premium or unlisted modules should set `skip-foundry-api: true` instead.",
    ].join(" "),
  });
}

function assertFoundryToken(env = process.env) {
  if (foundryApiEnabled(env) && !releaseToken(env)) {
    throw missingTokenError();
  }
}

function parseBody(text) {
  try {
    return JSON.parse(text);
  } catch (_e) {
    return { raw: text };
  }
}

function errorEntries(data) {
  if (!data || typeof data !== "object" || !data.errors || typeof data.errors !== "object") return [];
  return Object.values(data.errors).flatMap((value) => (Array.isArray(value) ? value : [value]));
}

/** Foundry rejects a re-sent package+version with 400 `unique_together`; the listing already has it. */
function isAlreadyReleased(data) {
  return errorEntries(data).some(
    (entry) =>
      (entry && entry.code === "unique_together") ||
      /already exists/i.test(typeof entry === "string" ? entry : (entry && entry.message) || ""),
  );
}

function isErrorBody(data) {
  return Boolean(data && typeof data === "object" && (data.status === "error" || errorEntries(data).length > 0));
}

function describeBody(data) {
  if (data && typeof data === "object" && "raw" in data) return String(data.raw).slice(0, 500);
  return JSON.stringify(data).slice(0, 500);
}

function retryAfterSeconds(response) {
  const header = response.headers && response.headers.get ? response.headers.get("Retry-After") : null;
  const seconds = Number.parseInt(header || "", 10);
  const wait = Number.isFinite(seconds) && seconds >= 0 ? seconds : DEFAULT_RETRY_AFTER_SECONDS;
  return Math.min(wait + 1, MAX_RETRY_AFTER_SECONDS);
}

const defaultSleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * POST one release to the Foundry Package Release API.
 *
 * Resolves `{ outcome: "published" | "dry-run" | "already-exists", data }`. Rejects with a
 * FoundryReleaseError on a missing token, a non-2xx or `"status": "error"` response, or a thrown
 * request. A 429, 5xx, or network error is retried once (after Retry-After for 429).
 */
async function publishFoundryRelease({
  token,
  payload,
  logger = console,
  fetchImpl = globalThis.fetch,
  sleep = defaultSleep,
}) {
  if (!token || !String(token).trim()) throw missingTokenError();

  const label = `${payload.id} v${payload.release && payload.release.version}`;
  const dryRun = Boolean(payload["dry-run"]);

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    const isLastAttempt = attempt === 2;
    let response;
    try {
      response = await fetchImpl(FOUNDRY_RELEASE_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: String(token).trim() },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      if (!isLastAttempt) {
        logger.warn(
          `Foundry API request for ${label} threw (${error.message}); retrying in ${TRANSIENT_RETRY_SECONDS}s`,
        );
        await sleep(TRANSIENT_RETRY_SECONDS * 1000);
        continue;
      }
      throw new FoundryReleaseError(`Foundry API request for ${label} failed: ${error.message}`, {
        code: "EFOUNDRYREQUEST",
      });
    }

    const data = parseBody(await response.text());

    if (response.ok && !isErrorBody(data)) {
      return { outcome: dryRun ? "dry-run" : "published", data };
    }

    if (isAlreadyReleased(data)) {
      return { outcome: "already-exists", data };
    }

    const retryable = response.status === 429 || response.status >= 500;
    if (retryable && !isLastAttempt) {
      const wait = response.status === 429 ? retryAfterSeconds(response) : TRANSIENT_RETRY_SECONDS;
      logger.warn(`Foundry API returned ${response.status} for ${label}; retrying once in ${wait}s`);
      await sleep(wait * 1000);
      continue;
    }

    throw new FoundryReleaseError(`Foundry API rejected ${label}: HTTP ${response.status} ${describeBody(data)}`, {
      code: "EFOUNDRYAPI",
      status: response.status,
    });
  }

  throw new FoundryReleaseError(`Foundry API request for ${label} did not complete`);
}

function writeFoundryReleaseStatus(status, cwd = process.cwd()) {
  fs.writeFileSync(path.join(cwd, STATUS_FILE), JSON.stringify(status, null, 2) + "\n");
}

module.exports = {
  FOUNDRY_RELEASE_API_URL,
  STATUS_FILE,
  FoundryReleaseError,
  assertFoundryToken,
  foundryApiEnabled,
  isAlreadyReleased,
  publishFoundryRelease,
  releaseToken,
  writeFoundryReleaseStatus,
};
