# App Architecture — create-lando-app

> Created: 2026-07-12 · Source: codebase scan + HANDOVER.md / CLAUDE.md

## What this is

`create-lando-app` is the free CLI scaffold for the Lando Labs Design System.
`npm create lando-app@latest` (≡ `npx create-lando-app`) generates a Next.js
App Router project already wired to `@lando-labs/lando-ds`. Strategically
it is the **top of the acquisition funnel** for the eventual paid MCP product.

## Feature areas (issue-grouping buckets)

| Area | Files | What it owns |
| --- | --- | --- |
| **CLI** | `src/index.ts` | Prompts, package-manager detection, template copy, placeholder substitution, optional install, optional `.mcp.json` drop-in. Holds the `DS_VERSION` constant. |
| **Templates** | `templates/next-app-router/**` | The scaffolded app. Encodes the #462 cascade-layer golden path. `_gitignore` renamed to `.gitignore` on copy. Placeholders: `{{PROJECT_NAME}}`, `{{DS_VERSION}}`. |
| **Scaffold module** | `src/scaffold.ts` | Shared copy/rename/substitute/`.mcp.json` logic + the `DS_VERSION` constant. Imported by both the CLI and the smoke test so the guard can't drift from what ships. |
| **Test / smoke harness** | `scripts/smoke.mjs`, `npm test` | ✅ built. Consumer smoke test: scaffold (via `dist/scaffold.js`) → install DS → `next build` → assert `app-reset` is the lowest cascade layer. Dormant-safe (skips + exit 0 until the DS is resolvable). |
| **CI / release** | `.github/workflows/{test,publish}.yml` | Typecheck/build/test on PR; tag-push publish to public npm (provenance) + GitHub Release. |
| **Drift automation** | `.github/workflows/ds-drift.yml` | ✅ built (receiver). `repository_dispatch(ds-published)` / `workflow_dispatch` → bump `DS_VERSION` → open a PR that runs the smoke test. Sibling dispatcher (DS repo) still pending. |

## The load-bearing invariant: the #462 cascade-layer contract

The Next template's CSS wiring (`app/layout.tsx` + `app/globals.css`) is the
whole point of the product. Import order MUST be:

1. `@lando-labs/lando-ds/layer-order.css` (declares layer order first)
2. `./globals.css` (app reset lives in `@layer app-reset`, the lowest layer)
3. `@lando-labs/lando-ds/styles`

If the DS changes its layer names/order or CSS entry points, this template must
change in lockstep. The smoke test is what guards this automatically.

## Templates roadmap

| Template | Status |
| --- | --- |
| `next-app-router` | ✅ built (v1) |
| `vite-react` (SPA) | planned — needs `themeScript()` hand-inlined into `index.html`, care around bundler CSS-import order |

## Dependency status (was: the A1 gate)

- ✅ **DS is public** — `@lando-labs/lando-ds@0.57.0` on npm. The old "A1 gate"
  (which blocked everything on the DS going public) is **resolved**. The DS
  shipped under a new name; `@lando-labs/design-system` never published.
  The smoke test now runs live against public npm.
- ⏳ **MCP not yet published** — locally `@lando-labs/design-system-mcp` v3.3.0,
  mid-rename. The scaffolded `.mcp.json` and the agent's MCP-first loop stay
  inert for external users until it publishes (#16). Everything else works.

## Update Log

- 2026-07-12 — Initial creation during repo/GitHub setup + first sprint plan.
- 2026-07-12 — Sprint 1 (PR #8): added the `src/scaffold.ts` shared module; the
  smoke harness (`scripts/smoke.mjs`) and drift receiver (`ds-drift.yml`) are now
  built (dormant until A1). `DS_VERSION` moved from `src/index.ts` → `src/scaffold.ts`.
