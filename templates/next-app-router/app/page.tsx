// The getting-started page.
//
// One path, thin frame: iron out your colours, hand off to your AI. This is a
// Server Component — it reads your AGENTS.md off disk at build time for the
// handoff section's brief peek. Only the interactive parts (colour
// foundation, prompt copy buttons) are client components, in `./_starter`.
//
// This page is meant to be deleted. Replace it with your app — everything it
// shows you is either in a file you now know about, or one MCP query away.
import { Fragment } from 'react'
import type { ReactNode } from 'react'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { ArrowRight, Bot, Sparkles } from 'lucide-react'
import { Container } from '@lando-labs/lando-ds/components/Container/Container'
import { Stack } from '@lando-labs/lando-ds/components/Stack/Stack'
import { Grid } from '@lando-labs/lando-ds/components/Grid/Grid'
import { Inline } from '@lando-labs/lando-ds/components/Inline/Inline'
import { Box } from '@lando-labs/lando-ds/components/Box/Box'
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
import { Accordion } from '@lando-labs/lando-ds/components/Accordion/Accordion'
import { AccordionItem } from '@lando-labs/lando-ds/components/Accordion/AccordionItem'
import meta from '@lando-labs/lando-ds/meta'
import { ColorFoundation } from './_starter/ColorFoundation'
import { PromptRow } from './_starter/PromptRow'
import {
  BRIEF_HIGHLIGHTS,
  COMPOSE_PROMPTS,
  FILE_MAP,
  GO_DEEPER_LINKS,
  HANDOFF_PROMPT,
  ORIENT_PROMPT,
  PROMPTS,
  REFINE_PROMPTS,
} from './_starter/starter-data'

/**
 * The 5-part arc's quick-link nav (#41) — one row, pure anchors, zero client
 * JS. `Text as="a"` (not `Button as="a"`) because `Button` is a DS client
 * component (rsc-safe: no, per the MCP); a static in-page anchor doesn't need
 * a client boundary, and `Text`'s `link` variant already supplies the
 * link affordance (color, hover underline, focus ring) `as="a"` needs.
 */
const QUICK_LINKS: ReadonlyArray<{ href: string; label: string }> = [
  { href: '#colors', label: '1 Colors' },
  { href: '#handoff', label: '2 Hand off to AI' },
  { href: '#refine', label: '3 Keep refining' },
  { href: '#app', label: '4 The app' },
]

/**
 * Padding for an `AccordionItem`'s body — the DS leaves it at zero (insets
 * are the consumer's call), so without this the content sits flush against
 * the trigger and the panel's edges. Same pattern as
 * `_starter/PalettePreview.tsx`'s `ItemBody`.
 */
