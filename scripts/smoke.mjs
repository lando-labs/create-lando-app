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
import { spawnSync } from 'node:child_process'

const here = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(here, '..')
const TEMPLATES_DIR = join(ROOT, 'templates')

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
    mcp: false,
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

  console.log('\n✓ SMOKE TEST PASSED — #462 cascade-layer contract intact')
} finally {
  await rm(workdir, { recursive: true, force: true })
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
