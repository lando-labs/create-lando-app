#!/usr/bin/env node
/**
 * Consumer smoke test — the real guard for the #462 cascade-layer contract.
 *
 * A plain `DS_VERSION` bump can't catch a layer-contract break; only a
 * scaffold → install → build → assert can. This does exactly that, reusing the
 * SAME scaffold code path the CLI ships (`dist/scaffold.js`).
 *
 * `@lando-labs/lando-ds` is published, so this normally runs LIVE against public
 * npm. If the DS can't be resolved (offline CI, registry outage) and no local
 * tarball is provided, it SKIPS cleanly and exits 0 rather than failing the build
 * on an unrelated network problem.
 *
 * Written as plain ESM (not .ts) so it runs on the CI's Node 20 with zero extra
 * toolchain, and so it exercises the compiled artifact the package actually ships.
 *
 * DS source resolution (in priority order):
 *   1. LANDO_DS_TARBALL=/abs/path/to/lando-labs-lando-ds-x.y.z.tgz
 *      → installs via `file:` spec (test against an unreleased local DS build).
 *   2. Otherwise resolve @lando-labs/lando-ds from public npm.
 */
import { mkdtemp, rm, readFile, access } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync, spawn } from 'node:child_process'

const here = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(here, '..')
const TEMPLATES_DIR = join(ROOT, 'templates')

/** Generous: the first run has to `npx` the MCP down from the registry. */
const MCP_TIMEOUT_MS = 120_000

function log(msg) {
  console.log(`  ${msg}`)
}
function skip(reason) {
  console.log(`\n⏭  SMOKE TEST SKIPPED: ${reason}`)
  console.log('   The #462 guard needs an installable DS. To run against a local build:')
  console.log('     LANDO_DS_TARBALL=/path/to/lando-ds.tgz npm test')
  process.exit(0)
}
function fail(msg) {
  console.error(`\n✖ SMOKE TEST FAILED: ${msg}`)
  process.exit(1)
}

// The compiled shared scaffold module (built by `pretest` → `npm run build`).
let scaffold, DS_VERSION
try {
  ;({ scaffold, DS_VERSION } = await import(join(ROOT, 'dist', 'scaffold.js')))
} catch {
  fail('dist/scaffold.js not found — run `npm run build` first.')
}

// ---- Resolve the DS source ----
let dsSpec
const tarball = process.env.LANDO_DS_TARBALL
if (tarball) {
  try {
    await access(tarball)
  } catch {
    skip(`LANDO_DS_TARBALL set but not found: ${tarball}`)
  }
  dsSpec = `file:${resolve(tarball)}`
  log(`DS source: local tarball (${dsSpec})`)
} else {
  const probe = spawnSync(
    'npm',
    ['view', '@lando-labs/lando-ds', 'version'],
    { encoding: 'utf8' },
  )
  if (probe.status !== 0) {
    skip('@lando-labs/lando-ds could not be resolved from npm (offline?) and no LANDO_DS_TARBALL set')
  }
  dsSpec = DS_VERSION
  log(`DS source: public npm (${dsSpec})`)
}

// ---- Live path: scaffold → install → build → assert ----
const workdir = await mkdtemp(join(tmpdir(), 'cla-smoke-'))
const projectDir = join(workdir, 'smoke-app')

