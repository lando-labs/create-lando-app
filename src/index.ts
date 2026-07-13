#!/usr/bin/env node
/**
 * create-lando-app — scaffolds a Next.js app pre-wired with the Lando Labs
 * Design System. Invoked via `npm create lando-app` or `npx create-lando-app`.
 *
 * The actual scaffolding lives in `./scaffold` so the consumer smoke test can
 * reuse the identical code path (see scripts/smoke.ts).
 */
import { existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawn } from 'node:child_process'
import * as p from '@clack/prompts'
import { scaffold } from './scaffold.js'

const here = dirname(fileURLToPath(import.meta.url))
const TEMPLATES_DIR = resolve(here, '..', 'templates')

type PM = 'npm' | 'pnpm' | 'yarn' | 'bun'

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
  console.log()
  p.intro('create-lando-app')

  const dirInput = await p.text({
    message: 'Where should we create your app?',
    placeholder: 'my-lando-app',
    defaultValue: 'my-lando-app',
    validate(value) {
      const name = value || 'my-lando-app'
      if (existsSync(resolve(process.cwd(), name))) {
        return `Directory "${name}" already exists.`
      }
      return undefined
    },
  })
  if (p.isCancel(dirInput)) return void p.cancel('Cancelled.')
  const projectName = dirInput || 'my-lando-app'

  // Only one template for v1 (#368). Kept as a constant for forward-compat.
  const template = 'next-app-router'

  const wantMcp = await p.confirm({
    message: 'Wire up the Lando DS MCP server for Claude Code / Cursor?',
    initialValue: true,
  })
  if (p.isCancel(wantMcp)) return void p.cancel('Cancelled.')

  const pm = detectPM()
  const doInstall = await p.confirm({
    message: `Install dependencies with ${pm}?`,
    initialValue: true,
  })
  if (p.isCancel(doInstall)) return void p.cancel('Cancelled.')

  const targetDir = resolve(process.cwd(), projectName)
  const s = p.spinner()
  s.start('Scaffolding project')

  await scaffold({
    templatesDir: TEMPLATES_DIR,
    template,
    targetDir,
    projectName,
    mcp: wantMcp === true,
  })

  s.stop('Project scaffolded')

  if (doInstall) {
    p.log.step(`Installing dependencies with ${pm}…`)
    const code = await run(pm, installArgs(pm), targetDir)
    if (code !== 0) {
      p.log.warn(
        'Dependency install failed. Review the project, then install manually.',
      )
    }
  }

  const devCmd = pm === 'npm' ? 'npm run dev' : `${pm} dev`
  const installLine = doInstall
    ? null
    : pm === 'yarn'
      ? 'yarn'
      : `${pm} install`
  p.note(
    [`cd ${projectName}`, installLine, devCmd].filter(Boolean).join('\n'),
    'Next steps',
  )
  p.outro('Built with the Lando Labs Design System')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
