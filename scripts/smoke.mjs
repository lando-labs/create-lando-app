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
import { mkdtemp, rm, readFile, readdir, access } from 'node:fs/promises'
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
    ai: ['claude', 'cursor', 'codex'], // exercise the full AI wiring
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
  await assertAiSelection()

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

/** True if a path exists — for asserting a file is GONE, not just readable. */
async function exists(p) {
  try {
    await access(p)
    return true
  } catch {
    return false
  }
}

/**
 * The starter page's load-bearing rules, checked statically (free — no boot).
 *
 * The page is a colour-foundation tool: pick/paste a primary → an accessible
 * palette derived through the DS's own OKLCH maths → a DS `ProductTheme` you
 * paste into `ThemeProvider`. It must model proper DS practice, so:
 *
 *  1. **Presets are gone** (`palette.ts` must not ship, nothing imports it).
 *  2. **The engine outputs a DS `ProductTheme`** (`buildProductTheme`) — it must
 *     NOT hand-write CSS (`@layer app` / `color-mix()` / `data-theme=`); the DS
 *     derives ramps/states/surfaces from the theme.
 *  3. **The comparison holds (#36), without poisoning storage (#53):** the page
 *     `:root` is driven via `setProductTheme` ONLY when "apply to page" is on;
 *     otherwise the starter persists nothing and clears any stored theme, so a
 *     configure→reload can't shadow the app's brand theme. The preview is a
 *     scoped `ThemeScope` showing the user's theme — including the **brand tonal
 *     ramps**, truthful in a scope since DS #11. Accent is demonstrated
 *     (`var(--color-accent)`).
 *  4. **Danger stays red** — the theme never sets an `error` colour.
 *  5. **The palette shows on real DS components**, and the brief peek reads the
 *     real `AGENTS.md`.
 */
