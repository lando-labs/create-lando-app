// The getting-started page.
//
// One path, thin frame: iron out your colours, hand off to your AI. This is a
// Server Component — it reads your AGENTS.md off disk at build time for the
// §2 brief peek. Only the interactive parts (theme toggle, colour foundation)
// are client components, in `./_starter`.
//
// This page is meant to be deleted. Replace it with your app — everything it
// shows you is either in a file you now know about, or one MCP query away.
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { Card } from '@lando-labs/lando-ds/components/Card/Card'
import { CardHeader } from '@lando-labs/lando-ds/components/Card/CardHeader'
import { CardTitle } from '@lando-labs/lando-ds/components/Card/CardTitle'
import { CardBody } from '@lando-labs/lando-ds/components/Card/CardBody'
import { Divider } from '@lando-labs/lando-ds/components/Divider/Divider'
import meta from '@lando-labs/lando-ds/meta'
import { ThemeToggle, ColorFoundation, PromptRow } from './_starter/Controls'

/** The brief, read from disk. Absent when scaffolded with `--no-mcp`. */
async function readBrief(): Promise<string | null> {
  try {
    return await readFile(join(process.cwd(), 'AGENTS.md'), 'utf8')
  } catch {
    return null
  }
}

/**
 * A slim peek at the brief, not the brief itself. Pulls the paragraph under
 * "## What this project is" (usually two sentences), flattened to plain text
 * — enough to show your AI has real context, not enough to turn this page
 * into a scrollbox of markdown.
 */
function briefPeek(brief: string): string | null {
  const match = brief.match(/##\s*What this project is\s*\n+([\s\S]*?)(?=\n\s*\n|$)/)
  if (!match) return null
  return match[1].replace(/\s+/g, ' ').replace(/[*`]/g, '').trim()
}

const BRIEF_HIGHLIGHTS = [
  'Reads the DS via MCP instead of assuming an API from memory.',
  'Server Components by default; `\'use client\'` only for interactivity.',
  'No Tailwind, no hardcoded colors — design tokens only.',
]

const FILE_MAP: Array<{ path: string; owns: string }> = [
  { path: 'app/page.tsx', owns: 'This page. Replace it — that’s the point.' },
  { path: 'app/layout.tsx', owns: 'The HTML shell and page metadata.' },
  { path: 'app/providers.tsx', owns: 'The theme base. Your brand palette lives in globals.css.' },
  { path: 'app/globals.css', owns: 'Your CSS — including the @layer app block you just copied into.' },
  { path: 'AGENTS.md', owns: 'What your AI is told about this project. Yours to edit.' },
]

const PROMPTS = [
  'Build a dashboard with metric cards and a recent-activity table.',
  'Add a settings form with validation and a save action.',
  'Give me a sidebar nav with the routes I have so far.',
]

export default async function HomePage() {
  const brief = await readBrief()
  const peek = brief ? briefPeek(brief) : null
  const dsVersion = meta.package?.version ?? 'unknown'

  return (
    <main
      style={{
        maxWidth: '48rem',
        margin: '0 auto',
        padding: 'var(--spacing-8) var(--spacing-6)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--spacing-8)',
      }}
    >
      {/* 0 — Orient. A status line, not a hero. The toggle sits here because
          it re-colours everything below it. */}
      <header
        style={{
          display: 'flex',
          alignItems: 'flex-start',
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
              marginTop: 'var(--spacing-1)',
              color: 'var(--color-text-secondary)',
            }}
          >
            Your Lando-DS app is running. Set a brand colour, then hand off to your AI — this page is
            meant to be deleted.
          </p>
          <p
            style={{
              margin: 0,
              marginTop: 'var(--spacing-1)',
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

      {/* 1 — Your palette. Iron out your colours, see them on real
          components, copy the CSS. */}
      <section>
        <h2 style={{ fontSize: 'var(--text-lg)', marginBottom: 'var(--spacing-1)' }}>1 · Your palette</h2>
        <p
          style={{
            marginTop: 0,
            marginBottom: 'var(--spacing-4)',
            color: 'var(--color-text-secondary)',
          }}
        >
          Pick or paste a primary. We keep it readable, derive the rest, and show you the result on the
          actual design system — not a screenshot.
        </p>
        <ColorFoundation />
      </section>

      {/* Bridge, not a blank divider — carries the artifact you just copied
          into the next step. */}
      <p
        style={{
          margin: 0,
          textAlign: 'center',
          fontSize: 'var(--text-sm)',
          color: 'var(--color-text-primary)',
        }}
      >
        Palette locked in. Now hand the wheel to your AI — it already knows this design system.
      </p>

      {/* 2 — Build with your AI. A slim brief, then the call-to-action. */}
      <section>
        <h2 style={{ fontSize: 'var(--text-lg)', marginBottom: 'var(--spacing-1)' }}>
          2 · Build with your AI
        </h2>
        {brief ? (
          <>
            <p
              style={{
                marginTop: 0,
                marginBottom: peek ? 'var(--spacing-2)' : 'var(--spacing-4)',
                color: 'var(--color-text-secondary)',
              }}
            >
              Your AI reads <code>AGENTS.md</code> before it writes code. {peek}
            </p>
            <ul
              style={{
                margin: 0,
                marginBottom: 'var(--spacing-4)',
                paddingLeft: 'var(--spacing-5)',
                color: 'var(--color-text-secondary)',
                fontSize: 'var(--text-sm)',
              }}
            >
              {BRIEF_HIGHLIGHTS.map((h) => (
                <li key={h}>{h}</li>
              ))}
            </ul>
          </>
        ) : (
          <p style={{ marginTop: 0, marginBottom: 'var(--spacing-4)', color: 'var(--color-text-secondary)' }}>
            No <code>AGENTS.md</code> in this project — it was scaffolded with <code>--no-mcp</code>, so no AI
            brief was written.
          </p>
        )}
        <Card>
          <CardHeader>
            <CardTitle>Starter prompts</CardTitle>
          </CardHeader>
          <CardBody>
            <p
              style={{
                marginTop: 0,
                marginBottom: 'var(--spacing-3)',
                fontSize: 'var(--text-sm)',
                color: 'var(--color-text-secondary)',
              }}
            >
              Open this folder in Claude Code or Cursor — <code>.mcp.json</code> and the{' '}
              <code>nextjs-lando-ds</code> agent are already wired — and paste one:
            </p>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
              {PROMPTS.map((p) => (
                <PromptRow key={p} prompt={p} />
              ))}
            </ul>
          </CardBody>
        </Card>
      </section>

      <Divider />

      {/* 3 — Where things are. One thin file map, not a tutorial. */}
      <section>
        <h2 style={{ fontSize: 'var(--text-lg)', marginBottom: 'var(--spacing-1)' }}>Where things are</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)' }}>
          {FILE_MAP.map((f) => (
            <div
              key={f.path}
              style={{ display: 'flex', gap: 'var(--spacing-4)', alignItems: 'baseline', flexWrap: 'wrap' }}
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
              <span style={{ flex: 1, minWidth: '16rem', color: 'var(--color-text-secondary)' }}>{f.owns}</span>
            </div>
          ))}
        </div>
      </section>

      {/* 4 — Exit. This page's success condition is its own deletion. */}
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
