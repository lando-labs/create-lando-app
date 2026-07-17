// The getting-started page.
//
// This is a Server Component — it reads your AGENTS.md off disk at build time and
// mirrors it below, so the brief your AI reads and the brief you read are the same
// file. Only the interactive parts (theme toggle, swatches, preset chooser) are
// client components, in `./_starter`.
//
// This page is meant to be deleted. Replace it with your app — everything it shows
// you is either in a file you now know about, or one MCP query away.
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { Card } from '@lando-labs/lando-ds/components/Card/Card'
import { CardBody } from '@lando-labs/lando-ds/components/Card/CardBody'
import { CardHeader } from '@lando-labs/lando-ds/components/Card/CardHeader'
import { CardTitle } from '@lando-labs/lando-ds/components/Card/CardTitle'
import { Markdown } from '@lando-labs/lando-ds/components/Markdown/Markdown'
import { Divider } from '@lando-labs/lando-ds/components/Divider/Divider'
import meta from '@lando-labs/lando-ds/meta'
import { ThemeToggle, Palette, PresetChooser } from './_starter/Controls'

/** The brief, read from disk. Absent when scaffolded with `--no-mcp`. */
async function readBrief(): Promise<string | null> {
  try {
    return await readFile(join(process.cwd(), 'AGENTS.md'), 'utf8')
  } catch {
    return null
  }
}

const FILE_MAP: Array<{ path: string; owns: string; href?: string }> = [
  {
    path: 'app/page.tsx',
    owns: 'This page. Replace it — that’s the point.',
    href: 'https://nextjs.org/docs/app/building-your-application/routing/pages',
  },
  {
    path: 'app/layout.tsx',
    owns: 'The HTML shell, CSS import order, and the anti-flash theme script.',
    href: 'https://nextjs.org/docs/app/building-your-application/routing/layouts-and-templates',
  },
  { path: 'app/providers.tsx', owns: 'The theme preset. One line, and it decides every colour above.' },
  { path: 'app/globals.css', owns: 'Your CSS. The reset lives in @layer app-reset so it can’t flatten components.' },
  { path: 'AGENTS.md', owns: 'What your AI is told about this project. Yours to edit.' },
]

const PROMPTS = [
  'Build a dashboard with metric cards and a recent-activity table.',
  'Add a settings form with validation and a save action.',
  'Give me a sidebar nav with the routes I have so far.',
]

