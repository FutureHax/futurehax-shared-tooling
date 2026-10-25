---
name: writing-nextjs-app-spec
description: Use when authoring or updating docs/SPEC.md for a FutureHax Next.js web app, scoping a new app from nextjs-webapp-template or nextjs-firebase-webapp-template, or changing its public surface (routes, env vars, data model, deploy infra). Keeps the spec aligned with the app's deploy profile (Firebase App Hosting, base, or the alpha-5 Prisma + Helm profile) that futurehax-next-doctor audits.
---

# Writing a FutureHax Next.js App Spec

Every FutureHax Next.js web app keeps a `docs/SPEC.md` describing its purpose,
surface, and operational contract. Update the spec **before** non-trivial
changes, and keep it consistent with the app's deploy profile.

## Pick the profile first

Read `.cursor/rules/next-app-spec.mdc` (a symlink into `.shared-tooling/rules/`)
and write the spec for that profile. Do not carry another profile's stack into
the spec.

| Rule variant         | Who uses it                                         | Data model section          | Deploy section                                      |
| -------------------- | --------------------------------------------------- | --------------------------- | --------------------------------------------------- |
| `next-app-firebase/` | Firebase App Hosting apps (most product apps)       | Firestore collections, rules | `apphosting.yaml`, `firebase.json`, Secret Manager |
| `next-app-base/`     | Apps with no data layer or deploy path yet          | Omit, or "none yet"         | Omit, or "none yet"                                 |
| `next-app/`          | alpha-5 only: Prisma + PostgreSQL on Helm/Flux, GKE | Prisma models, migrations   | Helm values, Flux wiring, GCP/CDN `vars.*`          |

Only use the Prisma + Helm sections on the alpha-5 profile: a non-Firebase
repo that actually carries `prisma/schema.prisma`, `chart/`, or `flux/`. A Firebase app
must not gain Prisma, PostgreSQL, Helm, or Flux through its spec.

## When to use

- Scaffolding a new app from `nextjs-firebase-webapp-template` (Firebase) or
  `nextjs-webapp-template` (base UI scaffold).
- Adding/removing routes, API endpoints, or env vars.
- Changing the data model (Firestore collections, or Prisma models on the
  alpha-5 profile).
- Changing deploy infra (App Hosting config, or Helm/Flux on the alpha-5 profile).

## Required sections

1. **Overview & user value**: what the app does and for whom.
2. **Scope**: in/out of scope; out-of-scope should list anything off the
   profile's stack.
3. **Routes & API**: App Router routes (`src/app`), server actions, API handlers.
4. **Data model**: the profile's data layer (see table) and key relations.
5. **Environment**: every variable, mirrored in `.env.example`; mark secrets.
6. **Deploy**: the profile's deploy path (see table) and required GitHub
   secrets / `vars.*`.
7. **Testing**: Vitest unit coverage and any e2e suite.
8. **Change log**: dated entries per release.

## Guardrails

- Do not document or introduce shadcn/Tailwind. The UI stack is **Chakra UI**.
- Keep Node engines, lint/format, hooks, and release tooling delegated to
  `.shared-tooling` presets.
- After editing the spec, run `next-doctor audit .` to confirm no new drift.
