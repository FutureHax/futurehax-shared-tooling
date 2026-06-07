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
