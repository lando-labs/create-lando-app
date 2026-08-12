# {{PROJECT_NAME}}

A [Next.js](https://nextjs.org) app pre-wired with the
[Lando Labs Design System](https://github.com/lando-labs).

## Getting started

```bash
npm run dev
```

Open [http://localhost:{{DEV_PORT}}](http://localhost:{{DEV_PORT}}). The page you
land on hands off to your AI: open this folder in Claude Code or Cursor, pick a
brand colour, and let your AI build your first screen — then replace
`app/page.tsx` with it. (With the MCP wiring, on by default, your AI is
design-system-aware out of the box.)

Prefer to drive yourself? `app/page.tsx` is a getting-started page, not
furniture — replace it with your app. The design system lives in
`@lando-labs/lando-ds`, and `AGENTS.md` is the brief your AI reads.

### Changing the port

This app runs on **{{DEV_PORT}}** instead of Next's default 3000, so it won't
fight whatever else you have running. To use a different port, edit the `dev`
(and `start`) scripts in **`package.json`**:

```jsonc
"scripts": {
  "dev": "next dev -p {{DEV_PORT}}",     // ← change the number here
  "start": "next start -p {{DEV_PORT}}"  // ← and here, to match
}
```

Or override it for a single run without editing anything:

```bash
npm run dev -- -p 3000
```

Pick a port **1024 or higher** — lower ones are privileged and will fail with
`EACCES` unless you run as root.

## What's wired up

- **`@lando-labs/lando-ds`** — components, design tokens, dark mode.
- **Golden-path CSS order** (`app/layout.tsx`) — the cascade-layer primer plus
  an `@layer app-reset` reset, so a CSS reset never zeroes out DS component
  spacing (issue #462).
- **Anti-flash theming** — `themeScript()` injected into the server `<head>`
  applies the persisted theme before first paint.
- **`.mcp.json`** *(if you opted in)* — points Claude Code / Cursor at the Lando
  DS MCP server for design-system-aware codegen.

## Theming

The app is wrapped in `<ThemeProvider>` (see `app/providers.tsx`). Pick a brand
colour on the getting-started page to generate a DS `ProductTheme`, save it as
`app/brand-theme.ts`, and pass it as `defaultProductTheme` — the DS derives every
ramp, hover/active state and surface from it. The persisted mode is applied
before paint (anti-flash).
