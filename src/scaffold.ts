/**
 * Shared scaffold logic for create-lando-app.
 *
 * Extracted from the CLI so the consumer smoke test (`scripts/smoke.ts`) can
 * scaffold via the EXACT same code path the CLI uses — copy → `_gitignore`
 * rename → placeholder substitution → optional `.mcp.json`. If these two ever
 * drift, the smoke test stops guarding what the CLI actually ships.
 */
import { cp, readFile, writeFile, rename, readdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join } from 'node:path'

/**
 * The `@lando-labs/lando-ds` version the scaffolded template pins.
 * Bumped by the DS-publish drift PR (CI), which also re-runs the consumer
 * smoke test to guard the #462 cascade-layer contract.
 */
export const DS_VERSION = '^0.57.0'

/**
 * The Lando DS MCP server package the `.mcp.json` drop-in points at.
 *
 * TODO(#16): not yet published to npm. The MCP is mid-rename alongside the DS
 * (locally still `@lando-labs/design-system-mcp`), so this name is provisional
 * until the MCP publishes. The scaffolded `.mcp.json` won't resolve until then.
 */
export const MCP_PACKAGE = '@lando-labs/design-system-mcp@latest'

/** Recursively replace `{{KEY}}` tokens in every text file under `dir`. */
export async function substitutePlaceholders(
  dir: string,
  vars: Record<string, string>,
): Promise<void> {
  const entries = await readdir(dir, { withFileTypes: true })
  for (const entry of entries) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      await substitutePlaceholders(full, vars)
      continue
    }
    const content = await readFile(full, 'utf8')
    if (!content.includes('{{')) continue
    let next = content
    for (const [key, value] of Object.entries(vars)) {
      next = next.replaceAll(`{{${key}}}`, value)
    }
    if (next !== content) await writeFile(full, next)
  }
}

export interface ScaffoldOptions {
  /** Absolute path to the `templates/` directory. */
  templatesDir: string
  /** Template name, e.g. `next-app-router`. */
  template: string
  /** Absolute path the project is created at. */
  targetDir: string
  /** Substituted for `{{PROJECT_NAME}}`. */
  projectName: string
  /**
   * Substituted for `{{DS_VERSION}}`. Defaults to {@link DS_VERSION}. The smoke
   * test overrides this with a `file:` tarball spec so it can build against a
   * local DS `npm pack` before the DS is on public npm (the A1 gate).
   */
  dsVersion?: string
  /** When true, write a `.mcp.json` wiring the Lando DS MCP server. */
  mcp?: boolean
}

/**
 * Materialize a template into `targetDir`: copy files, restore the `.gitignore`
 * dotfile name (npm strips real `.gitignore` from tarballs, so it ships as
 * `_gitignore`), substitute placeholders, and optionally drop in `.mcp.json`.
 */
export async function scaffold(opts: ScaffoldOptions): Promise<void> {
  const {
    templatesDir,
    template,
    targetDir,
    projectName,
    dsVersion = DS_VERSION,
    mcp = false,
  } = opts

  await cp(join(templatesDir, template), targetDir, { recursive: true })

  // npm strips a real `.gitignore` from the published tarball, so the template
  // stores it as `_gitignore`. Restore the dotfile name on copy.
  const storedGitignore = join(targetDir, '_gitignore')
  if (existsSync(storedGitignore)) {
    await rename(storedGitignore, join(targetDir, '.gitignore'))
  }

  await substitutePlaceholders(targetDir, {
    PROJECT_NAME: projectName,
    DS_VERSION: dsVersion,
  })

  if (mcp) {
    const mcpConfig = {
      mcpServers: {
        'lando-design-system': { command: 'npx', args: ['-y', MCP_PACKAGE] },
      },
    }
    await writeFile(
      join(targetDir, '.mcp.json'),
      JSON.stringify(mcpConfig, null, 2) + '\n',
    )
  }
}
