# App Architecture — create-lando-app

> Created: 2026-07-12 · Source: codebase scan + HANDOVER.md / CLAUDE.md

## What this is

`create-lando-app` is the free CLI scaffold for the Lando Labs Design System.
`npm create lando-app@latest` (≡ `npx create-lando-app`) generates a Next.js
App Router project already wired to `@lando-labs/design-system`. Strategically
it is the **top of the acquisition funnel** for the eventual paid MCP product.

## Feature areas (issue-grouping buckets)

| Area | Files | What it owns |
| --- | --- | --- |
| **CLI** | `src/index.ts` | Prompts, package-manager detection, template copy, placeholder substitution, optional install, optional `.mcp.json` drop-in. Holds the `DS_VERSION` constant. |
| **Templates** | `templates/next-app-router/**` | The scaffolded app. Encodes the #462 cascade-layer golden path. `_gitignore` renamed to `.gitignore` on copy. Placeholders: `{{PROJECT_NAME}}`, `{{DS_VERSION}}`. |
| **Test / smoke harness** | `scripts/smoke.ts` *(not built)*, `npm test` | Consumer smoke test: scaffold → install DS → build → assert #462 spacing invariant. The real drift guard. |
| **CI / release** | `.github/workflows/{test,publish}.yml` | Typecheck/build/test on PR; tag-push publish to public npm (provenance) + GitHub Release. |
| **Drift automation** | *(not built)* receiver workflow | `repository_dispatch` handler that opens a `DS_VERSION`-bump PR when the DS publishes. Sibling dispatcher lives in the DS repo. |

## The load-bearing invariant: the #462 cascade-layer contract

The Next template's CSS wiring (`app/layout.tsx` + `app/globals.css`) is the
whole point of the product. Import order MUST be:

1. `@lando-labs/design-system/layer-order.css` (declares layer order first)
2. `./globals.css` (app reset lives in `@layer app-reset`, the lowest layer)
3. `@lando-labs/design-system/styles`

If the DS changes its layer names/order or CSS entry points, this template must
change in lockstep. The smoke test is what guards this automatically.

## Templates roadmap

| Template | Status |
| --- | --- |
| `next-app-router` | ✅ built (v1) |
| `vite-react` (SPA) | planned — needs `themeScript()` hand-inlined into `index.html`, care around bundler CSS-import order |

## The A1 gate (dominant constraint)

Nothing a scaffolded app does works until `@lando-labs/design-system` is on
**public npm** (the "A1" launch, owned by the DS repo's go-live runbook). Until
then: no real `npm install` in the generated app, no live smoke test, no
publish. Sprint planning is organized around this gate.

## Update Log

- 2026-07-12 — Initial creation during repo/GitHub setup + first sprint plan.
