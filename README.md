# create-lando-app

Scaffold a [Next.js](https://nextjs.org) app pre-wired with the
[Lando Labs Design System](https://github.com/lando-labs).

Two commands and you're building:

```bash
mkdir my-app && cd my-app
npx @lando-labs/create-lando-app
```

Prefer to name it in one line? Pass a directory instead:

```bash
npx @lando-labs/create-lando-app my-app
```

`npm create @lando-labs/lando-app` and `npx @lando-labs/create-lando-app` are the
same command — both fetch and run this package.

### Options

| Flag | What it does |
| --- | --- |
| `--force` | Scaffold even if the target directory already has files |
| `--no-mcp` | Skip the MCP client config drop-in |
| `--no-install` | Skip installing dependencies |
| `-y`, `--yes` | Accept defaults without prompting |
| `-h`, `--help` | Show usage |

Running with no directory scaffolds **in place**. A fresh `mkdir` (even after
`git init`) counts as empty — dotfiles are ignored.

## What you get

A Next.js App Router project with:

- `@lando-labs/lando-ds` installed and imported
- The **golden-path CSS order** that keeps a CSS reset from zeroing out DS
  component spacing (issue #462)
- **Anti-flash** theme application via `themeScript()` in the server `<head>`
- A **`.mcp.json`** wiring Claude Code / Cursor to the Lando DS MCP server for
  design-system-aware codegen
- The **`nextjs-lando-ds` agent** at `.claude/agents/`, ready to build UI by
  querying the design system through the MCP

The MCP config and the agent are on by default and travel together — the agent's
whole method is querying the MCP, so it's inert without it. `--no-mcp` skips both.

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

Templates live in `templates/`. The `@lando-labs/lando-ds` version the
templates pin is the `DS_VERSION` constant in `src/scaffold.ts`. A CI job opens a
PR to bump it — and re-run the consumer smoke test — whenever the DS publishes
a new release, so the scaffold never drifts from the DS's cascade-layer
contract.

## License

Apache-2.0 · Copyright 2026 Lando Labs
