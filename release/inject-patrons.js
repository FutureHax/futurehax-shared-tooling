#!/usr/bin/env node
"use strict";

/**
 * inject-patrons.js
 *
 * Fetches the active patron list from the Patreon Creator API and injects a
 * "Thank You, Patrons!" section into every Foundry VTT compendium journal page
 * that contains the FutureHax Patreon link.
 *
 * Run from the module root:
 *   node .shared-tooling/release/inject-patrons.js
 *
 * Required env vars (set in .env or CI secrets):
 *   PATREON_CREATOR_TOKEN  — Creator Access Token from patreon.com/portal
 *   PATREON_CAMPAIGN_ID    — Your campaign ID (e.g. 16174438)
 *
 * The injection is idempotent: subsequent runs replace the block between
 * <!-- PATRONS_START --> and <!-- PATRONS_END --> markers rather than appending.
 */

const fs = require("fs");
const path = require("path");

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const ROOT = process.cwd();

function loadEnv(dir) {
  try {
    const text = fs.readFileSync(path.join(dir, ".env"), "utf8");
    for (const line of text.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq);
      const val = trimmed.slice(eq + 1);
      if (!process.env[key]) process.env[key] = val;
    }
  } catch {
    // no .env — rely on environment
  }
}

loadEnv(ROOT);

const PATREON_TOKEN = process.env.PATREON_CREATOR_TOKEN;
const CAMPAIGN_ID = process.env.PATREON_CAMPAIGN_ID;
const PATREON_BASE = "https://www.patreon.com/api/oauth2/v2";

const PATREON_LINK = "patreon.com/r2plays";
const PATRONS_START = "<!-- PATRONS_START -->";
const PATRONS_END = "<!-- PATRONS_END -->";

// ---------------------------------------------------------------------------
// Patreon API
// ---------------------------------------------------------------------------

async function fetchAllActivePatronNames() {
  if (!PATREON_TOKEN) throw new Error("Missing PATREON_CREATOR_TOKEN env var");
  if (!CAMPAIGN_ID) throw new Error("Missing PATREON_CAMPAIGN_ID env var");

  const names = [];
  let cursor = null;
  let page = 0;

  while (true) {
    page++;
    const params = new URLSearchParams({
      "fields[member]": "full_name,patron_status",
      "page[count]": "500",
    });
    if (cursor) params.set("page[cursor]", cursor);

    const url = `${PATREON_BASE}/campaigns/${CAMPAIGN_ID}/members?${params}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${PATREON_TOKEN}` },
    });

    if (!res.ok) {
      throw new Error(`Patreon API error ${res.status}: ${await res.text()}`);
    }

    const json = await res.json();

    for (const member of json.data) {
      const { patron_status, full_name } = member.attributes;
      if (patron_status === "active_patron" && full_name) {
        names.push(full_name.trim());
      }
    }

    cursor = json.meta?.pagination?.cursors?.next;
    if (!cursor) break;
  }

  return names.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
}

// ---------------------------------------------------------------------------
// HTML helpers
// ---------------------------------------------------------------------------

function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildPatronBlock(names) {
  const items = names.map((n) => `<li>${escapeHtml(n)}</li>`).join("");
  return `${PATRONS_START}<hr /><h3>Thank You, Patrons!</h3><ul>${items}</ul>${PATRONS_END}`;
}

/**
 * Given a page's text.content, inject or replace the patron block.
 * Returns the updated content string, or null if this page has no injection point.
 */
function injectIntoContent(content, patronBlock) {
  // Case 1: marker block already exists — replace it (idempotent)
  if (content.includes(PATRONS_START)) {
    const startIdx = content.indexOf(PATRONS_START);
    const endIdx = content.indexOf(PATRONS_END, startIdx);
    if (endIdx !== -1) {
      return (
        content.slice(0, startIdx) +
        patronBlock +
        content.slice(endIdx + PATRONS_END.length)
      );
    }
  }

  // Case 2: Patreon link present — insert after the </p> that closes it
  const linkIdx = content.indexOf(PATREON_LINK);
  if (linkIdx === -1) return null; // not a credits page we can inject into

  const pCloseIdx = content.indexOf("</p>", linkIdx);
  if (pCloseIdx === -1) return null;

  const insertAt = pCloseIdx + "</p>".length;
  return content.slice(0, insertAt) + patronBlock + content.slice(insertAt);
}

// ---------------------------------------------------------------------------
// File walking
// ---------------------------------------------------------------------------

function walkJsonFiles(dir) {
  const results = [];
  if (!fs.existsSync(dir)) return results;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkJsonFiles(full));
    } else if (entry.isFile() && entry.name.endsWith(".json")) {
      results.push(full);
    }
  }
  return results;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const sourceDir = path.join(ROOT, "foundry_vtt", "packs", "_source");

  if (!fs.existsSync(sourceDir)) {
    console.log(
      "No foundry_vtt/packs/_source directory found — skipping patron injection."
    );
    process.exit(0);
  }

  console.log("Fetching active patrons from Patreon...");
  const names = await fetchAllActivePatronNames();
  console.log(`  Found ${names.length} active patron(s).`);

  if (names.length === 0) {
    console.warn(
      "  WARNING: Patreon returned 0 active patrons. Skipping injection to avoid accidental wipe."
    );
    process.exit(0);
  }

  const patronBlock = buildPatronBlock(names);
  const jsonFiles = walkJsonFiles(sourceDir);

  let injectedCount = 0;
  let skippedCount = 0;

  for (const filePath of jsonFiles) {
    let journal;
    try {
      journal = JSON.parse(fs.readFileSync(filePath, "utf8"));
    } catch {
      continue;
    }

    if (!journal.pages || !Array.isArray(journal.pages)) continue;

    let fileModified = false;

    for (const page of journal.pages) {
      if (page.type !== "text" || !page.text?.content) continue;

      const updated = injectIntoContent(page.text.content, patronBlock);

      if (updated === null) {
        skippedCount++;
        continue;
      }

      if (updated !== page.text.content) {
        page.text.content = updated;
        fileModified = true;
        injectedCount++;
        console.log(
          `  Injected into: ${path.relative(ROOT, filePath)} → page "${page.name}"`
        );
      } else {
        // Content was already up to date (same patron list)
        injectedCount++;
        console.log(
          `  Up to date:    ${path.relative(ROOT, filePath)} → page "${page.name}"`
        );
      }
    }

    if (fileModified) {
      fs.writeFileSync(filePath, JSON.stringify(journal, null, 2) + "\n", "utf8");
    }
  }

  if (injectedCount === 0) {
    console.log(
      "\n  No journal pages with a FutureHax Patreon link found — nothing to inject."
    );
    console.log(
      "  Add the Patreon link to a credits page or run `module-doctor apply --patreon` to wire it up."
    );
  } else {
    console.log(`\n✓ Patron list processed for ${injectedCount} page(s).`);
  }
}

main().catch((err) => {
  console.error("\nFATAL:", err.message);
  process.exit(1);
});