try {
  log('Scaffolding via dist/scaffold.js …')
  await scaffold({
    templatesDir: TEMPLATES_DIR,
    template: 'next-app-router',
    targetDir: projectDir,
    projectName: 'smoke-app',
    dsVersion: dsSpec,
    mcp: true, // exercise the full AI wiring (.mcp.json + agent drop-in)
  })

  log('npm install …')
  const install = spawnSync(
    'npm',
    ['install', '--no-audit', '--no-fund'],
    { cwd: projectDir, stdio: 'inherit' },
  )
  if (install.status !== 0) fail('npm install failed in the scaffolded app')

  // `next build` succeeding is itself a strong contract check: it proves the
  // template's imports — `@lando-labs/lando-ds/layer-order.css`,
  // `/styles`, `themeScript()`, and the deep component subpaths — all still
  // resolve and compile against this DS version. An entry-point rename/removal
  // breaks the build here.
  log('next build …')
  const build = spawnSync(
    'npm',
    ['run', 'build'],
    { cwd: projectDir, stdio: 'inherit' },
  )
  if (build.status !== 0) fail('next build failed — template no longer compiles against this DS')

  // The subtle break build success can't catch: the DS keeping layer-order.css
  // but changing the LAYER ORDER inside it (so app-reset is no longer lowest).
  // Assert app-reset is declared before the ll.* layers.
  await assertLayerOrder(projectDir)

  // The AI half of the front door: the agent must land where Claude Code looks,
  // and the .mcp.json we wrote must actually resolve to a live server.
  await assertAgentDropIn(projectDir)
  await assertBriefingLayer(projectDir)
  await assertStarterPage(projectDir)
  await assertMcpResolves(projectDir)

  console.log('\n✓ SMOKE TEST PASSED — #462 contract + AI wiring intact')
} finally {
  await rm(workdir, { recursive: true, force: true })
}

/**
 * The agent must land exactly where Claude Code discovers subagents. It's
 * vendored from `templates/_shared/` (not the template's own `.claude/`, which
 * the repo `.npmignore` would strip from the tarball) — so this also catches the
 * agent silently failing to ship.
 */
async function assertAgentDropIn(projectDir) {
  log('Asserting agent drop-in …')
  const agentPath = join(projectDir, '.claude', 'agents', 'nextjs-lando-ds.md')
  try {
    await access(agentPath)
  } catch {
    fail(
      'agent missing at .claude/agents/nextjs-lando-ds.md — the drop-in broke, or the agent was stripped from the package',
    )
  }
  const body = await readFile(agentPath, 'utf8')
  if (!/^---[\s\S]*?\bname:\s*nextjs-lando-ds\b/m.test(body)) {
    fail('agent file is present but its frontmatter has no `name: nextjs-lando-ds`')
  }
  log('agent ok: .claude/agents/nextjs-lando-ds.md')
}

/**
 * The starter page's two load-bearing rules, checked statically (free — no boot):
 *
 *  1. **The page never holds a colour value.** Swatches fill from `var(--token)`
 *     so they stay honest across preset + light/dark; a hex would be a lie the
 *     moment the theme changed, and it would teach the copy-the-hex habit the
 *     design system exists to prevent.
 *  2. **Only contrast-passing presets are offered.** 4 of the DS's 7 fail WCAG AA
 *     for the button text on them (lando-labs/lando-labs-design-system#542) —
 *     offering them here would hand a new user an inaccessible app on day one.
 */
