# {{PROJECT_NAME}}

A [Next.js](https://nextjs.org) app pre-wired with the
[Lando Labs Design System](https://github.com/lando-labs).

## Getting started

```bash
npm run dev
```

Open [http://localhost:{{DEV_PORT}}](http://localhost:{{DEV_PORT}}) and edit `app/page.tsx`.

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

The app is wrapped in `<ThemeProvider>` (see `app/providers.tsx`). Toggle or set
themes with the provider's hooks; the persisted choice is applied before paint.
