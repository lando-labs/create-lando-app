#!/usr/bin/env node
/**
 * create-lando-app — scaffolds a Next.js app pre-wired with the Lando Labs
 * Design System. Invoked via `npm create lando-app` or `npx create-lando-app`.
 */
import { cp, readFile, writeFile, rename, readdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join, resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawn } from 'node:child_process'
import * as p from '@clack/prompts'

/**
 * The `@lando-labs/design-system` version the scaffolded template pins.
 * Bumped by the DS-publish drift PR (CI), which also re-runs the consumer
 * smoke test to guard the #462 cascade-layer contract.
 */
const DS_VERSION = '^0.50.0'
const MCP_PACKAGE = '@lando-labs/design-system-mcp@latest'

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

async function substitutePlaceholders(
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

  await cp(join(TEMPLATES_DIR, template), targetDir, { recursive: true })

  // npm strips a real `.gitignore` from the published tarball, so the template
  // stores it as `_gitignore`. Restore the dotfile name on copy.
  const storedGitignore = join(targetDir, '_gitignore')
  if (existsSync(storedGitignore)) {
    await rename(storedGitignore, join(targetDir, '.gitignore'))
  }

  await substitutePlaceholders(targetDir, {
    PROJECT_NAME: projectName,
    DS_VERSION,
  })

  if (wantMcp) {
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
