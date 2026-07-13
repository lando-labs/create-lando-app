# Tech Architecture — create-lando-app

> Created: 2026-07-12 · Source: package.json, tsconfig.json, workflows

## Stack

| Layer | Choice | Notes |
| --- | --- | --- |
| Language | TypeScript 5.7, ESM (`"type": "module"`) | Compiles `src/` → `dist/` via `tsc`. |
| Runtime | Node ≥ 20 | `bin` entry `dist/index.js` (shebang + `chmod +x`). |
| CLI prompts | `@clack/prompts` ^0.7 | Only runtime dependency. |
| Build | `tsc` | `npm run build` = `tsc && chmod +x dist/index.js`. |
| Publish | public npm, SLSA provenance | On `v*.*.*` tag push. Tag must match `package.json`. |
| License | Apache-2.0 + NOTICE | Inherited from `lando-ds-mcp`. |

## Scaffolded app stack (the template ships these)

Next.js ^15.3, React ^19.1, `@lando-labs/design-system` (`{{DS_VERSION}}` →
`^0.50.0`), `lucide-react`, TypeScript. `transpilePackages: ['@lando-labs/design-system']`
in `next.config.ts` enables RSC boundary checking for deep component imports.

## Package shipping contract

`files` allowlist ships only: `dist/`, `templates/`, `README.md`, `LICENSE`,
`NOTICE`. `.npmignore` is belt-and-suspenders. `src/` is NOT shipped. Verified
via `npm pack --dry-run`.

## CI / CD

- **`test.yml`** — on push to `main` + PRs: `npm ci` → typecheck → build → test.
  Status check name: `Typecheck / Build / Test`. **Confirmed green on first push.**
- **`publish.yml`** — on `v*.*.*` tag: verify tag==version → build → test → pack
  check → `npm publish --provenance` → GitHub Release from annotated tag.
  Needs `NPM_TOKEN` secret (not yet added — owner-supplied).

## Verification commands (used at close-out — see sprint.config.json)

```
npm run typecheck   # tsc --noEmit
npm run build       # tsc → dist/
npm test            # placeholder until smoke test lands (skip=lint,e2e)
```

`lint` and `e2e` are intentionally skipped (none configured for a CLI of this
size). `blockOnMissing: false` because `npm test` is a placeholder pre-A1.

## Sibling repos (not in this repo)

| Repo | Package | Relationship |
| --- | --- | --- |
| `lando-labs-design-system` | `@lando-labs/design-system` | Source of truth for the #462 layer contract; the A1-gate owner. |
| `lando-ds-mcp` | `@lando-labs/design-system-mcp` | Conventions modeled on it; the MCP the `.mcp.json` drop-in wires up. |

## Update Log

- 2026-07-12 — Initial creation. CI confirmed green on first push to `main`.
