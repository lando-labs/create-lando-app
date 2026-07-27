// The getting-started page.
//
// One path, thin frame: iron out your colours, hand off to your AI. This is a
// Server Component — it reads your AGENTS.md off disk at build time for the
// handoff section's brief peek. Only the interactive parts (colour
// foundation, prompt copy buttons) are client components, in `./_starter`.
//
// This page is meant to be deleted. Replace it with your app — everything it
// shows you is either in a file you now know about, or one MCP query away.
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { ArrowRight, Bot } from 'lucide-react'
import { Container } from '@lando-labs/lando-ds/components/Container/Container'
import { Stack } from '@lando-labs/lando-ds/components/Stack/Stack'
import { Inline } from '@lando-labs/lando-ds/components/Inline/Inline'
import { Heading } from '@lando-labs/lando-ds/components/Heading/Heading'
import { Text } from '@lando-labs/lando-ds/components/Text/Text'
import { Lede } from '@lando-labs/lando-ds/components/ArticleCard/Lede'
import { PageHeader } from '@lando-labs/lando-ds/components/PageHeader/PageHeader'
import { Callout } from '@lando-labs/lando-ds/components/Callout/Callout'
import { Badge } from '@lando-labs/lando-ds/components/Badge/Badge'
import { Card } from '@lando-labs/lando-ds/components/Card/Card'
import { CardHeader } from '@lando-labs/lando-ds/components/Card/CardHeader'
import { CardTitle } from '@lando-labs/lando-ds/components/Card/CardTitle'
import { CardBody } from '@lando-labs/lando-ds/components/Card/CardBody'
import { List } from '@lando-labs/lando-ds/components/List/List'
import { ListItem } from '@lando-labs/lando-ds/components/List/ListItem'
import { Divider } from '@lando-labs/lando-ds/components/Divider/Divider'
import meta from '@lando-labs/lando-ds/meta'
import { ColorFoundation } from './_starter/ColorFoundation'
import { PromptRow } from './_starter/PromptRow'
import { BRIEF_HIGHLIGHTS, FILE_MAP, PROMPTS } from './_starter/starter-data'

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

