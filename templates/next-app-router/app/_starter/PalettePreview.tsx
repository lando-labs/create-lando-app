'use client'

/**
 * The live preview — real DS components, scoped to the generated theme via
 * `<ThemeScope>` (DS issue #36, built on DS #11).
 *
 * Unlike the page-level-only model this replaces (#34), the preview does NOT
 * rely on `:root` carrying your theme — `ColorFoundation` may have `:root` on
 * the neutral slate baseline instead (see its file-level comment). The WHOLE
 * card is wrapped in `<ThemeScope theme={theme} mode={previewMode}>`, which — as
 * of DS #11 — re-derives the tonal ramp AND the hover/active interaction-state
 * tokens against ITS OWN scoped base colours, not `:root`'s. So every
 * `var(--color-…)` read below is truthful for whatever `theme` this card was
 * handed, regardless of what the page around it is wearing. Nothing in this file
 * writes a CSS variable by hand.
 *
 * The scope wraps the card rather than the card's body on purpose. `ThemeScope`
 * is a *token* scope — it sets custom properties on its wrapper and paints no
 * surface of its own — so anything left outside it (the card's surface, border,
 * header and controls) would keep rendering in the PAGE's theme, and flipping
 * the preview to dark would leave a light specimen on a dark card. Wrapping the
 * card makes the panel swap as one unit and lets the card paint its background
 * from this scope's `--color-surface`.
 *
 * The card header carries two controls: "Preview" flips this card's own
 * light/dark mode (via `previewMode`/`onTogglePreviewMode`), and "Apply to page"
 * (via `applyToPage`/`onToggleApplyToPage`) hands off to `ColorFoundation` to
 * reskin `:root` with this same theme. They sit inside the scope so they swap
 * with it.
 *
 * The preview's own toggle drives this scope; the page starts light
 * (`app/providers.tsx`). When "Apply to page" is on, `ColorFoundation` also carries
 * this mode onto `:root`, so a dark preview darkens the whole page — kept in sync,
 * so the page is dark only while every scope on it is dark too. That sidesteps the
 * one direction the DS still mis-renders — a light scope inside a dark page, since
 * dark styling is an additive `[data-theme='dark']` override with no light
 * counterpart to undo it (lando-labs/lando-ds#92) — because a light-on-dark nesting
 * never occurs: unapplied the page is light (light-page → dark-scope, which works),
 * and applied the page mode matches the preview's.
 *
 * Delete this file when you replace the starter page.
 */
import type { ReactNode } from 'react'
import type { ResolvedTheme } from '@lando-labs/lando-ds'
import { ThemeScope } from '@lando-labs/lando-ds/components/ThemeScope/ThemeScope'
import { Card } from '@lando-labs/lando-ds/components/Card/Card'
import { CardHeader } from '@lando-labs/lando-ds/components/Card/CardHeader'
import { CardTitle } from '@lando-labs/lando-ds/components/Card/CardTitle'
import { CardBody } from '@lando-labs/lando-ds/components/Card/CardBody'
import { Box } from '@lando-labs/lando-ds/components/Box/Box'
import { Stack } from '@lando-labs/lando-ds/components/Stack/Stack'
import { Inline } from '@lando-labs/lando-ds/components/Inline/Inline'
import { Text } from '@lando-labs/lando-ds/components/Text/Text'
import { Accordion } from '@lando-labs/lando-ds/components/Accordion/Accordion'
import { AccordionItem } from '@lando-labs/lando-ds/components/Accordion/AccordionItem'
import { Button } from '@lando-labs/lando-ds/components/Button/Button'
import { Badge } from '@lando-labs/lando-ds/components/Badge/Badge'
import { Alert } from '@lando-labs/lando-ds/components/Alert/Alert'
import { Input } from '@lando-labs/lando-ds/components/Input/Input'
import { Select } from '@lando-labs/lando-ds/components/Select/Select'
import { Switch } from '@lando-labs/lando-ds/components/Switch/Switch'
import { Progress } from '@lando-labs/lando-ds/components/Progress/Progress'
import { Divider } from '@lando-labs/lando-ds/components/Divider/Divider'
import { ColorSwatch } from '@lando-labs/lando-ds/components/ColorSwatch/ColorSwatch'
import { DetailCardSpecimen } from './DetailCardSpecimen'
import type { ProductTheme } from './color'

