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

Next.js ^15.3, React ^19.1, `@lando-labs/lando-ds` (`{{DS_VERSION}}` →
`^0.57.0`), `lucide-react`, TypeScript. `transpilePackages: ['@lando-labs/lando-ds']`
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
npm test            # consumer smoke test: scaffold → install → build → #462 assert
```

`lint` and `e2e` are intentionally skipped (none configured for a CLI of this
size). `npm test` runs live against the published DS; it skips cleanly (exit 0)
only if the DS can't be resolved (offline) and no `LANDO_DS_TARBALL` is set.

## Sibling repos (not in this repo)

| Repo | Package | Relationship |
| --- | --- | --- |
| `lando-ds` | `@lando-labs/lando-ds` | Source of truth for the #462 layer contract. Public on npm (0.57.0). |
| `lando-ds-mcp` | `@lando-labs/lando-ds-mcp` | Conventions modeled on it; the MCP the `.mcp.json` drop-in wires up. Public on npm (4.0.0); server key `lando-ds`. |

## Update Log

- 2026-07-12 — Initial creation. CI confirmed green on first push to `main`.
