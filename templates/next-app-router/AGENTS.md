# {{PROJECT_NAME}} — instructions for AI assistants

This is the brief for any AI working in this project. It is instructions, not
documentation. Read it before you write code.

> **First session only:** if `START_HERE.md` exists in this directory, follow it
> now, then delete it. It is a one-time bootstrap; this file is the permanent one.

## What this project is

A Next.js 15 App Router app (React 19, TypeScript strict) built on the **Lando
Labs Design System** (`@lando-labs/lando-ds`). The dev server runs on
**port {{DEV_PORT}}** (`npm run dev`).

## Use the design system, don't rebuild it

The DS ships 100+ components, design tokens, theming, and icons. Before you build
any UI:

1. **Ask the MCP.** A `lando-ds` MCP server is wired into this project. Use it to
   list components, read their current props, and get composition hints.
2. **Don't assume an API from memory.** Component props change between versions;
   the MCP is the source of truth for what's installed *here*, right now.
3. **Don't reinvent a component the DS already has.**

There is a `nextjs-lando-ds` agent set up for this project (Claude Code:
`.claude/agents/`). **Use it for UI work** — it knows the DS's conventions.

## Hard rules

- **No Tailwind, no utility-class CSS.** All styling comes from DS components and
  design tokens. Never add a `cn()` helper or utility classes.
- **No hardcoded colors, spacing, or type.** Use design tokens
  (`var(--color-…)`, `var(--spacing-…)`). A hex code in this codebase is a bug.
- **Server Components by default.** Add `'use client'` only for interactivity.
  Import DS leaves from their per-module subpaths so server components stay lean:
  ```tsx
  import { Card } from '@lando-labs/lando-ds/components/Card/Card'
  import { CardBody } from '@lando-labs/lando-ds/components/Card/CardBody'
  ```

## Theme: read the file, don't guess

**This app's theme lives in `app/providers.tsx`.** Its `<ThemeProvider>` takes a
DS `ProductTheme` via `defaultProductTheme`. If a brand theme has been set up it's
in **`app/brand-theme.ts`** — read that for the actual colours. The theme carries
only base role colours (`primary` / `secondary` / `accent`, the semantics, and
optional mode-aware surfaces); **the DS derives every ramp, hover/active state and
surface from them.** `error` is deliberately never overridden — danger stays the
DS default red.

- **Never hand-write a `--color-*` value or a `color-mix()`.** Set the base colour
  in the `ProductTheme` and let the DS derive the rest (that's what `ThemeProvider`
  and `ThemeScope` are for).
- To change the palette, regenerate it on the getting-started page (or edit
  `app/brand-theme.ts`) and make sure it's passed as `defaultProductTheme`.
- Never mirror the theme's *values* into your own notes. Read the file each time.

## Don't break the CSS wiring

`app/layout.tsx` imports CSS in a deliberate order, and `app/globals.css` puts the
app reset in `@layer app-reset` — the lowest cascade layer. This is what stops a
reset from zeroing out DS component spacing.

- Never add an **unlayered** global reset.
- Put deliberate overrides in `@layer app`.
- Don't reorder the imports in `layout.tsx` or move `themeScript()` out of `<head>`.

The reasoning is commented in `app/globals.css` if you need it.

## Where things are

| File | What it owns |
| --- | --- |
| `app/page.tsx` | The getting-started page. Replace it — that's the point. |
| `app/layout.tsx` | HTML shell, CSS import order, anti-flash theme script |
| `app/providers.tsx` | **The theme** — `<ThemeProvider>` + your `ProductTheme` (`app/brand-theme.ts`) |
| `app/globals.css` | Your CSS. App reset lives in `@layer app-reset` (the #462 wiring). |
| `AGENTS.md` | This brief |

## Reference (not instructions)

The DS ships machine-readable docs you can pull when you need detail:
`@lando-labs/lando-ds/llms.txt` and `@lando-labs/lando-ds/meta`. Prefer the MCP
for component questions — it's live.

## Out of scope

Backend, database, and auth decisions aren't covered here. Ask the human.