/** The surface ladder — reads the scope's `:root`-shadowing vars, so it's
 * truthful for whatever theme this card was handed. */
const SURFACE_LADDER: ReadonlyArray<{ token: string; label: string }> = [
  { token: 'background', label: 'Background' },
  { token: 'surface', label: 'Surface' },
  { token: 'border-subtle', label: 'Border · subtle' },
  { token: 'border-default', label: 'Border · default' },
  { token: 'border-strong', label: 'Border · strong' },
  { token: 'text-secondary', label: 'Text · secondary' },
  { token: 'text-primary', label: 'Text · primary' },
]

/** The brand tonal ramp + interaction-state steps DS #11 re-derives per scope
 * (verified empirically against `@lando-labs/lando-ds@0.59.0`). */
const RAMP_STEPS: ReadonlyArray<{ step: string; label: string }> = [
  { step: 'lightest', label: 'Lightest' },
  { step: 'lighter', label: 'Lighter' },
  { step: 'light', label: 'Light' },
  { step: 'dark', label: 'Dark' },
  { step: 'darker', label: 'Darker' },
  { step: 'darkest', label: 'Darkest' },
  { step: 'hover', label: 'Hover' },
  { step: 'active', label: 'Active' },
]

const PLAN_OPTIONS = [
  { label: 'Starter', value: 'starter' },
  { label: 'Pro', value: 'pro' },
  { label: 'Enterprise', value: 'enterprise' },
]

/**
 * The DS `AccordionItem` renders its content with zero padding (it leaves
 * insets to the consumer), so each section's body would otherwise sit flush
 * against the trigger and the panel's left edge. Wrap every body in a padded
 * `Box` — horizontal inset matches the trigger, plus breathing room top/bottom.
 */
function ItemBody({ children }: { children: ReactNode }) {
  return (
    <Box paddingTop="sm" paddingBottom="lg" paddingLeft="lg" paddingRight="lg">
      <Stack gap="md">{children}</Stack>
    </Box>
  )
}

/** One role's tonal ramp: base + every re-derived step, each a truthful
 * `var(--color-<role>-<step>)` read inside the enclosing `ThemeScope`. */
function RoleRamp({ role, label }: { role: 'primary' | 'secondary'; label: string }) {
  return (
    <Stack gap="xs">
      <Text size="sm" weight="semibold">
        {label}
      </Text>
      <Inline gap="sm" wrap>
        <ColorSwatch color={`var(--color-${role})`} label="Base" size="sm" />
        {RAMP_STEPS.map((s) => (
          <ColorSwatch key={s.step} color={`var(--color-${role}-${s.step})`} label={s.label} size="sm" />
        ))}
      </Inline>
    </Stack>
  )
}

export interface PalettePreviewProps {
  /** The generated `ProductTheme` — always rendered here, regardless of
   * whether it's also applied to the page (see `applyToPage`). */
  theme: ProductTheme
  /** This card's own light/dark mode, independent of the page's. */
  previewMode: ResolvedTheme
  onTogglePreviewMode: () => void
  /** Whether `theme` is ALSO applied at the page's `:root`. */
  applyToPage: boolean
  onToggleApplyToPage: () => void
}

