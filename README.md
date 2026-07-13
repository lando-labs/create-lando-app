# create-lando-app

Scaffold a [Next.js](https://nextjs.org) app pre-wired with the
[Lando Labs Design System](https://github.com/lando-labs).

```bash
npm create lando-app@latest
# or
npx create-lando-app
```

`npm create lando-app` and `npx create-lando-app` are the same command — both
fetch and run this package.

## What you get

A Next.js App Router project with:

- `@lando-labs/design-system` installed and imported
- The **golden-path CSS order** that keeps a CSS reset from zeroing out DS
  component spacing (issue #462)
- **Anti-flash** theme application via `themeScript()` in the server `<head>`
- An optional **`.mcp.json`** wiring Claude Code / Cursor to the Lando DS MCP
  server for design-system-aware codegen

## Templates

| Template          | Status       |
| ----------------- | ------------ |
| `next-app-router` | ✅ available  |
| `vite-react`      | planned      |

## Development

```bash
npm install
npm run build   # compiles src/ → dist/
npm run dev     # tsc --watch
```

Templates live in `templates/`. The `@lando-labs/design-system` version the
templates pin is the `DS_VERSION` constant in `src/scaffold.ts`. A CI job opens a
PR to bump it — and re-run the consumer smoke test — whenever the DS publishes
a new release, so the scaffold never drifts from the DS's cascade-layer
contract.

## License

Apache-2.0 · Copyright 2026 Lando Labs