async function assertStarterPage(projectDir) {
  log('Asserting starter page rules …')
  const page = await readFile(join(projectDir, 'app', 'page.tsx'), 'utf8')
  const palette = await readFile(join(projectDir, 'app', '_starter', 'palette.ts'), 'utf8')
  const controls = await readFile(join(projectDir, 'app', '_starter', 'Controls.tsx'), 'utf8')

  for (const [name, src] of [
    ['app/page.tsx', page],
    ['app/_starter/palette.ts', palette],
    ['app/_starter/Controls.tsx', controls],
  ]) {
    const hex = src.match(/#[0-9a-fA-F]{6}\b/)
    if (hex) fail(`${name} contains a hardcoded colour (${hex[0]}) — swatches must fill from var(--token)`)
  }

  const ACCESSIBLE = ['brand-neutral', 'lando', 'slate']
  const FAILING = ['midnight', 'rose', 'sunset', 'forest']
  for (const id of ACCESSIBLE) {
    if (!palette.includes(`'${id}'`)) fail(`starter palette no longer offers the "${id}" preset`)
  }
  for (const id of FAILING) {
    if (palette.includes(`'${id}'`)) {
      fail(`starter palette offers "${id}", which fails WCAG AA contrast — see design-system#542`)
    }
  }

  // The mirror is the whole point of section 3: it must read the real file.
  if (!/readFile\([\s\S]{0,80}AGENTS\.md/.test(page)) {
    fail('app/page.tsx no longer reads AGENTS.md — the brief mirror would drift from the brief')
  }
  log('starter page ok: no hex, 3 accessible presets, brief mirrored from AGENTS.md')
}

/**
 * The AI briefing layer: one canonical brief (`AGENTS.md`), thin pointers for
 * each tool, and a project MCP config per tool's own convention.
 *
 * Every one of these is silently inert when wrong — a mistyped path or TOML key
 * produces a file no tool ever reads, with nothing failing. So assert the shapes,
 * and assert the three MCP configs still agree (the drift they exist to prevent).
 */
async function assertBriefingLayer(projectDir) {
  log('Asserting AI briefing layer …')
  const read = async (rel) => {
    try {
      return await readFile(join(projectDir, rel), 'utf8')
    } catch {
      fail(`missing ${rel} — the briefing drop-in broke, or it never shipped`)
    }
  }

  // Canonical brief.
  const agents = await read('AGENTS.md')
  if (!/app\/providers\.tsx/.test(agents)) {
    fail('AGENTS.md has no `app/providers.tsx` theme rule — the human→AI loop is open')
  }

  // Pointers. CLAUDE.md must actually import the brief, not paraphrase it.
  const claude = await read('CLAUDE.md')
  if (!/@AGENTS\.md/.test(claude)) fail('CLAUDE.md does not import @AGENTS.md')

  const rule = await read('.cursor/rules/lando-ds.mdc')
  if (!/^---[\s\S]*?alwaysApply:\s*true/m.test(rule)) {
    fail('.cursor/rules/lando-ds.mdc lacks `alwaysApply: true` frontmatter')
  }
  // Cursor: always-apply rules cost tokens on every request; keep it a pointer.
  const words = rule.replace(/^---[\s\S]*?---/, '').trim().split(/\s+/).length
  if (words > 200) fail(`Cursor always-apply rule is ${words} words; keep it under 200`)

  await read('START_HERE.md')

  // No placeholder may survive into a user's project.
  for (const f of ['AGENTS.md', 'CLAUDE.md', 'START_HERE.md', '.cursor/rules/lando-ds.mdc']) {
    if (/\{\{[A-Z_]+\}\}/.test(await read(f))) fail(`${f} still contains an unsubstituted {{PLACEHOLDER}}`)
  }

  // All three tools must point at the same server + package.
  const claudeCfg = JSON.parse(await read('.mcp.json')).mcpServers
  const cursorCfg = JSON.parse(await read('.cursor/mcp.json')).mcpServers
  const codex = await read('.codex/config.toml')

  const key = Object.keys(claudeCfg)[0]
  const pkg = claudeCfg[key].args.at(-1)
  if (Object.keys(cursorCfg)[0] !== key || cursorCfg[key].args.at(-1) !== pkg) {
    fail('.cursor/mcp.json disagrees with .mcp.json — configs drifted')
  }
  // Codex's table key is `mcp_servers` (underscores). camelCase = inert file.
  if (!new RegExp(`\\[mcp_servers\\.${key}\\]`).test(codex)) {
    fail(`.codex/config.toml has no [mcp_servers.${key}] table — wrong key means Codex silently ignores it`)
  }
  if (!codex.includes(pkg)) fail('.codex/config.toml disagrees with .mcp.json — configs drifted')

  log(`briefing ok: AGENTS.md + pointers; MCP wired for claude/cursor/codex → "${key}"`)
}

/**
 * Spawn the EXACT command the scaffolded `.mcp.json` declares and run an MCP
 * `initialize` handshake. A config that names a package which doesn't resolve
 * (or a server that crashes on boot) shows up as a broken server in the user's
 * editor — this is the guard for that.
 *
 * Timing is done in-process: `timeout(1)` does not exist on macOS, so a shell
 * probe would silently "pass" by never running at all.
 */
async function assertMcpResolves(projectDir) {
  log('Asserting .mcp.json resolves to a live server …')
  const cfg = JSON.parse(await readFile(join(projectDir, '.mcp.json'), 'utf8'))
  const keys = Object.keys(cfg.mcpServers ?? {})
  if (keys.length !== 1) fail(`.mcp.json should declare exactly one server, got ${keys.length}`)
  const [key] = keys
  const { command, args } = cfg.mcpServers[key]

  const child = spawn(command, args, { stdio: ['pipe', 'pipe', 'pipe'] })
  let out = ''
  let err = ''
  child.stdout.on('data', (d) => (out += d))
  child.stderr.on('data', (d) => (err += d))
  child.stdin.write(
    JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'create-lando-app-smoke', version: '0' },
      },
    }) + '\n',
  )

  const outcome = await new Promise((res) => {
    const timer = setTimeout(() => res('timeout'), MCP_TIMEOUT_MS)
    const poll = setInterval(() => {
      if (out.includes('"result"') || out.includes('"error"')) {
        clearTimeout(timer)
        clearInterval(poll)
        res('responded')
      }
    }, 250)
    child.on('error', () => {
      clearTimeout(timer)
      clearInterval(poll)
      res('spawn-error')
    })
    child.on('exit', (code) => {
      clearTimeout(timer)
      clearInterval(poll)
      res(`exited(${code})`)
    })
  })
  child.kill()

  if (outcome !== 'responded') {
    fail(
      `MCP server "${key}" (${command} ${args.join(' ')}) did not answer initialize — outcome: ${outcome}.` +
        (err.trim() ? `\n  stderr: ${err.slice(0, 300)}` : ''),
    )
  }

  const line = out.split('\n').find((l) => l.trim().startsWith('{'))
  const info = JSON.parse(line).result?.serverInfo
  if (!info?.name) fail('MCP initialize returned no serverInfo')
  log(`mcp ok: server "${key}" → ${info.name} v${info.version}`)
}