export function PalettePreview({
  theme,
  previewMode,
  onTogglePreviewMode,
  applyToPage,
  onToggleApplyToPage,
}: PalettePreviewProps) {
  // `accent`/`secondary` are always flat hexes (only surface tokens are
  // mode-aware — see `ThemeColor` in `./color`), but the guard keeps this
  // honest against the type rather than asserting it. Only `primary` is
  // overridden below: DS #11 re-derives ITS ramp + hover/active from that one
  // value, while the rest (surfaces, the other brand role, etc.) keep falling
  // through to the outer preview scope. Used by the "Using secondary &
  // accent" section's Pattern 2 (ThemeScope re-skin) demos.
  const accentColor = theme.tokens.color?.accent
  const accentHex = typeof accentColor === 'string' ? accentColor : undefined
  const accentTheme: ProductTheme | undefined = accentHex
    ? { name: 'accent-demo', tokens: { color: { primary: accentHex } } }
    : undefined

  const secondaryColor = theme.tokens.color?.secondary
  const secondaryHex = typeof secondaryColor === 'string' ? secondaryColor : undefined
  const secondaryTheme: ProductTheme | undefined = secondaryHex
    ? { name: 'secondary-demo', tokens: { color: { primary: secondaryHex } } }
    : undefined

  return (
    // The scope wraps the ENTIRE card, not just its body: `ThemeScope` is a
    // *token* scope (it sets `--color-*` + `data-theme` on its wrapper and paints
    // no surface of its own), so anything left outside it — the card's surface,
    // border, header and controls — would keep rendering in the PAGE's theme and
    // you'd get, say, a light specimen sitting on a dark card. Wrapping the card
    // makes the whole panel swap as one unit, and the card then paints its
    // background from this scope's `--color-surface`.
    <ThemeScope theme={theme} mode={previewMode}>
      <Card variant="elevated">
        <CardHeader
          actions={
            <Inline gap="md" wrap align="center">
              <Button
                variant="ghost"
                size="sm"
                onClick={onTogglePreviewMode}
                aria-label="Toggle the preview's light or dark mode — independent of the page"
              >
                {previewMode === 'dark' ? 'Preview: ☾ Dark' : 'Preview: ☀ Light'}
              </Button>
              <Switch label="Apply to page" checked={applyToPage} onChange={() => onToggleApplyToPage()} />
            </Inline>
          }
        >
          <CardTitle>Live preview</CardTitle>
        </CardHeader>
        <CardBody>
          <Stack gap="lg">
            {/* Roles, the surface ladder, then the brand tonal ramps — all
                read directly off this scope, so this reference is honest
                about your theme regardless of what the page is wearing. */}
            <Stack gap="sm">
              <Inline gap="lg" wrap>
                <ColorSwatch color="var(--color-primary)" label="Primary" size="lg" />
                <ColorSwatch color="var(--color-secondary)" label="Secondary" size="lg" />
                <ColorSwatch color="var(--color-accent)" label="Accent" size="lg" />
              </Inline>
              <Inline gap="md" wrap>
                {SURFACE_LADDER.map((s) => (
                  <ColorSwatch key={s.token} color={`var(--color-${s.token})`} label={s.label} size="sm" />
                ))}
              </Inline>
              <RoleRamp role="primary" label="Primary ramp" />
              <RoleRamp role="secondary" label="Secondary ramp" />
            </Stack>

            {/* The specimens sit on a `--color-background` canvas so the Surface
                tint is visible here WITHOUT needing "Apply to page". The elevated
                Card wrapping this preview paints `--color-surface`, which is pure
                white in light mode (`L: 1.0` — the tint is a hue/chroma nudge at
                fixed lightness, and nothing shows at L=1.0), so the tint only ever
                lands on `--color-background` and the borders. Painting that
                background behind the cards mirrors how they'd sit on the real page,
                and makes the tint legible in both light and dark. */}
            <Box background="var(--color-background)" borderRadius="lg" padding="sm">
            <Accordion type="multiple" defaultValue={['actions']}>
              <AccordionItem value="actions" title="Actions & controls">
                <ItemBody>
                  <DetailCardSpecimen />
                </ItemBody>
              </AccordionItem>

              <AccordionItem value="status" title="Status & feedback">
                <ItemBody>
                  <Inline gap="xs" wrap>
                    <Badge variant="primary">Primary</Badge>
                    <Badge variant="success">Success</Badge>
                    <Badge variant="warning">Warning</Badge>
                    <Badge variant="danger">Danger</Badge>
                    <Badge variant="info">Info</Badge>
                  </Inline>
                  <Progress value={62} color="primary" label="Uploading" showValue />
                  <Alert variant="success" inline title="Saved">
                    Your changes are live.
                  </Alert>
                  <Alert variant="error" inline title="Error">
                    Danger stays red.
                  </Alert>
                </ItemBody>
              </AccordionItem>

              <AccordionItem value="forms" title="Forms & inputs">
                <ItemBody>
                  <Input label="Email" placeholder="you@example.com" />
                  <Input
                    label="Password"
                    type="password"
                    defaultValue="not-a-password"
                    error="Needs at least 8 characters"
                  />
                  <Select label="Plan" options={PLAN_OPTIONS} defaultValue="pro" placeholder="Choose a plan" />
                </ItemBody>
              </AccordionItem>

              <AccordionItem value="brand-tokens" title="Using secondary & accent">
                <ItemBody>
                  {/* Pattern 1 — token-direct. Neither role is read by most DS
                      components (Badge/Spinner are the rare secondary
                      opt-ins; nothing reads accent), so on YOUR OWN
                      components you apply the token directly — that's the
                      idiomatic path, and it's just a DS Box/Text with a
                      `var(--color-…)` foreground or fill. Lead with this. */}
                  <Stack gap="sm">
                    <Text size="sm" color="var(--color-text-secondary)">
                      Neither <Text as="span" weight="medium">secondary</Text> nor{' '}
                      <Text as="span" weight="medium">accent</Text> is read by most DS components —
                      Badge and Spinner opt into secondary; nothing reads accent. On your own
                      components, apply either token directly with{' '}
                      <Text as="span" variant="mono" size="sm">
                        var(--color-secondary)
                      </Text>{' '}
                      or{' '}
                      <Text as="span" variant="mono" size="sm">
                        var(--color-accent)
                      </Text>{' '}
                      on a DS <Text as="span" weight="medium">Box</Text> or{' '}
                      <Text as="span" weight="medium">Text</Text>.
                    </Text>

                    <Inline gap="lg" wrap align="start">
                      <Stack gap="xs">
                        <Text size="sm" weight="semibold">
                          Accent
                        </Text>
                        <Text size="lg" weight="semibold">
                          Ship it{' '}
                          <Text as="span" size="lg" weight="bold" color="var(--color-accent)">
                            today
                          </Text>
                          .
                        </Text>
                      </Stack>

                      <Stack gap="xs">
                        <Text size="sm" weight="semibold">
                          Secondary
                        </Text>
                        <Box border borderRadius="md" padding="sm">
                          <Text as="span" size="sm" weight="semibold" color="var(--color-secondary)">
                            Beta
                          </Text>
                          <Text size="sm" color="var(--color-text-secondary)">
                            Early access — behaviour may change before general availability.
                          </Text>
                        </Box>
                      </Stack>
                    </Inline>
                  </Stack>

                  <Divider spacing="sm" />

                  {/* Pattern 2 — ThemeScope re-skin. The power move, but a
                      workaround: it hijacks `primary` inside the scope so
                      every nested DS component (ramps, hover/active — DS
                      #11) inherits the role truthfully. Not the everyday
                      path — Pattern 1 above is. */}
                  <Stack gap="sm">
                    <Text size="sm" color="var(--color-text-secondary)">
                      The power move: a <Text as="span" weight="medium">ThemeScope</Text> that remaps{' '}
                      <Text as="span" variant="mono" size="sm">
                        primary
                      </Text>{' '}
                      to your secondary or accent hex — every DS component inside inherits it
                      truthfully, ramps and hover/active states included (DS #11). This hijacks{' '}
                      <Text as="span" weight="medium">primary</Text> within the scope — a workaround,
                      not the everyday path. Reach for the pattern above first.
                    </Text>

                    {/* Stacked, not side-by-side: `DetailCardSpecimen` is a
                        full specimen (SegmentedControl + a 4-button row), so
                        two of them in an `Inline` would just get squeezed
                        rather than wrap — there's no natural min-width to
                        trigger a wrap onto a new line. */}
                    <Stack gap="lg">
                      <Stack gap="xs">
                        <Text size="sm" weight="semibold">
                          Secondary-scoped
                        </Text>
                        {secondaryTheme ? (
                          <ThemeScope theme={secondaryTheme} mode={previewMode}>
                            <DetailCardSpecimen />
                          </ThemeScope>
                        ) : (
                          <DetailCardSpecimen />
                        )}
                      </Stack>

                      <Stack gap="xs">
                        <Text size="sm" weight="semibold">
                          Accent-scoped
                        </Text>
                        {accentTheme ? (
                          <ThemeScope theme={accentTheme} mode={previewMode}>
                            <DetailCardSpecimen />
                          </ThemeScope>
                        ) : (
                          <DetailCardSpecimen />
                        )}
                      </Stack>
                    </Stack>
                  </Stack>
                </ItemBody>
              </AccordionItem>
            </Accordion>
            </Box>
          </Stack>
        </CardBody>
      </Card>
    </ThemeScope>
  )
}
