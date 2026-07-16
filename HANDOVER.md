# Handover — create-lando-app

**Written:** 2026-07-12 · **Origin:** research/scaffolding session in the
`lando-labs-design-system` repo. This doc exists so a fresh Claude Code session
started *in this repo* can continue without re-deriving the context.

---

## Where this came from

This repo was spun out of a planning session in the **design-system** repo
about issue **#368 — `[build] create-lando-app CLI scaffold`** (parent epic
**#298 — Arc 1: Public Substrate / Free Tier**).

The starting question was "we'll build on Next.js, but should we also support
Vite / vanilla React?" That research produced the decisions below, and we
scaffolded the repo skeleton here.

### The strategic framing (why this exists)

`create-lando-app` is the **acquisition funnel** for the whole monetization
stack. `npm create lando-app` → a working DS app in one command → optional MCP
config drop-in → the user's Claude Code / Cursor is now design-system-aware.
The hosted MCP is the eventual paid product; this CLI is the free on-ramp.
Without it, the paid arcs are harder to reach. It must therefore eliminate
every first-run papercut — above all the create-next-app cascade-layer conflict
(DS issue #462).

---

## Decisions made (locked)

1. **Standalone repo + published package**, sibling to the DS and MCP — *not* a
   pnpm-monorepo package. (The monorepo idea, DS issue #318, was closed; the org
   moved away from it. The MCP already lives in its own repo, `lando-ds-mcp`.)
   Conventions were modeled directly on `lando-ds-mcp`.

2. **Published `create-lando-app`, not a `degit` clone.** We considered a
   package-free `npx degit lando-labs/create-lando-app/templates/... my-app`.
   Rejected: it's a raw file copy with no prompts, no MCP wiring, no install, no
   `npm create lando-app` name — i.e. it throws away everything that makes this
   a funnel. Note: `npm create lando-app` and `npx create-lando-app` are the
   *same* command invoking this published package; "just make it npx" doesn't
   avoid publishing a package — npx runs published packages.

3. **Templates live in this repo.** Not pulled from the DS at build time.

4. **Drift handled by CI push, not pull.** When the DS publishes, it dispatches
   to this repo, which opens a PR to bump `DS_VERSION` and re-run a consumer
   smoke test. (Same pattern being designed for the MCP repo.) See CLAUDE.md →
   "Drift mechanism".

5. **v1 = Next.js App Router only.** Vite (SPA) template planned as an explicit
   second-class "works in any React app" proof — but honestly framed, since the
   DS's differentiators (RSC-safe leaves, server-injected anti-flash theme) only
   light up under a server render. Standalone "vanilla React" was dropped: CRA
   is dead, Vite *is* the no-meta-framework React path.

---

## What's built and verified (this session)

Repo skeleton at `~/lando-labs/create-lando-app`, all locally verified:

- **CLI** (`src/index.ts`, `@clack/prompts`): prompts for target dir → offers
  MCP wiring → detects package manager → optionally installs → prints next
  steps. `DS_VERSION` constant at the top is what the drift PR bumps.
- **Next template** (`templates/next-app-router/`): the #462-correct golden path
  (layer-order primer → `@layer app-reset` reset → DS `/styles`), **plus** an
  upgrade over the DS's raw example — `themeScript()` injected into the RSC
  `<head>` for anti-flash theming, and deep RSC-safe component imports in
  `page.tsx`.
- **Package/CI** modeled on `lando-ds-mcp`: Apache-2.0, `bin`, tsc build,
  `files` allowlist, `publishConfig` public+provenance, `test.yml` + `publish.yml`.

Verification run:
- `npm install` / `typecheck` / `build` → all green; shebang preserved,
  `dist/index.js` executable.
- `npm pack --dry-run` → ships `dist/` + `templates/` + license/docs only;
  `src/` excluded.
- End-to-end scaffold sim → clean project: `_gitignore`→`.gitignore` rename
  works, `{{PROJECT_NAME}}`/`{{DS_VERSION}}` fully substituted, `.mcp.json`
  correct, zero stray placeholder tokens.

---

## Known gaps / blockers (not oversights)

1. **A1 gate — DS isn't on public npm yet.** It's still on private GitHub
   Packages; public launch has a go-live runbook in the DS repo
   (`reference/public-launch/go-live-checklist.md`). Until then, a scaffolded
   app's `npm install` won't resolve `@lando-labs/lando-ds` from public
   npm. This is exactly the dependency #368 names ("after A1 + A6").
2. **`npm test` is a placeholder.** The real consumer smoke test needs the DS on
   public npm too, so it lands with A1.
3. **DS→CLI dispatch not wired.** The `repository_dispatch` step in the DS's
   `publish.yml` doesn't exist yet.

---

## Suggested next steps (when you pick this back up)

- **Not blocked by A1:**
  - `git init` + first commit; create the GitHub repo `lando-labs/create-lando-app`
    (outward-facing — confirm with Landon before creating/pushing).
  - Draft `scripts/smoke.ts` and the DS→CLI dispatch workflow as **dormant**
    scaffolding (like the DS's Changesets pipeline was pre-launch), ready to
    switch on at A1.
  - Add the Vite (SPA) template if desired — remember it needs the
    `themeScript()` output hand-inlined into `index.html` (no server head) and
    care around bundler CSS-import ordering.
- **Blocked on A1 (DS public npm):**
  - Flip `npm test` to the real scaffold→build→assert-spacing smoke test.
  - End-to-end validation: actually `npm create lando-app`, run `npm run dev`,
    confirm components render with correct spacing and no theme flash.
- **Bookkeeping:** update DS issue #368 with the standalone / Next-only /
  auto-PR-drift decisions and this progress.

---

## Pointers

- Template contract details & drift mechanism: `CLAUDE.md` (this repo).
- The DS golden-path reference this template mirrors:
  `~/lando-labs/lando-labs-design-system/examples/next-app-router/` and
  `reference/css-layers.md`.
- Repo conventions cribbed from: `~/lando-labs/lando-ds-mcp/`.
- Issues (in the design-system repo): #368 (this CLI), #298 (Arc 1 epic),
  #462 (the reset/layer conflict), #318 (closed monorepo idea).