export default async function HomePage() {
  const brief = await readBrief()
  const peek = brief ? briefPeek(brief) : null
  const dsVersion = meta.package?.version ?? 'unknown'

  return (
    <Container size="xl" as="main">
      <Stack gap="2xl">
        {/* Intro — the hero: a stable welcome title (not the raw folder name,
            which reads filename-y and can be long/ugly), the project name
            demoted to a static mono Badge alongside the dev-server chrome.
            There is deliberately NO page-level light/dark toggle: the page stays
            light (see `app/providers.tsx`), and light/dark is demonstrated in the
            Live preview card, which renders a scoped specimen in either mode.
            The Lede sits OUTSIDE PageHeader's `subtitle` slot — that slot
            always wraps its content in the DS's own `<Text as="p">`, so a
            block-level child (Lede also renders a `<p>`) would nest a
            `<p>` inside a `<p>`, an invalid-HTML hydration error. Rendering
            it as the next line in the same Stack keeps the hero visually
            intact. */}
        <Stack gap="sm">
          <PageHeader
            title="Welcome to your Lando app"
            actions={
              <Inline gap="xs" wrap justify="end">
                {/* Badge, not Chip — Chip is a real button with toggle
                    semantics; this is a static label, and Badge stays
                    rsc-safe. The DS's own mono Text nested inside keeps the
                    project name legible without a hand-rolled font-family. */}
                <Badge size="sm">
                  <Text as="span" variant="mono" size="sm">
                    {{PROJECT_NAME}}
                  </Text>
                </Badge>
                <Text variant="mono" size="sm" color="var(--color-text-secondary)">
                  localhost:{{DEV_PORT}}
                </Text>
                <Badge size="sm">lando-ds {dsVersion}</Badge>
              </Inline>
            }
          />
          <Lede>
            This is a live Next.js app on the Lando Design System — pick a brand color, hand it to your
            AI, then delete this page.
          </Lede>
        </Stack>

        {/* Getting started with your colors — iron out your colours, see
            them on real components, copy the CSS. */}
        <Stack gap="lg" as="section" id="colors">
          <Stack gap="xs">
            <Heading level={2} variant="section">
              Getting started with your colors
            </Heading>
            <Text color="var(--color-text-secondary)">
              Pick or paste a primary. We keep it readable, derive the rest, and show you the result on
              the actual design system — not a screenshot.
            </Text>
          </Stack>
          <ColorFoundation />
        </Stack>

        {/* Bridge — carries the artifact you just copied into the next step,
            in the colour you just picked (Callout's `primary` accent reads
            `--color-primary`). */}
        <Callout accent="primary" icon={<ArrowRight size={16} />}>
          Palette locked in. Now hand the wheel to your AI — it already knows this design system via
          the MCP.
        </Callout>

        {/* Getting started with your AI — the handoff. A slim brief, then
            the call-to-action. */}
        <Stack gap="lg" as="section" id="handoff">
          <Heading level={2} variant="section">
            Getting started with your AI — the handoff
          </Heading>

          {brief ? (
            <Stack gap="sm">
              <Text color="var(--color-text-secondary)">
                Your AI reads{' '}
                <Text as="span" variant="mono">
                  AGENTS.md
                </Text>{' '}
                before it writes code. {peek}
              </Text>
              <List variant="unordered" spacing="sm">
                {BRIEF_HIGHLIGHTS.map((h) => (
                  <ListItem key={h}>
                    <Text size="sm" color="var(--color-text-secondary)">
                      {h}
                    </Text>
                  </ListItem>
                ))}
              </List>
            </Stack>
          ) : (
            <Text color="var(--color-text-secondary)">
              No{' '}
              <Text as="span" variant="mono">
                AGENTS.md
              </Text>{' '}
              in this project — it was scaffolded with{' '}
              <Text as="span" variant="mono">
                --no-mcp
              </Text>
              , so no AI brief was written.
            </Text>
          )}

          <Callout accent="info" label="Hand off" icon={<Bot size={16} />}>
            Open this folder in Claude Code or Cursor —{' '}
            <Text as="span" variant="mono">
              .mcp.json
            </Text>{' '}
            and the{' '}
            <Text as="span" variant="mono">
              nextjs-lando-ds
            </Text>{' '}
            agent are already wired — and paste one:
          </Callout>

          <Card>
            <CardHeader>
              <CardTitle>Starter prompts</CardTitle>
            </CardHeader>
            <CardBody>
              <List variant="plain" spacing="sm">
                {PROMPTS.map((p) => (
                  <PromptRow key={p} prompt={p} />
                ))}
              </List>
            </CardBody>
          </Card>
        </Stack>

        <Divider />

        {/* (Advanced customization lands here in #40 — natural slot between
            the handoff and the file map, deliberately left empty.) */}

        {/* Getting to know the app. One thin file map, not a tutorial. */}
        <Stack gap="md" as="section" id="app">
          <Heading level={2} variant="section">
            Getting to know the app
          </Heading>
          <Card>
            <CardBody>
              <List variant="plain" spacing="md" divider>
                {FILE_MAP.map((f) => (
                  <ListItem key={f.path}>
                    <Stack gap="xs">
                      <Text as="span" variant="mono" size="sm">
                        {f.path}
                      </Text>
                      <Text size="sm" color="var(--color-text-secondary)">
                        {f.owns}
                      </Text>
                    </Stack>
                  </ListItem>
                ))}
              </List>
            </CardBody>
          </Card>
        </Stack>

        {/* Exit. This page's success condition is its own deletion. */}
        <Stack gap="md" as="section">
          <Divider />
          <Text size="sm" color="var(--color-text-secondary)">
            Done looking? Replace the contents of{' '}
            <Text as="span" variant="mono">
              app/page.tsx
            </Text>{' '}
            (and delete{' '}
            <Text as="span" variant="mono">
              app/_starter/
            </Text>
            ) — this page is a starting point, not furniture.
          </Text>
        </Stack>
      </Stack>
    </Container>
  )
}
