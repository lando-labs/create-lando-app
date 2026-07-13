# {{PROJECT_NAME}}

A [Next.js](https://nextjs.org) app pre-wired with the
[Lando Labs Design System](https://github.com/lando-labs).

## Getting started

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and edit `app/page.tsx`.

## What's wired up

- **`@lando-labs/design-system`** — components, design tokens, dark mode.
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
