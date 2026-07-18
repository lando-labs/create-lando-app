'use client'

/**
 * The result, on real components — live, not a screenshot. `previewVars` is
 * applied as inline style on the card body's inner Stack, so everything
 * inside re-colours from the palette computed in `ColorFoundation`. Primary
 * leads: it's the one role that visibly recolours a filled component, so
 * it's the star here — secondary/accent are proven as swatches with their
 * resolved hex, not faked onto components the DS deliberately keeps neutral.
 *
 * Delete this file when you replace the starter page.
 */
import type { CSSProperties } from 'react'
import { Card } from '@lando-labs/lando-ds/components/Card/Card'
import { CardHeader } from '@lando-labs/lando-ds/components/Card/CardHeader'
import { CardTitle } from '@lando-labs/lando-ds/components/Card/CardTitle'
import { CardBody } from '@lando-labs/lando-ds/components/Card/CardBody'
import { Stack } from '@lando-labs/lando-ds/components/Stack/Stack'
import { Inline } from '@lando-labs/lando-ds/components/Inline/Inline'
import { Text } from '@lando-labs/lando-ds/components/Text/Text'
import { Button } from '@lando-labs/lando-ds/components/Button/Button'
import { Alert } from '@lando-labs/lando-ds/components/Alert/Alert'
import { ColorSwatch } from '@lando-labs/lando-ds/components/ColorSwatch/ColorSwatch'
import type { AccessibleColor } from './color'

export interface PalettePreviewProps {
  accessible: AccessibleColor
  resolvedSecondaryHex: string
  resolvedAccentHex: string
  previewVars: Record<string, string>
  /** Whether the harmony customiser is open — gates the "derived roles" caption. */
  showHarmonyCaption: boolean
}

export function PalettePreview({
  accessible,
  resolvedSecondaryHex,
  resolvedAccentHex,
  previewVars,
  showHarmonyCaption,
}: PalettePreviewProps) {
  return (
    <Card variant="elevated">
      <CardHeader>
        <CardTitle>Live preview</CardTitle>
      </CardHeader>
      <CardBody>
        <Stack gap="lg" style={previewVars as CSSProperties}>
          <Inline gap="sm" wrap>
            <Button variant="primary" size="lg">
              Primary action
            </Button>
            <Button variant="outline">Outline</Button>
          </Inline>

          <Inline gap="lg" align="start" wrap>
            <ColorSwatch
              size="lg"
              color="var(--color-primary)"
              aria-label="Primary colour preview"
              label={
                <Stack gap="none">
                  <Text size="sm">Primary</Text>
                  <Text as="span" variant="mono" size="sm">
                    {accessible.hex}
                  </Text>
                </Stack>
              }
            />
            <ColorSwatch
              size="md"
              color="var(--color-secondary)"
              aria-label="Secondary colour preview"
              label={
                <Stack gap="none">
                  <Text size="sm">Secondary</Text>
                  <Text as="span" variant="mono" size="sm">
                    {resolvedSecondaryHex}
                  </Text>
                </Stack>
              }
            />
            <ColorSwatch
              size="md"
              color="var(--color-accent)"
              aria-label="Accent colour preview"
              label={
                <Stack gap="none">
                  <Text size="sm">Accent</Text>
                  <Text as="span" variant="mono" size="sm">
                    {resolvedAccentHex}
                  </Text>
                </Stack>
              }
            />
          </Inline>
          {showHarmonyCaption ? (
            <Text size="sm" color="var(--color-text-secondary)">
              Secondary and accent are derived supporting roles you consume manually — the DS keeps filled
              components primary-only by design, so look-alike swatches under a Tonal ramp are expected, not
              broken.
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
