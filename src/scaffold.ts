/**
 * Shared scaffold logic for create-lando-app.
 *
 * Extracted from the CLI so the consumer smoke test (`scripts/smoke.mjs`) can
 * scaffold via the EXACT same code path the CLI uses — copy → `_gitignore`
 * rename → placeholder substitution → AI wiring. If these two ever drift, the
 * smoke test stops guarding what the CLI actually ships.
 */
import {
  cp,
  readFile,
  writeFile,
  rename,
  readdir,
  mkdir,
  rm,
} from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join } from 'node:path'

/**
 * The `@lando-labs/lando-ds` version the scaffolded template pins.
 * Bumped by the DS-publish drift PR (CI), which also re-runs the consumer
 * smoke test to guard the #462 cascade-layer contract.
 */
export const DS_VERSION = '^0.59.0'

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

/**
 * The AI brief and its bootstrap. These live in the template (they reference
 * Next-specific files and use placeholders), so they arrive with the normal copy
 * and get substituted — then get removed again when AI wiring is opted out of.
 *
 * `AGENTS.md` is canonical: Codex reads it natively, `CLAUDE.md` imports it, and
 * the Cursor rule points at it. One brief, three tools, no drift.
 */
const AI_DOCS = ['AGENTS.md', 'CLAUDE.md', 'START_HERE.md']

/** Cursor's project rule — `.cursor/rules/*.mdc`, `alwaysApply`, kept <200 words. */
const CURSOR_RULE = 'lando-ds.mdc'

/**
 * Dev-server port for the scaffolded app — 7711, not Next's default 3000, so a
 * new project doesn't collide with whatever else the user already has running.
 * Unregistered in /etc/services and well clear of the privileged range.
 *
 * Substituted as `{{DEV_PORT}}` so the template's scripts, its README, and the
 * CLI's next-steps line can't drift apart. Change it here and all three follow.
 *
 * Must stay >= 1024: ports below that are privileged and would make
 * `npm run dev` fail with EACCES unless run as root.
 */
export const DEV_PORT = 7711
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

  // The AI brief ships in the template, so it is placed (or removed) BEFORE
  // substitution — that way `{{PROJECT_NAME}}` / `{{DEV_PORT}}` resolve inside it.
  if (!mcp) {
    for (const doc of AI_DOCS) {
      await rm(join(targetDir, doc), { force: true })
    }
  }

  await substitutePlaceholders(targetDir, {
    PROJECT_NAME: projectName,
    DS_VERSION: dsVersion,
    DEV_PORT: String(DEV_PORT),
  })

  if (mcp) await wireAi(templatesDir, targetDir)
}

/**
 * Wire the project's AI across Claude Code, Cursor, and Codex.
 *
 * Every tool's MCP config is generated from the SAME {@link MCP_SERVER_KEY} /
 * {@link MCP_PACKAGE} constants, so the three can't drift. Paths and formats are
 * each tool's documented convention — a wrong one is silently inert, not an
 * error, so they are asserted by the smoke test.
 */
async function wireAi(templatesDir: string, targetDir: string): Promise<void> {
  const server = { command: 'npx', args: ['-y', MCP_PACKAGE] }

  // Claude Code — project MCP.
  await writeFile(
    join(targetDir, '.mcp.json'),
    JSON.stringify({ mcpServers: { [MCP_SERVER_KEY]: server } }, null, 2) + '\n',
  )

  // Cursor — same shape, its own path.
  const cursorDir = join(targetDir, '.cursor')
  await mkdir(join(cursorDir, 'rules'), { recursive: true })
  await writeFile(
    join(cursorDir, 'mcp.json'),
    JSON.stringify({ mcpServers: { [MCP_SERVER_KEY]: server } }, null, 2) + '\n',
  )

  // Cursor — project rule (thin pointer at AGENTS.md).
  const ruleSrc = join(templatesDir, SHARED_DIR, 'cursor', CURSOR_RULE)
  if (existsSync(ruleSrc)) {
    await cp(ruleSrc, join(cursorDir, 'rules', CURSOR_RULE))
  }

  // Codex — TOML, and the table key is `mcp_servers` (underscores). Project
  // scope requires the user to trust the project.
  const argsToml = server.args.map((a) => JSON.stringify(a)).join(', ')
  await mkdir(join(targetDir, '.codex'), { recursive: true })
  await writeFile(
    join(targetDir, '.codex', 'config.toml'),
    [
      '# Lando DS MCP server for this project.',
      '# Codex applies project-scoped config only in trusted projects; if the',
      '# server does not appear, trust this directory and restart Codex.',
      `[mcp_servers.${MCP_SERVER_KEY}]`,
      `command = ${JSON.stringify(server.command)}`,
      `args = [${argsToml}]`,
      '',
    ].join('\n'),
  )

  // Claude Code — the DS-aware agent, where it discovers subagents.
  const agentSrc = join(templatesDir, SHARED_DIR, 'agents', AGENT_FILE)
  if (existsSync(agentSrc)) {
    const agentDir = join(targetDir, '.claude', 'agents')
    await mkdir(agentDir, { recursive: true })
    await cp(agentSrc, join(agentDir, AGENT_FILE))
  }
}
