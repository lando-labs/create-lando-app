# create-lando-app

## What this is

`create-lando-app` is the free CLI scaffold for the Lando Labs Design System —
`npm create @lando-labs/lando-app@latest` (equivalently
`npx @lando-labs/create-lando-app`) generates a
Next.js App Router project that's already correctly wired to
`@lando-labs/lando-ds`.

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
| `~/lando-labs/lando-ds` | `@lando-labs/lando-ds` | The component library. Source of truth for the cascade-layer contract. **Public on npm** (0.58.0). (`~/lando-labs/lando-labs-design-system` is the stale pre-rename checkout.) |
| `~/lando-labs/lando-ds-mcp` | `@lando-labs/lando-ds-mcp` | The MCP server. This repo's conventions (build, CI, publish) were modeled on it. **Public on npm** (4.0.0). The scaffolded `.mcp.json` wires it as server key `lando-ds`. |
| `~/lando-labs/create-lando-app` *(this repo)* | `@lando-labs/create-lando-app` | The scaffold CLI. |

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

1. `@lando-labs/lando-ds/layer-order.css` is imported **first** — it
   declares the cascade-layer order so an app reset can sit *below* the DS
   layers.
2. The app reset lives in `@layer app-reset` (the lowest layer), so it can't
   zero out DS component spacing.
3. Then `@lando-labs/lando-ds/styles`.

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

> Status: the **smoke test** (`scripts/smoke.mjs`) and the **drift receiver**
> (`.github/workflows/ds-drift.yml`) are built and live. The DS-side dispatch step
> is still pending in the DS repo.

## Dev commands

```bash
npm install
npm run build      # tsc → dist/, then chmod +x dist/index.js
npm run dev        # tsc --watch
npm run typecheck  # tsc --noEmit
npm test           # consumer smoke test (scaffold → install → build → #462 assert)
```

`npm test` runs live against the published DS. To test against an unreleased
local DS build instead:

```bash
# in ~/lando-labs/lando-ds:  npm pack --ignore-scripts
LANDO_DS_TARBALL=/abs/path/to/lando-labs-lando-ds-0.58.0.tgz npm test
```

**Test a scaffold locally:**

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

## The AI drop-in (agent + MCP)

When MCP wiring is enabled (default; `--no-mcp` opts out), the scaffold writes:

- `.mcp.json` — server key `lando-ds` → `npx -y @lando-labs/lando-ds-mcp@latest`
- `.claude/agents/nextjs-lando-ds.md` — the DS-aware agent

The agent is **vendored** at `templates/_shared/agents/nextjs-lando-ds.md`, copied
from the DS repo (`~/lando-labs/lando-ds/.claude/agents/`). Two reasons it lives
under `_shared/` rather than inside a template:

1. It's framework-agnostic — the future Vite template gets it for free.
2. The repo `.npmignore` excludes `.claude/`, so an agent stored at
   `templates/<t>/.claude/agents/` would be **silently stripped** from the
   published tarball.

Syncing the vendored copy back to its source is not automated yet — re-copy it
when the DS repo's agent changes. The smoke test asserts the agent lands and that
`.mcp.json` resolves to a live server, so a broken drop-in fails CI.