async function assertStarterPage(projectDir) {
  log('Asserting starter page rules …')
  const starterDir = join(projectDir, 'app', '_starter')
  const page = await readFile(join(projectDir, 'app', 'page.tsx'), 'utf8')
  const color = await readFile(join(starterDir, 'color.ts'), 'utf8')

  // The starter is split across several component files under `_starter/` (a
  // folder the user deletes wholesale), so assert against ALL of them
  // concatenated — resilient to how the control/preview are decomposed.
  const starterFiles = (await readdir(starterDir)).filter((f) => /\.(t|j)sx?$/.test(f) && f !== 'color.ts')
  let starterSrc = ''
  for (const f of starterFiles) starterSrc += '\n' + (await readFile(join(starterDir, f), 'utf8'))

  // 1 — presets removed.
  if (await exists(join(starterDir, 'palette.ts'))) {
    fail('app/_starter/palette.ts still ships — the preset system was meant to be removed')
  }
  if (/from '\.\/palette'/.test(starterSrc)) {
    fail('the starter still imports ./palette — the dropped preset module')
  }

  // 2 — the engine is wired and outputs a DS ProductTheme.
  for (const fn of ['ensureAccessiblePrimary', 'buildPalette', 'buildProductTheme']) {
    if (!starterSrc.includes(fn) && !color.includes(fn)) fail(`the starter no longer uses ${fn} — the engine is unwired`)
  }
  if (!/ProductTheme/.test(color)) fail('color.ts no longer produces a DS ProductTheme')

  // 2b — NO hand-rolled CSS/colour injection. The theme flows through the DS
  // ProductTheme; the engine must not hand-write custom properties.
  const handRolled = color.match(/@layer app|color-mix\(|data-theme=/)
  if (handRolled) {
    fail(`color.ts hand-writes CSS (${handRolled[0]}) — the theme must go through the DS ProductTheme, not injected CSS`)
  }

  // 2c — the page `:root` is driven via `setProductTheme` for "apply to page",
  // but must NOT persist a throwaway theme when it's OFF (#53). The slate
  // baseline is gone, and the OFF path CLEARS any stored theme
  // (`setProductTheme(undefined)`) so a configure→reload doesn't shadow
  // app/providers.tsx's brand theme (the bug: app came up in the wrong colours).
  if (!/setProductTheme/.test(starterSrc)) {
    fail('the starter no longer drives the page `:root` via setProductTheme')
  }
  if (/SLATE_BASELINE/.test(starterSrc) || /SLATE_BASELINE/.test(color)) {
    fail('the slate baseline still ships — #53: the starter must not persist a throwaway theme to :root (it shadows the brand theme after a reload)')
  }
  if (!/setProductTheme\(undefined\)/.test(starterSrc)) {
    fail('the "apply to page = off" path no longer clears the stored theme via setProductTheme(undefined) — #53 regresses (a stale theme shadows app/providers.tsx after reload)')
  }

  // 2d — the preview is SCOPED (#36). DS #11 makes a scoped ThemeScope re-derive
  // the tonal ramp + interaction-state tokens, which is what lets the preview
  // show the user's theme truthfully without the page having to wear it.
  if (!/ThemeScope/.test(starterSrc)) {
    fail('the preview is no longer scoped in a ThemeScope — the theme-in-a-scope preview depends on it (#36)')
  }

  // 2e — the brand tonal ramps are shown, read INSIDE the scope so they are the
  // DS's real derived steps (only truthful since DS #11).
  if (!/--color-\$\{[\w.]+\}-\$\{[\w.]+\}|--color-(primary|secondary)-(lightest|lighter|light|dark|darker|darkest)/.test(starterSrc)) {
    fail('the brand tonal ramps are not rendered — the preview must show the derived ramp steps (#36)')
  }

  // 2f — accent is demonstrated on a real consumer. Nothing in the DS base reads
  // `--color-accent`, so a reference app must show its role explicitly.
  if (!/var\(--color-accent/.test(starterSrc)) {
    fail('accent is not demonstrated — a component must consume var(--color-accent) (#34)')
  }

  // 2g — secondary gets the same token-direct treatment as accent (#38): both
  // roles are demonstrated via `var(--color-…)` applied directly on a
  // consumer, since most DS components don't read either. Also assert the
  // section that hosts both patterns (token-direct + the ThemeScope re-skin
  // workaround) is present under its current title.
  if (!/var\(--color-secondary/.test(starterSrc)) {
    fail('secondary is not demonstrated via a direct token read — a component must consume var(--color-secondary) (#38)')
  }
  if (!/Using secondary & accent/.test(starterSrc)) {
    fail('the "Using secondary & accent" section is missing — secondary/accent must be demonstrated together (#38)')
  }

  // 3 — danger stays the DS default red: the theme never sets an `error` colour.
  if (/['"]error['"]\s*:/.test(color)) {
    fail('color.ts sets an `error` colour in the theme — danger must stay the DS default red')
  }

  // 4 — palette shown on real components.
  for (const comp of ['Button', 'Alert']) {
    if (!starterSrc.includes(comp)) {
      fail(`the starter no longer renders <${comp}> — the palette must show on real DS components`)
    }
  }

  // 4b — §4 "Advanced customization with your AI" (#40): the refine section
  // sits between the handoff and the file map, with its two titled cards
  // (retune-the-look vs. compose-new-UI) present and reachable via `#refine`.
  if (!/id="refine"/.test(page)) {
    fail('the "refine" section (#40) is missing its id="refine" anchor')
  }
  for (const title of ['Retune the look', 'Build new UI']) {
    if (!starterSrc.includes(title) && !page.includes(title)) {
      fail(`the §4 card titled "${title}" is missing — advanced customization (#40) must show both cards`)
    }
  }

  // 4c — quick-link nav (#41): a pure-anchor row naming the whole arc, one
  // href per section (rendered via `Text as="a" href={…}`, so the literal
  // `#target` lives in the link-data array, not as a JSX string attribute).
  // No client JS backs it, so this is a static source check — every target
  // must be a real in-page anchor.
  for (const href of ["'#colors'", "'#handoff'", "'#refine'", "'#app'"]) {
    if (!page.includes(href)) {
      fail(`the quick-link nav (#41) is missing an anchor for ${href} — every step must be jumpable`)
    }
  }

  // 4d — #refine/#app collapse into a single Accordion, both closed on load
  // (#41). The palette (#colors) and handoff (#handoff) sections must stay
  // OUT of it — collapsing those would hide the page's wow and conversion.
  if (!/<Accordion\b/.test(page) || !/<AccordionItem\b/.test(page)) {
    fail('the §4/§5 collapse (#41) is missing — expected an Accordion wrapping AccordionItems')
  }
  if (!/type=["']multiple["']/.test(page)) {
    fail('the Accordion (#41) is not type="multiple" — #refine and #app must be independently collapsible')
  }
  // Both sections must still be reachable and inert until opened — the `id`
  // belongs on each AccordionItem (its trigger stays in the DOM and visible
  // even collapsed), not buried inside the collapsed content.
  if (!/<AccordionItem[^>]*\bid=["']refine["']/.test(page)) {
    fail('id="refine" is not on an AccordionItem — the quick-link would no longer land on a visible header once collapsed')
  }
  if (!/<AccordionItem[^>]*\bid=["']app["']/.test(page)) {
    fail('id="app" is not on an AccordionItem — the quick-link would no longer land on a visible header once collapsed')
  }
  // #colors/#handoff must NOT be inside the Accordion — they stay open.
  const accordionSpan = page.slice(page.indexOf('<Accordion'), page.lastIndexOf('</Accordion>'))
  if (accordionSpan.includes('id="colors"') || accordionSpan.includes('id="handoff"')) {
    fail('the palette or handoff section got pulled into the collapsed Accordion (#41) — they must stay open on load')
  }

  // 4e — the handoff is a SEQUENCE, not a flat prompt list (#51): orient →
  // theme+first-screen → keep-building. The two lead prompts must exist in the
  // starter data AND be rendered on the page, and the three step titles present.
  for (const name of ['ORIENT_PROMPT', 'HANDOFF_PROMPT']) {
    if (!starterSrc.includes(name)) fail(`the handoff sequence (#51) is missing ${name} in the starter data`)
    if (!page.includes(name)) fail(`app/page.tsx no longer renders ${name} — the handoff must lead with orient, then theme+first-screen`)
  }
  // The theme+first-screen prompt does the whole handoff in one paste: save
  // brand-theme.ts, wire providers, replace the page, delete the starter.
  for (const token of ['brand-theme.ts', 'app/_starter/', 'providers.tsx']) {
    if (!starterSrc.includes(token)) {
      fail(`the theme+first-screen prompt (#51) no longer mentions ${token} — it must save+wire+build+delete in one paste`)
    }
  }
  for (const title of ['Orient', 'Put your theme on a real screen', 'Keep building']) {
    if (!page.includes(title)) fail(`the handoff step "${title}" (#51) is missing — the handoff must read as an ordered sequence`)
  }

  // 5 — the peek reads the real file; no placeholder survives into the page.
  if (!/readFile\([\s\S]{0,80}AGENTS\.md/.test(page)) {
    fail('app/page.tsx no longer reads AGENTS.md — the brief peek would drift from the brief')
  }
  if (/\{\{[A-Z_]+\}\}/.test(page)) fail('app/page.tsx still contains an unsubstituted {{PLACEHOLDER}}')

  log('starter page ok: presets removed, engine → ProductTheme, no hand-written CSS, no localStorage poison (#53), scoped ThemeScope preview + brand ramps, accent demonstrated, error red, handoff sequence (#51)')
}

/**
 * `--ai` must wire ONLY what was asked for, and the brief must not lie.
 *
 * Scaffold-only (no install/build), so this costs ~nothing. The failure it
 * guards is quiet: ship a Cursor user a brief promising a Claude subagent that
 * was never installed, and their AI hunts for a file that isn't there.
 */
async function assertAiSelection() {
  log('Asserting --ai selection …')
  const cases = [
    { ai: ['cursor'], present: ['.cursor/mcp.json', 'AGENTS.md'], absent: ['CLAUDE.md', '.mcp.json', '.codex/config.toml', '.claude/settings.json'] },
    { ai: ['claude'], present: ['.mcp.json', 'CLAUDE.md', '.claude/settings.json'], absent: ['.cursor/mcp.json', '.codex/config.toml'] },
    { ai: ['codex'], present: ['.codex/config.toml', 'AGENTS.md'], absent: ['CLAUDE.md', '.mcp.json', '.cursor/mcp.json', '.claude/settings.json'] },
    { ai: [], present: [], absent: ['AGENTS.md', 'CLAUDE.md', 'START_HERE.md', '.mcp.json', '.claude/settings.json'] },
  ]

  const dir = await mkdtemp(join(tmpdir(), 'cla-ai-'))
  try {
    for (const c of cases) {
      const target = join(dir, c.ai.join('-') || 'none')
      await scaffold({
        templatesDir: TEMPLATES_DIR,
        template: 'next-app-router',
        targetDir: target,
        projectName: 'ai-case',
        ai: c.ai,
      })
      const label = `--ai ${c.ai.join(',') || 'none'}`
      for (const f of c.present) {
        try {
          await access(join(target, f))
        } catch {
          fail(`${label} should write ${f}, but it's missing`)
        }
      }
      for (const f of c.absent) {
        let there = true
        try {
          await access(join(target, f))
        } catch {
          there = false
        }
        if (there) fail(`${label} wrote ${f} — it wired a tool that wasn't asked for`)
      }
      // The brief must not promise an agent that was never installed.
      if (c.ai.length && !c.ai.includes('claude')) {
        const brief = await readFile(join(target, 'AGENTS.md'), 'utf8')
        if (/agent set up|\.claude\/agents/.test(brief)) {
          fail(`${label} brief promises a Claude subagent that was never installed`)
        }
      }
    }
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
  log('ai selection ok: each tool wires only its own files; brief stays truthful')
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

  // Canonical brief. The theme rule points at providers.tsx + the DS ProductTheme.
  const agents = await read('AGENTS.md')
  if (!/app\/providers\.tsx/.test(agents) || !/ProductTheme/.test(agents)) {
    fail('AGENTS.md no longer points the theme rule at app/providers.tsx / ProductTheme')
  }
  // The brief teaches the first-handoff job (#51): build a VISIBLE first screen
  // (replace app/page.tsx, delete app/_starter/), not just wire the theme.
  if (!/first screen/i.test(agents) || !/app\/_starter\//.test(agents)) {
    fail('AGENTS.md no longer teaches the first-handoff job (#51) — build a visible first screen, replacing app/page.tsx + deleting app/_starter/')
  }
  // And teaches the route-group pattern for app chrome (#51) so the AI stops
  // routing around the "protected" root layout by reflex.
  if (!/app\/\(app\)/.test(agents)) {
    fail('AGENTS.md no longer recommends the app/(app) route group for app chrome (#51)')
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

  // The DS MCP's tools are pre-approved for Claude Code (#52): the committed
  // .claude/settings.json must allow `mcp__<key>__*`, keyed off the SAME server
  // key as .mcp.json (so it can't drift). The `__*` suffix is load-bearing — a
  // bare `mcp__<key>` is an unanchored glob Claude Code ignores, so it would
  // silently prompt on every call.
  const settings = JSON.parse(await read('.claude/settings.json'))
  const allow = settings.permissions?.allow ?? []
  if (!allow.includes(`mcp__${key}__*`)) {
    fail(`.claude/settings.json does not pre-approve mcp__${key}__* — the DS MCP would prompt on every call (#52)`)
  }

  log(`briefing ok: AGENTS.md + pointers; MCP wired for claude/cursor/codex → "${key}"; DS tools pre-approved`)
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
