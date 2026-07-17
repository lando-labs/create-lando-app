/**
 * Shared scaffold logic for create-lando-app.
 *
 * Extracted from the CLI so the consumer smoke test (`scripts/smoke.mjs`) can
 * scaffold via the EXACT same code path the CLI uses — copy → `_gitignore`
 * rename → placeholder substitution → AI wiring. If these two ever drift, the
 * smoke test stops guarding what the CLI actually ships.
 */
import { cp, readFile, writeFile, rename, readdir, mkdir } from 'node:fs/promises'
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
 * `@latest` is deliberate: it stops `npx` from reusing a stale cached copy.
 */
export const MCP_PACKAGE = '@lando-labs/lando-ds-mcp@latest'

/**
 * The mcpServers key the DS MCP documents for client configs. This is what
 * namespaces the tools the agent sees (`mcp__lando-ds__*`), so it must match
 * the MCP's own README.
 */
export const MCP_SERVER_KEY = 'lando-ds'

/**
 * The DS-aware agent dropped into the scaffolded project.
 *
 * Vendored from the design-system repo (`.claude/agents/nextjs-lando-ds.md`).
 * It lives under `templates/_shared/` rather than inside a template because it
 * is framework-agnostic — and because the repo `.npmignore` excludes `.claude/`,
 * so an agent stored at `templates/<t>/.claude/agents/` would be silently
 * stripped from the published tarball.
 */
export const AGENT_FILE = 'nextjs-lando-ds.md'
const SHARED_DIR = '_shared'

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
   * test overrides this with a `file:` tarball spec to build against an
   * unreleased local DS `npm pack`.
   */
  dsVersion?: string
  /**
   * Wire the project's AI: write `.mcp.json` for the Lando DS MCP server and
   * drop the `nextjs-lando-ds` agent into `.claude/agents/`.
   *
   * These travel together on purpose — the agent's whole method is querying the
   * MCP, so it is inert without it. `--no-mcp` opts out of both.
   */
  mcp?: boolean
}

/**
 * Materialize a template into `targetDir`: copy files, restore the `.gitignore`
 * dotfile name (npm strips real `.gitignore` from tarballs, so it ships as
 * `_gitignore`), substitute placeholders, and wire the AI (`.mcp.json` + agent).
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
        [MCP_SERVER_KEY]: { command: 'npx', args: ['-y', MCP_PACKAGE] },
      },
    }
    await writeFile(
      join(targetDir, '.mcp.json'),
      JSON.stringify(mcpConfig, null, 2) + '\n',
    )

    // Drop the DS-aware agent where Claude Code discovers it.
    const agentSrc = join(templatesDir, SHARED_DIR, 'agents', AGENT_FILE)
    if (existsSync(agentSrc)) {
      const agentDir = join(targetDir, '.claude', 'agents')
      await mkdir(agentDir, { recursive: true })
      await cp(agentSrc, join(agentDir, AGENT_FILE))
    }
  }
}
