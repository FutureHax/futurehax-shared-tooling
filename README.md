# futurehax-shared-tooling

Shared development tooling for all FutureHax projects. Added as a git submodule at `.shared-tooling/` in each consuming project.

## Quick Start

Add to an existing project:

```bash
git submodule add https://github.com/FutureHax/futurehax-shared-tooling.git .shared-tooling
```

Or use the automated migration script:

```bash
.shared-tooling/scripts/migrate-project.sh /path/to/project foundry-module
```

## What's Included

| Directory | Purpose |
|-----------|---------|
| `eslint/` | ESLint flat configs (Foundry module, extended, Node base, TypeScript) |
| `commitlint/` | Commitlint presets (Foundry module with `tweak` type, generic base) |
| `prettier/` | Prettier config (`printWidth: 120`) |
| `lint-staged/` | lint-staged configs (full with gitleaks, minimal, Node base) |
| `husky/` | Pre-commit and commit-msg hook scripts with CI skip |
| `taskfile/` | Taskfile.yml includes for common tasks |
| `release/` | Build scripts, Foundry semantic-release plugin, install scripts |
| `releaserc/` | semantic-release config factories |
| `rules/` | Baseline Cursor rules per project type (e.g. `next-app/`) |
| `skills/` | Baseline agent skills per project type (e.g. `next-app/`) |
| `scripts/` | Migration and setup utilities |

## Project Types

### `foundry-module` (default)

Standard Foundry VTT module with base globals (`game`, `ui`, `Hooks`, `Actor`, `Item`, etc.).

### `foundry-module-extended`

Adds legacy Application framework globals (`Dialog`, `Application`, `FormApplication`, `renderTemplate`).

### `foundry-content`

Extended globals + REFERENCE directory ignores for content/adventure modules.

### `node-base`

Generic Node.js project without Foundry globals.

### `next-app`

FutureHax Next.js web app (Chakra UI + Prisma + Helm/Flux), scaffolded from
[`nextjs-webapp-template`](https://github.com/FutureHax/nextjs-webapp-template)
and audited by [`futurehax-next-doctor`](https://github.com/FutureHax/futurehax-next-doctor).
Provides:

- `eslint/next-app.mjs` — `createNextConfig()` (wraps `eslint-config-next` + Prettier)
- `releaserc/next-app.js` — `createReleaseConfig({ chartPath })` (optional Helm versioning)
- `taskfile/next-app.yml` — dev/build/lint/type-check/test/db/release tasks
- `rules/next-app/next-app-spec.mdc` — baseline Cursor rule
- `skills/next-app/writing-nextjs-app-spec/` — baseline agent skill

Consumer examples:

```javascript
// eslint.config.mjs
import { createNextConfig } from "./.shared-tooling/eslint/next-app.mjs";
export default createNextConfig();
```

```javascript
// release.config.cjs
const { createReleaseConfig } = require("./.shared-tooling/releaserc/next-app.js");
module.exports = createReleaseConfig({ chartPath: "chart/my-app" });
```

```typescript
// commitlint.config.ts
export { default } from "./.shared-tooling/commitlint/base.ts";
```

Copy the baseline rule and skill into the app's `.cursor/`:

```bash
mkdir -p .cursor/rules .cursor/skills
cp .shared-tooling/rules/next-app/next-app-spec.mdc .cursor/rules/
cp -r .shared-tooling/skills/next-app/writing-nextjs-app-spec .cursor/skills/
```

## Consumer Config Examples

### eslint.config.mjs

```javascript
import { createFoundryConfig } from "./.shared-tooling/eslint/foundry-module.mjs";
export default createFoundryConfig({
  extraGlobals: { ActorSheet: "readonly" },
  ignores: ["REFERENCE/**"],
});
```

### commitlint.config.ts

```typescript
export { default } from "./.shared-tooling/commitlint/foundry-module.ts";
```

### lint-staged.config.js

```javascript
module.exports = require("./.shared-tooling/lint-staged/full.js");
```

### .releaserc.js

```javascript
const { createReleaseConfig } = require("./.shared-tooling/releaserc/foundry-module.js");
module.exports = createReleaseConfig();
```

### Taskfile.yml

```yaml
version: "3"
dotenv: [".env"]
includes:
  shared: .shared-tooling/taskfile/foundry-module.yml
vars:
  MODULE_ID: my-module
tasks:
  default:
    cmds: [task --list]
```

### .husky/pre-commit

```sh
./.shared-tooling/husky/pre-commit.sh
```

### package.json

```json
{
  "prettier": "./.shared-tooling/prettier/base.json"
}
```

## Updating

To update all projects to the latest shared tooling:

```bash
cd /path/to/project
git submodule update --remote .shared-tooling
git add .shared-tooling
git commit -m "chore(deps): update shared-tooling"
```

## Development

Changes to this repo automatically propagate when consumers run `git submodule update --remote`.
Tag releases for stability if needed.
