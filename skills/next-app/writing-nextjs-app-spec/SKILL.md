---
name: writing-nextjs-app-spec
description: Use when authoring or updating docs/SPEC.md for a FutureHax Next.js web app, scoping a new app from nextjs-webapp-template, or changing its public surface (routes, env vars, data model, deploy infra). Keeps the spec aligned with the Chakra/Prisma/Helm baseline that futurehax-next-doctor audits.
---

# Writing a FutureHax Next.js App Spec

Every FutureHax Next.js web app keeps a `docs/SPEC.md` describing its purpose,
surface, and operational contract. Update the spec **before** non-trivial
changes, and keep it consistent with the `nextjs-webapp-template` baseline.

## When to use

- Scaffolding a new app from `nextjs-webapp-template`.
- Adding/removing routes, API endpoints, or env vars.
- Changing the Prisma data model.
- Changing deploy infra (Helm chart, Flux, GCP config).

## Required sections

1. **Overview & user value** — what the app does and for whom.
2. **Scope** — in/out of scope; out-of-scope should list anything off the
   canonical stack.
3. **Routes & API** — App Router routes (`src/app`), server actions, API handlers.
4. **Data model** — Prisma models and key relations; migration notes.
5. **Environment** — every variable, mirrored in `.env.example`; mark secrets.
6. **Deploy** — Helm chart values per env, Flux wiring, GCP/CDN variables
   (sourced from repo `vars.*`), required GitHub secrets.
7. **Testing** — Vitest unit coverage and any e2e suite.
8. **Change log** — dated entries per release.

## Guardrails

- Do not document or introduce shadcn/Tailwind — the UI stack is **Chakra UI**.
- Keep Node engines, lint/format, hooks, and release tooling delegated to
  `.shared-tooling` presets.
- After editing the spec, run `next-doctor audit .` to confirm no new drift.
