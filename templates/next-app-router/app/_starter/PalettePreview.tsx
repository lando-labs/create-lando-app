'use client'

/**
 * The result, on real components — live, not a screenshot. The palette (from
 * `ColorFoundation`) plus the current mode's brand-tinted surfaces are applied
 * as custom properties on the card body's inner Stack, so everything inside —
 * the buttons, the full derived ramps, the surface swatches — re-colours from
 * them. Primary leads on the filled button; the ramps show the whole system
 * your one colour generates.
 *
 * Delete this file when you replace the starter page.
 */
import type { CSSProperties } from 'react'
import { useTheme } from '@lando-labs/lando-ds'
import { useMounted } from '@lando-labs/lando-ds/hooks'
import { Card } from '@lando-labs/lando-ds/components/Card/Card'
import { CardHeader } from '@lando-labs/lando-ds/components/Card/CardHeader'
import { CardTitle } from '@lando-labs/lando-ds/components/Card/CardTitle'
import { CardBody } from '@lando-labs/lando-ds/components/Card/CardBody'
import { Stack } from '@lando-labs/lando-ds/components/Stack/Stack'
import { Inline } from '@lando-labs/lando-ds/components/Inline/Inline'
import { Text } from '@lando-labs/lando-ds/components/Text/Text'
import { Button } from '@lando-labs/lando-ds/components/Button/Button'
import { Alert } from '@lando-labs/lando-ds/components/Alert/Alert'
import { PaletteRamps } from './PaletteRamps'
import { surfaceVars, type Oklch, type TintStrength } from './color'

export interface PalettePreviewProps {
  primary: Oklch
  tint: TintStrength
  previewVars: Record<string, string>
  /** Whether the harmony customiser is open — gates the "derived roles" caption. */
  showHarmonyCaption: boolean
}

export function PalettePreview({ primary, tint, previewVars, showHarmonyCaption }: PalettePreviewProps) {
  const { theme } = useTheme()
  const mounted = useMounted()
  // The tint depends on the resolved light/dark mode, which the server can't
  // know — so render untinted until mounted (matching the server), then resolve
  // for the real mode. Same reasoning as the theme toggle's neutral label.
  const surface = mounted ? surfaceVars(primary, tint, theme === 'dark' ? 'dark' : 'light') : {}
  const wrapperStyle = { ...previewVars, ...surface } as CSSProperties

  return (
    <Card variant="elevated">
      <CardHeader>
        <CardTitle>Live preview</CardTitle>
      </CardHeader>
      <CardBody>
        <Stack gap="lg" style={wrapperStyle}>
          <Inline gap="sm" wrap>
            <Button variant="primary" size="lg">
              Primary action
            </Button>
            <Button variant="outline">Outline</Button>
          </Inline>

          <PaletteRamps />

          {/* A miniature of the actual themed surface — reads the (possibly
              tinted) background/surface/text/border tokens, so it visibly leans
              toward the brand and flips with the light/dark toggle. This is what
              makes "theme-adjacent" legible, vs. the abstract swatch row above. */}
          <div
            style={{
              background: 'var(--color-background)',
              border: '1px solid var(--color-border-default)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--spacing-md)',
            }}
          >
            <Stack gap="sm">
              <Text size="sm" color="var(--color-text-secondary)">
                Your surfaces, this mode
              </Text>
              <div
                style={{
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: 'var(--spacing-md)',
                }}
              >
                <Stack gap="xs">
                  <Text weight="medium">Surface card</Text>
                  <Text size="sm" color="var(--color-text-secondary)">
                    Background, surface, text and borders lean toward your brand — toggle light/dark to see
                    both.
                  </Text>
                </Stack>
              </div>
            </Stack>
          </div>

          {showHarmonyCaption ? (
            <Text size="sm" color="var(--color-text-secondary)">
              Secondary and accent are derived supporting roles — the DS keeps filled components primary-only
              by design, so you apply these yourself via <Text as="span" variant="mono">var(--color-secondary)</Text>{' '}
              and <Text as="span" variant="mono">var(--color-accent)</Text> in your own components.
            </Text>
          ) : null}

          <Stack gap="sm">
            <Alert variant="success" inline title="Success">
              Harmonised toward your brand — still reads green.
            </Alert>
            <Alert variant="warning" inline title="Warning">
              Nudged toward your brand — still reads amber.
            </Alert>
            <Alert variant="info" inline title="Info">
              Tuned toward your brand — still reads blue.
            </Alert>
            <Alert variant="error" inline title="Error">
              Untouched. Danger stays red — there&rsquo;s no override for it.
            </Alert>
          </Stack>
        </Stack>
      </CardBody>
    </Card>
  )
}