/**
 * Resolve the DS's `./layer-order.css` export in the installed app and assert
 * `app-reset` is declared before any `ll.*` layer in its `@layer` statement.
 */
async function assertLayerOrder(projectDir) {
  log('Asserting #462 layer order (app-reset must be lowest) …')
  const dsDir = join(projectDir, 'node_modules', '@lando-labs', 'lando-ds')

  let pkg
  try {
    pkg = JSON.parse(await readFile(join(dsDir, 'package.json'), 'utf8'))
  } catch {
    fail('installed DS has no package.json — install is corrupt')
  }

  const exp = pkg.exports?.['./layer-order.css']
  const rel =
    typeof exp === 'string'
      ? exp
      : exp?.default ?? exp?.style ?? exp?.import ?? exp?.require
  if (!rel) {
    fail('DS package.json no longer exports "./layer-order.css" — #462 contract broke')
  }

  let css
  try {
    css = await readFile(join(dsDir, rel), 'utf8')
  } catch {
    fail(`DS layer-order.css missing at ${rel} — #462 contract broke`)
  }

  // Strip block comments first — layer-order.css documents itself with prose
  // containing `@layer NAME { … }`, which must not be mistaken for the real
  // declaration. The real one is a comma-separated layer LIST with no `{`.
  const cssNoComments = css.replace(/\/\*[\s\S]*?\*\//g, '')
  const m = cssNoComments.match(/@layer\s+([^;{]+);/)
  if (!m) fail('layer-order.css has no `@layer …;` list declaration — #462 contract broke')
  const order = m[1].split(',').map((s) => s.trim())

  const appResetIdx = order.indexOf('app-reset')
  const firstLlIdx = order.findIndex((l) => l.startsWith('ll.'))
  if (appResetIdx === -1) {
    fail(`layer-order.css no longer declares the "app-reset" layer (got: ${order.join(', ')})`)
  }
  if (firstLlIdx !== -1 && appResetIdx > firstLlIdx) {
    fail(
      `"app-reset" is no longer the lowest layer — an app reset would clobber DS spacing (order: ${order.join(', ')})`,
    )
  }
  log(`layer order ok: ${order.join(', ')}`)
}
