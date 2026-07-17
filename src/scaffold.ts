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

/** AI tools the scaffold knows how to wire. */
export const AI_TOOLS = ['claude', 'cursor', 'codex'] as const
export type AiTool = (typeof AI_TOOLS)[number]

/**
 * The shared brief and its bootstrap — written for ANY tool selection.
 *
 * `AGENTS.md` is canonical: Codex reads it natively, `CLAUDE.md` imports it, and
 * the Cursor rule points at it. One brief, three readers, no drift. Only the
 * pointers are per-tool.
 *
 * These live in the template (they reference Next-specific files and use
 * placeholders) so they arrive with the normal copy and get substituted — then
 * get removed again for the tools that weren't asked for.
 */
const SHARED_AI_DOCS = ['AGENTS.md', 'START_HERE.md']

/** Claude Code's pointer. Removed unless `claude` is selected. */
const CLAUDE_DOC = 'CLAUDE.md'

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
   * Which AI tools to wire. Each gets its own MCP config and pointer, in its own
   * documented convention; all of them share one `AGENTS.md`.
   *
   * An empty array writes no AI files at all. Defaults to every tool.
   */
  ai?: readonly AiTool[]
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
    ai = AI_TOOLS,
  } = opts
  const wants = (tool: AiTool) => ai.includes(tool)
  const anyAi = ai.length > 0

  await cp(join(templatesDir, template), targetDir, { recursive: true })

  // npm strips a real `.gitignore` from the published tarball, so the template
  // stores it as `_gitignore`. Restore the dotfile name on copy.
  const storedGitignore = join(targetDir, '_gitignore')
  if (existsSync(storedGitignore)) {
    await rename(storedGitignore, join(targetDir, '.gitignore'))
  }

  // The AI docs ship in the template, so they are pruned BEFORE substitution —
  // that way `{{PROJECT_NAME}}` / `{{DEV_PORT}}` resolve in whatever remains.
  const unwanted = [
    ...(anyAi ? [] : SHARED_AI_DOCS),
    ...(wants('claude') ? [] : [CLAUDE_DOC]),
  ]
  for (const doc of unwanted) {
    await rm(join(targetDir, doc), { force: true })
  }

  await substitutePlaceholders(targetDir, {
    PROJECT_NAME: projectName,
    DS_VERSION: dsVersion,
    DEV_PORT: String(DEV_PORT),
    // The brief must not promise an agent that wasn't installed: the subagent is
    // a Claude Code feature, so this line only survives when claude is wired.
    AGENT_NOTE: wants('claude')
      ? `There is a \`nextjs-lando-ds\` agent set up for this project (Claude Code:\n\`.claude/agents/\`). **Use it for UI work** — it knows the DS's conventions.`
      : `Ask the MCP before you build. It is the source of truth for what's\ninstalled here.`,
  })

  if (anyAi) await wireAi(templatesDir, targetDir, ai)
}

/**
 * Wire the project's AI across Claude Code, Cursor, and Codex.
 *
 * Every tool's MCP config is generated from the SAME {@link MCP_SERVER_KEY} /
 * {@link MCP_PACKAGE} constants, so the three can't drift. Paths and formats are
 * each tool's documented convention — a wrong one is silently inert, not an
 * error, so they are asserted by the smoke test.
 */
async function wireAi(
  templatesDir: string,
  targetDir: string,
  ai: readonly AiTool[],
): Promise<void> {
  const server = { command: 'npx', args: ['-y', MCP_PACKAGE] }
  const mcpJson =
    JSON.stringify({ mcpServers: { [MCP_SERVER_KEY]: server } }, null, 2) + '\n'

  if (ai.includes('claude')) {
    // Project MCP.
    await writeFile(join(targetDir, '.mcp.json'), mcpJson)

    // The DS-aware agent, where Claude Code discovers subagents.
    const agentSrc = join(templatesDir, SHARED_DIR, 'agents', AGENT_FILE)
    if (existsSync(agentSrc)) {
      const agentDir = join(targetDir, '.claude', 'agents')
      await mkdir(agentDir, { recursive: true })
      await cp(agentSrc, join(agentDir, AGENT_FILE))
    }
  }

  if (ai.includes('cursor')) {
    // Same MCP shape, Cursor's own path.
    const cursorDir = join(targetDir, '.cursor')
    await mkdir(join(cursorDir, 'rules'), { recursive: true })
    await writeFile(join(cursorDir, 'mcp.json'), mcpJson)

    // Project rule (thin pointer at AGENTS.md).
    const ruleSrc = join(templatesDir, SHARED_DIR, 'cursor', CURSOR_RULE)
    if (existsSync(ruleSrc)) {
      await cp(ruleSrc, join(cursorDir, 'rules', CURSOR_RULE))
    }
  }

  if (ai.includes('codex')) {
    // TOML, and the table key is `mcp_servers` (underscores). Project scope
    // requires the user to trust the project.
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
  }
}
