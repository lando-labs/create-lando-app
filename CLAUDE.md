# create-lando-app

## What this is

`create-lando-app` is the free CLI scaffold for the Lando Labs Design System —
`npm create lando-app@latest` (equivalently `npx create-lando-app`) generates a
Next.js App Router project that's already correctly wired to
`@lando-labs/design-system`.

Strategically it's the **top of the acquisition funnel** (issue #368, epic #298
in the design-system repo): lower the time-to-first-render, and optionally drop
in an MCP client config so a new user's Claude Code / Cursor is immediately
design-system-aware. The MCP is the eventual paid wedge; this CLI is how people
arrive at it.

**This is a standalone repo/package** — a sibling to the DS and the MCP, not a
monorepo package. It publishes to public npm on its own release pipeline.

## The three sibling repos

| Repo (local dir) | npm package | Role |
| --- | --- | --- |
| `~/lando-labs/lando-labs-design-system` | `@lando-labs/design-system` | The component library. Source of truth for the cascade-layer contract. |
| `~/lando-labs/lando-ds-mcp` | `@lando-labs/design-system-mcp` | The MCP server. This repo's conventions (build, CI, publish) were modeled on it. |
| `~/lando-labs/create-lando-app` *(this repo)* | `create-lando-app` | The scaffold CLI. |

## Repo layout

```
src/index.ts                       The CLI (compiled to dist/ by tsc).
templates/next-app-router/         The one template (v1). Copied verbatim,
                                   then placeholders substituted.
.github/workflows/{test,publish}.yml
```

- **Templates live in this repo** (not pulled from the DS at release time).
- Template files use `{{PROJECT_NAME}}` and `{{DS_VERSION}}` placeholders,
  substituted by the CLI on scaffold.
- The template's `.gitignore` is stored as `_gitignore` (npm strips a real
  `.gitignore` from published tarballs); the CLI renames it on copy.

## The one thing not to break: the #462 cascade-layer contract

The Next template's CSS wiring (`app/layout.tsx` + `app/globals.css`) encodes
the DS's "golden path" for coexisting with a CSS reset (DS issue #462):

1. `@lando-labs/design-system/layer-order.css` is imported **first** — it
   declares the cascade-layer order so an app reset can sit *below* the DS
   layers.
2. The app reset lives in `@layer app-reset` (the lowest layer), so it can't
   zero out DS component spacing.
3. Then `@lando-labs/design-system/styles`.

If the DS ever changes its layer names/order or CSS entry points, this template
must be updated in lockstep. That's what the drift mechanism (below) guards.

## Drift mechanism: CI push, not pull

The DS is the source of truth for the layer contract, but this repo owns the
templates. To keep them in sync **without** manual vigilance: when the DS
publishes a new version, its release workflow dispatches to this repo, which
opens a PR to bump `DS_VERSION` (the constant in `src/scaffold.ts`) and
re-run a **consumer smoke test** (scaffold the template against the new DS
tarball → build → assert component spacing is intact). A plain version bump
can't catch a layer-contract break; the smoke test is the real guard.

> Status: the dispatch step (DS side) and the smoke test (this side) are **not
> built yet** — both are gated on the DS going public on npm. See HANDOVER.md.

## Dev commands

```bash
npm install
npm run build      # tsc → dist/, then chmod +x dist/index.js
npm run dev        # tsc --watch
npm run typecheck  # tsc --noEmit
npm test           # placeholder until the smoke test lands (A1 gate)
```

**Test a scaffold locally** (the generated app can't `npm install` until the DS
is on public npm — see the A1 gate in HANDOVER.md):

```bash
npm run build
node dist/index.js    # runs the interactive CLI in the current directory
```

## Conventions (inherited from lando-ds-mcp)

- License **Apache-2.0** + `NOTICE`.
- Publish on semver tag push (`v*.*.*`) via `.github/workflows/publish.yml` —
  public npm, SLSA provenance, tag-must-match-package.json, GitHub Release from
  the annotated tag message.
- `files` allowlist ships only `dist/`, `templates/`, and the docs/license;
  `.npmignore` is belt-and-suspenders.

## Current scope (v1)

- **Next.js App Router only.** Vite (SPA) template is planned; standalone
  "vanilla React" was intentionally dropped (Vite is the SPA path).
- MCP config drop-in is framework-agnostic (editor-level `.mcp.json`).

## Read before starting

`HANDOVER.md` — the full origin story, decisions, what's built vs. gated, and
the immediate next steps.
