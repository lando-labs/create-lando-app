#!/usr/bin/env node
/**
 * create-lando-app — scaffolds a Next.js app pre-wired with the Lando Labs
 * Design System. Invoked via `npm create lando-app` or `npx create-lando-app`.
 *
 * Two ways in:
 *   mkdir my-app && cd my-app && npx create-lando-app   → scaffold in place
 *   npx create-lando-app my-app                         → scaffold into ./my-app
 *
 * The actual scaffolding lives in `./scaffold` so the consumer smoke test can
 * reuse the identical code path (see scripts/smoke.mjs).
 */
import { existsSync } from 'node:fs'
import { readdir } from 'node:fs/promises'
import { resolve, dirname, basename } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawn } from 'node:child_process'
import * as p from '@clack/prompts'
import { scaffold, DEV_PORT, AI_TOOLS, type AiTool } from './scaffold.js'

const here = dirname(fileURLToPath(import.meta.url))
const TEMPLATES_DIR = resolve(here, '..', 'templates')

type PM = 'npm' | 'pnpm' | 'yarn' | 'bun'

interface Options {
  /** Target directory argument. Undefined = scaffold in the current directory. */
  dir?: string
  /** Allow scaffolding into a directory that already has content. */
  force: boolean
  /** AI tools to wire. Defaults to all; empty means none. */
  ai: AiTool[]
  /** undefined = ask; true/false = decided by a flag. */
  install?: boolean
  help: boolean
}

const HELP = `
create-lando-app — scaffold a Next.js app wired to the Lando Labs Design System.

Usage
  npx create-lando-app            Scaffold into the current directory
  npx create-lando-app <dir>      Scaffold into <dir>

Options
  --ai <tools>   Which AI tools to wire, comma-separated: ${AI_TOOLS.join(', ')}.
                 Defaults to all of them. Use "--ai none" for no AI wiring.
                 e.g. --ai claude        --ai cursor,codex
  --force        Scaffold even if the target directory has files in it
  --no-mcp       Alias for --ai none
  --no-install   Skip installing dependencies
  -y, --yes      Accept defaults without prompting
  -h, --help     Show this message
`

/** Parse a `--ai` value into tools. Throws a usable message on a bad name. */
function parseAiList(raw: string): AiTool[] {
  const parts = raw
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
  if (parts.length === 0 || parts.includes('none')) return []
  const bad = parts.filter((p) => !AI_TOOLS.includes(p as AiTool))
  if (bad.length > 0) {
    console.error(
      `Unknown --ai value: ${bad.join(', ')}\nValid tools: ${AI_TOOLS.join(', ')} (or "none").`,
    )
    process.exit(1)
  }
  // De-dupe, keep a stable order.
  return AI_TOOLS.filter((t) => parts.includes(t))
}

function parseArgs(argv: string[]): Options {
  const opts: Options = { force: false, ai: [...AI_TOOLS], help: false }
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i] as string
    // `--ai=claude,cursor` and `--ai claude,cursor` are both accepted.
    if (arg === '--ai' || arg.startsWith('--ai=')) {
      const value = arg.startsWith('--ai=') ? arg.slice('--ai='.length) : argv[++i]
      if (value === undefined) {
        console.error(`--ai needs a value, e.g. --ai claude,cursor (or "none").`)
        process.exit(1)
      }
      opts.ai = parseAiList(value)
      continue
    }
    switch (arg) {
      case '-h':
      case '--help':
        opts.help = true
        break
      case '--force':
        opts.force = true
        break
      case '--no-mcp':
        opts.ai = []
        break
      case '--no-install':
        opts.install = false
        break
      case '-y':
      case '--yes':
        opts.install ??= true
        break
      default:
        if (arg.startsWith('-')) {
          console.error(`Unknown option: ${arg}`)
          console.error(HELP)
          process.exit(1)
        }
        opts.dir ??= arg
    }
  }
  return opts
}