export default async function HomePage() {
  const brief = await readBrief()
  const dsVersion = meta.package?.version ?? 'unknown'

  return (
    <main
      style={{
        maxWidth: '60rem',
        margin: '0 auto',
        padding: 'var(--spacing-8) var(--spacing-6)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--spacing-8)',
      }}
    >
      {/* 0 — Identity. A status line, not a hero. The toggle sits here because it
          re-colours the palette directly below it. */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'var(--spacing-4)',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <h1 style={{ fontSize: 'var(--text-2xl)', margin: 0 }}>{{PROJECT_NAME}}</h1>
          <p
            style={{
              margin: 0,
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-sm)',
              color: 'var(--color-text-secondary)',
            }}
          >
            localhost:{{DEV_PORT}} · lando-ds {dsVersion}
          </p>
        </div>
        <ThemeToggle />
      </header>

      {/* 1 — The palette. The lead: these are your app's actual colours, read live
          from the CSS custom properties. */}
      <section>
        <h2 style={{ fontSize: 'var(--text-lg)', marginBottom: 'var(--spacing-1)' }}>
          Your colours
        </h2>
        <p
          style={{
            marginTop: 0,
            marginBottom: 'var(--spacing-4)',
            color: 'var(--color-text-secondary)',
          }}
        >
          Live from the design system — not a screenshot. Toggle the theme or switch
          the preset and every chip below follows.
        </p>
        <Palette />
      </section>

      <Divider />

      {/* 2 — The control for section 1. */}
      <section>
        <h2 style={{ fontSize: 'var(--text-lg)', marginBottom: 'var(--spacing-1)' }}>
          Make it yours
        </h2>
        <p
          style={{
            marginTop: 0,
            marginBottom: 'var(--spacing-4)',
            color: 'var(--color-text-secondary)',
          }}
        >
          Try a preset. Keep it by pasting two lines into your source.
        </p>
        <PresetChooser />
      </section>

      <Divider />

      {/* 3 — The mirror. Same file the AI reads; edit it and refresh to see this
          change. That IS the lesson: one brief, two readers, no copies to sync. */}
      <section>
        <h2 style={{ fontSize: 'var(--text-lg)', marginBottom: 'var(--spacing-1)' }}>
          What your AI already knows
        </h2>
        {brief ? (
          <>
            <p
              style={{
                marginTop: 0,
                marginBottom: 'var(--spacing-4)',
                color: 'var(--color-text-secondary)',
              }}
            >
              This is <code>AGENTS.md</code>, rendered from the same file your assistant
              reads. Edit it, refresh, and your words show up here. Nothing to keep in
              sync — there&rsquo;s only one copy.
            </p>
            <Card variant="elevated">
              <CardBody>
                <div style={{ maxHeight: '22rem', overflowY: 'auto' }}>
                  <Markdown content={brief} />
                </div>
              </CardBody>
            </Card>
          </>
        ) : (
          <p style={{ marginTop: 0, color: 'var(--color-text-secondary)' }}>
            No <code>AGENTS.md</code> in this project — it was scaffolded with{' '}
            <code>--no-mcp</code>, so no AI brief was written. Add one and it will
            appear here.
          </p>
        )}
      </section>

      <Divider />

      {/* 4 — The Next.js intro, as a map rather than a tutorial. `npm run dev`
          already worked; what's needed now is "which file". */}
      <section>
        <h2 style={{ fontSize: 'var(--text-lg)', marginBottom: 'var(--spacing-1)' }}>
          Where things are
        </h2>
        <p
          style={{
            marginTop: 0,
            marginBottom: 'var(--spacing-4)',
            color: 'var(--color-text-secondary)',
          }}
        >
          The whole app is five files.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)' }}>
          {FILE_MAP.map((f) => (
            <div
              key={f.path}
              style={{
                display: 'flex',
                gap: 'var(--spacing-4)',
                alignItems: 'baseline',
                flexWrap: 'wrap',
              }}
            >
              <code
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 'var(--text-sm)',
                  minWidth: '11rem',
                }}
              >
                {f.path}
              </code>
              <span style={{ flex: 1, minWidth: '16rem' }}>{f.owns}</span>
              {f.href ? (
                <a
                  href={f.href}
                  target="_blank"
                  rel="noreferrer"
                  style={{ fontSize: 'var(--text-sm)', color: 'var(--color-primary)' }}
                >
                  docs
                </a>
              ) : null}
            </div>
          ))}
        </div>
      </section>

      <Divider />

      {/* Talking to the AI: prompts, not prose. */}
      <section>
        <h2 style={{ fontSize: 'var(--text-lg)', marginBottom: 'var(--spacing-1)' }}>
          Talk to your AI
        </h2>
        <p
          style={{
            marginTop: 0,
            marginBottom: 'var(--spacing-4)',
            color: 'var(--color-text-secondary)',
          }}
        >
          Your assistant can query the design system directly, so you can describe the
          outcome instead of the components. Try:
        </p>
        <Card>
          <CardHeader>
            <CardTitle>Starter prompts</CardTitle>
          </CardHeader>
          <CardBody>
            <ul style={{ margin: 0, paddingLeft: 'var(--spacing-5)' }}>
              {PROMPTS.map((p) => (
                <li key={p} style={{ marginBottom: 'var(--spacing-2)' }}>
                  {p}
                </li>
              ))}
            </ul>
            <p
              style={{
                marginBottom: 0,
                marginTop: 'var(--spacing-4)',
                fontSize: 'var(--text-sm)',
                color: 'var(--color-text-secondary)',
              }}
            >
              Want a different look? Change the preset above, then tell your AI what
              you&rsquo;re building — it reads <code>app/providers.tsx</code> for the
              theme, so it stays current on its own.
            </p>
          </CardBody>
        </Card>
      </section>

      {/* 5 — The exit. This page's success condition is its own deletion. */}
      <footer
        style={{
          color: 'var(--color-text-secondary)',
          fontSize: 'var(--text-sm)',
          borderTop: '1px solid var(--color-border-subtle)',
          paddingTop: 'var(--spacing-4)',
        }}
      >
        Done looking? Replace the contents of <code>app/page.tsx</code> (and delete{' '}
        <code>app/_starter/</code>) — this page is a starting point, not furniture.
      </footer>
    </main>
  )
}
