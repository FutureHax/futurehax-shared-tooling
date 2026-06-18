/**
 * Semantic-release plugin that generates a plain-English changelog summary
 * using OpenAI, tailored for tabletop RPG web app users.
 *
 * Runs in the `prepare` lifecycle after @semantic-release/changelog has
 * written CHANGELOG.md. Prepends a "What's New" section with user-friendly
 * bullet points. Falls back gracefully when OPENAI_API_KEY is not set.
 */
const fs = require("fs");
const path = require("path");

const SYSTEM_PROMPT = `You write release notes for users of tabletop RPG web applications and tools. Users are game masters and players who use these apps alongside their games.

Rules:
- Write 3-8 short bullet points summarizing user-facing changes
- Group related commits into a single bullet
- ONLY mention user-facing changes: new features, bug fixes, UI changes, new content
- Skip: CI/CD, tooling, dependency bumps, refactors, build changes, test changes, docs
- Be specific (e.g. "Fixed character sheet not saving after adding equipment" not "improved reliability")
- If only non-user-facing work happened, write "Internal improvements and stability fixes."
- No intro, no sign-off. Just the bullets.
- Do NOT use: enhance, leverage, robust, seamless, innovative, comprehensive, crucial, cutting-edge, facilitate, utilize, elevate, embark, foster, harness, delve, navigate, paramount, transformative, vibrant, vital, significant, capabilities, immersion`;

async function prepare(pluginConfig, context) {
  const { nextRelease, logger } = context;
  const { version, notes } = nextRelease;

  if (!notes || !notes.trim()) {
    logger.log("No release notes available, skipping changelog summary.");
    return;
  }

  const changelogPath = path.join(process.cwd(), "CHANGELOG.md");
  if (!fs.existsSync(changelogPath)) {
    logger.log("CHANGELOG.md not found, skipping summary prepend.");
    return;
  }

  const summary = await generateSummary(notes, logger);
  if (!summary) {
    return;
  }

  const existing = fs.readFileSync(changelogPath, "utf8");
  const header = `## What's New in v${version}\n\n${summary}\n\n---\n\n`;
  fs.writeFileSync(changelogPath, header + existing);
  logger.log(`✓ Prepended AI changelog summary to CHANGELOG.md`);
}

async function generateSummary(notes, logger) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    logger.log("OPENAI_API_KEY not set, skipping AI changelog summary generation.");
    return null;
  }

  const userPrompt = `Summarize these release notes into user-friendly bullet points:\n\n${notes}`;

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        max_tokens: 512,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!res.ok) {
      logger.warn(`OpenAI API error: ${res.status} — falling back to raw notes.`);
      return null;
    }

    const data = await res.json();
    return data.choices[0].message.content.trim();
  } catch (error) {
    logger.warn(`OpenAI request failed: ${error.message} — skipping summary.`);
    return null;
  }
}

module.exports = { prepare };