function detectPM(): PM {
  const ua = process.env.npm_config_user_agent ?? ''
  if (ua.startsWith('pnpm')) return 'pnpm'
  if (ua.startsWith('yarn')) return 'yarn'
  if (ua.startsWith('bun')) return 'bun'
  return 'npm'
}

function installArgs(pm: PM): string[] {
  return pm === 'yarn' ? [] : ['install']
}

/**
 * Entries that don't count as "content" — a fresh `mkdir` + `git init` should
 * still be scaffoldable in place. Dotfiles (.git, .DS_Store, .vscode, …) are
 * ignored; anything else means the directory is really in use.
 */
async function blockingEntries(dir: string): Promise<string[]> {
  if (!existsSync(dir)) return []
  const entries = await readdir(dir)
  return entries.filter((e) => !e.startsWith('.'))
}

/**
 * Derive a usable npm package name. In-place scaffolds inherit the directory
 * name, which may not be a legal package name (spaces, capitals, …).
 */
function toPackageName(raw: string): string {
  const cleaned = raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^[-._]+|[-._]+$/g, '')
  return cleaned || 'my-lando-app'
}

function run(cmd: string, args: string[], cwd: string): Promise<number> {
  return new Promise((res) => {
    const child = spawn(cmd, args, {
      cwd,
      stdio: 'inherit',
      shell: process.platform === 'win32',
    })
    child.on('close', (code) => res(code ?? 1))
    child.on('error', () => res(1))
  })
}

async function main(): Promise<void> {
  const opts = parseArgs(process.argv.slice(2))
  if (opts.help) {
    console.log(HELP)
    return
  }

  console.log()
  p.intro('create-lando-app')

  const inPlace = opts.dir === undefined
  const targetDir = inPlace
    ? process.cwd()
    : resolve(process.cwd(), opts.dir as string)

  // Guard: refuse to scatter a template over an existing project by accident.
  const blockers = await blockingEntries(targetDir)
  if (blockers.length > 0 && !opts.force) {
    const where = inPlace ? 'The current directory' : `"${opts.dir}"`
    p.cancel(
      `${where} already has files (${blockers.slice(0, 3).join(', ')}${
        blockers.length > 3 ? `, +${blockers.length - 3} more` : ''
      }).\n  Scaffold into a new directory instead, or re-run with --force.`,
    )
    process.exit(1)
  }

  const projectName = toPackageName(
    inPlace ? basename(targetDir) : (opts.dir as string),
  )

  // Only one template for v1 (#368). Kept as a constant for forward-compat.
  const template = 'next-app-router'

  const pm = detectPM()
  let doInstall = opts.install
  if (doInstall === undefined) {
    const answer = await p.confirm({
      message: `Install dependencies with ${pm}?`,
      initialValue: true,
    })
    if (p.isCancel(answer)) return void p.cancel('Cancelled.')
    doInstall = answer
  }

  const s = p.spinner()
  s.start('Scaffolding project')

  await scaffold({
    templatesDir: TEMPLATES_DIR,
    template,
    targetDir,
    projectName,
    ai: opts.ai,
  })

  s.stop(
    opts.ai.length > 0
      ? `Project scaffolded · AI wired for ${opts.ai.join(', ')}`
      : 'Project scaffolded',
  )

  if (doInstall) {
    p.log.step(`Installing dependencies with ${pm}…`)
    const code = await run(pm, installArgs(pm), targetDir)
    if (code !== 0) {
      p.log.warn(
        'Dependency install failed. Review the project, then install manually.',
      )
    }
  }

  const devCmd = `${pm === 'npm' ? 'npm run dev' : `${pm} dev`}   → http://localhost:${DEV_PORT}`
  const installLine = doInstall ? null : pm === 'yarn' ? 'yarn' : `${pm} install`
  const steps = [
    inPlace ? null : `cd ${opts.dir}`,
    installLine,
    devCmd,
  ].filter(Boolean) as string[]

  p.note(steps.join('\n'), 'Next steps')
  p.outro('Built with the Lando Labs Design System')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