function ItemBody({ children }: { children: ReactNode }) {
  return (
    <Box paddingTop="sm" paddingBottom="lg" paddingLeft="lg" paddingRight="lg">
      <Stack gap="lg">{children}</Stack>
    </Box>
  )
}

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

        {/* Quick-link nav (#41) — names the whole 5-part arc and jumps to
            each step. Pure anchors: real `href="#…"` targets, no scrollspy,
            no smooth-scroll JS. `#refine` and `#app` resolve to their
            AccordionItem's header below — collapsed sections still land on
            a visible target, they just don't auto-expand (by design). */}
        <Inline as="nav" aria-label="Jump to a section" gap="xs" wrap align="baseline">
          <Text as="span" size="sm" color="var(--color-text-secondary)">
            Jump to:
          </Text>
          {QUICK_LINKS.map((link, i) => (
            <Fragment key={link.href}>
              {i > 0 && (
                <Text as="span" size="sm" color="var(--color-text-secondary)" aria-hidden="true">
                  ·
                </Text>
              )}
              <Text as="a" href={link.href} variant="link" size="sm">
                {link.label}
              </Text>
            </Fragment>
          ))}
        </Inline>

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
            agent are already wired — then walk these three moves, in order:
          </Callout>

          {/* The handoff is a SEQUENCE, not a flat prompt list (#51): orient the
              AI, put your theme on a real screen (the move that makes the theme
              go live and retires this page), then keep building. Each step is a
              titled Card; single-prompt steps still render the prompt through a
              List so `PromptRow`'s ListItem composes correctly. */}
          <Stack gap="md">
            <Card>
              <CardHeader>
                <CardTitle>1 · Orient your AI first</CardTitle>
              </CardHeader>
              <CardBody>
                <Stack gap="sm">
                  <Text size="sm" color="var(--color-text-secondary)">
                    Have it read the project before it writes a line — the design system, the hard
                    rules, and the tools wired in. Oriented AI writes far more idiomatic UI than a cold
                    &ldquo;build me X.&rdquo;
                  </Text>
                  <List variant="plain" spacing="sm">
                    <PromptRow prompt={ORIENT_PROMPT} />
                  </List>
                </Stack>
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>2 · Put your theme on a real screen</CardTitle>
              </CardHeader>
              <CardBody>
                <Stack gap="sm">
                  <Text size="sm" color="var(--color-text-secondary)">
                    One paste saves your theme, wires it into{' '}
                    <Text as="span" variant="mono">
                      providers.tsx
                    </Text>
                    , and replaces this page with your first real screen — the moment your theme goes
                    live. Edit the bracketed bits first (drop in your{' '}
                    <Text as="span" variant="mono">
                      Your theme
                    </Text>{' '}
                    code and the screen you want).
                  </Text>
                  <List variant="plain" spacing="sm">
                    <PromptRow prompt={HANDOFF_PROMPT} />
                  </List>
                </Stack>
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>3 · Keep building</CardTitle>
              </CardHeader>
              <CardBody>
                <Stack gap="sm">
                  <Text size="sm" color="var(--color-text-secondary)">
                    More first screens to try once you&rsquo;re rolling — or just describe what you
                    have in mind.
                  </Text>
                  <List variant="plain" spacing="sm">
                    {PROMPTS.map((p) => (
                      <PromptRow key={p} prompt={p} />
                    ))}
                  </List>
                </Stack>
              </CardBody>
            </Card>
          </Stack>
        </Stack>

        <Divider />

        {/* Advanced customization (#refine) + getting to know the app (#app)
            — collapsed by default (#41). These are the two sections a
            returning visitor re-reads, not the two a first-time visitor
            needs open — the palette and the AI handoff above stay expanded
            for that. `type="multiple"` (not the DS default `"single"`) so
            either — or both — can be open at once; omitting `defaultValue`
            starts both collapsed.

            `id="refine"` / `id="app"` sit on the `AccordionItem` itself
            (forwarded to its root wrapper `div`, which contains the trigger
            button) rather than on the content inside — that wrapper is
            always in the DOM and visible even when collapsed, so the
            quick-links above still land on a real, visible target. The
            content panel underneath stays mounted at all times too (the DS
            animates it via a height style + `aria-hidden`, it never
            unmounts), so opening it after a jump doesn't lose scroll
            position — and the smoke test can still assert on this markup
            without expanding anything. */}
        <Accordion type="multiple">
          <AccordionItem id="refine" value="refine" title="Advanced customization with your AI">
            <ItemBody>
              <Callout accent="primary" icon={<Sparkles size={16} />}>
                You don&apos;t stop at the first build. Keep steering — retune the look or build new UI,
                all with your AI.
                {brief
                  ? ' It still reads this project through the MCP, so it stays accurate as you push further.'
                  : ''}
              </Callout>

              <Grid columns={{ sm: 1, md: 2 }} gap="lg">
                <Card>
                  <CardHeader>
                    <CardTitle>Retune the look</CardTitle>
                  </CardHeader>
                  <CardBody>
                    <Stack gap="sm">
                      <Text size="sm" color="var(--color-text-secondary)">
                        Same components, new feel — each is a theme/token change, no rewrites.
                      </Text>
                      <List variant="plain" spacing="sm">
                        {REFINE_PROMPTS.map((p) => (
                          <PromptRow key={p} prompt={p} />
                        ))}
                      </List>
                    </Stack>
                  </CardBody>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Build new UI</CardTitle>
                  </CardHeader>
                  <CardBody>
                    <Stack gap="sm">
                      <Text size="sm" color="var(--color-text-secondary)">
                        Now compose primitives into something new — the AI assembles higher-level
                        components from DS parts.
                      </Text>
                      <List variant="plain" spacing="sm">
                        {COMPOSE_PROMPTS.map((p) => (
                          <PromptRow key={p} prompt={p} />
                        ))}
                      </List>
                    </Stack>
                  </CardBody>
                </Card>
              </Grid>
            </ItemBody>
          </AccordionItem>

          <AccordionItem id="app" value="app" title="Getting to know the app">
            <ItemBody>
              <Text size="sm" color="var(--color-text-secondary)">
                A Next.js App Router app — React 19, TypeScript strict — built on the Lando Design
                System.
              </Text>

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

              <Stack gap="xs">
                <Text size="sm" weight="semibold">
                  Go deeper
                </Text>
                <List variant="plain" spacing="sm">
                  {GO_DEEPER_LINKS.map((link) => (
                    <ListItem key={link.href}>
                      {/* TODO: swap the Lando Design System link for the canonical
                          docs site once it's live — this repo is an interim
                          stand-in (create-lando-app #41). */}
                      <Text
                        as="a"
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        variant="link"
                        size="sm"
                      >
                        {link.label}
                      </Text>
                    </ListItem>
                  ))}
                </List>
              </Stack>
            </ItemBody>
          </AccordionItem>
        </Accordion>

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
