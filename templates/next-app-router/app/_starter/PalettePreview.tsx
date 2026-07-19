'use client'

/**
 * The live preview — real DS components, not swatch chips. The right column is
 * wrapped in the DS `ThemeScope` primitive fed your `ProductTheme`, so the DS
 * itself resolves the ramps, hover/active states and surfaces from your palette
 * (nothing here writes a CSS variable by hand). The left column is the same
 * components at the DS default, so the customisation is legible side by side.
 *
 * Delete this file when you replace the starter page.
 */
import type { ResolvedTheme } from '@lando-labs/lando-ds'
import { ThemeScope } from '@lando-labs/lando-ds/components/ThemeScope/ThemeScope'
import { Card } from '@lando-labs/lando-ds/components/Card/Card'
import { CardHeader } from '@lando-labs/lando-ds/components/Card/CardHeader'
import { CardTitle } from '@lando-labs/lando-ds/components/Card/CardTitle'
import { CardBody } from '@lando-labs/lando-ds/components/Card/CardBody'
import { Box } from '@lando-labs/lando-ds/components/Box/Box'
import { Grid } from '@lando-labs/lando-ds/components/Grid/Grid'
import { Stack } from '@lando-labs/lando-ds/components/Stack/Stack'
import { Inline } from '@lando-labs/lando-ds/components/Inline/Inline'
import { Text } from '@lando-labs/lando-ds/components/Text/Text'
import { Button } from '@lando-labs/lando-ds/components/Button/Button'
import { Badge } from '@lando-labs/lando-ds/components/Badge/Badge'
import { Alert } from '@lando-labs/lando-ds/components/Alert/Alert'
import { Input } from '@lando-labs/lando-ds/components/Input/Input'
import { Progress } from '@lando-labs/lando-ds/components/Progress/Progress'
import { ColorSwatch } from '@lando-labs/lando-ds/components/ColorSwatch/ColorSwatch'
import type { ProductTheme } from './color'

export interface PalettePreviewProps {
  theme: ProductTheme
}

/** A compact gallery exercising primary, semantics and the surfaces. */
function SampleCluster() {
  return (
    <Stack gap="md">
      <Inline gap="sm" wrap>
        <Button variant="primary">Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="danger">Delete</Button>
      </Inline>
      <Inline gap="xs" wrap>
        <Badge variant="primary">Primary</Badge>
        <Badge variant="success">Success</Badge>
        <Badge variant="warning">Warning</Badge>
        <Badge variant="danger">Danger</Badge>
        <Badge variant="info">Info</Badge>
      </Inline>
      <Progress value={62} color="primary" label="Uploading" showValue />
      <Input label="Email" placeholder="you@example.com" />
      <Alert variant="success" inline title="Saved">
        Your changes are live.
      </Alert>
      <Alert variant="error" inline title="Error">
        Danger stays red.
      </Alert>
    </Stack>
  )
}

function roleHex(theme: ProductTheme, key: string): string {
  const v = theme.tokens.color?.[key]
  return typeof v === 'string' ? v : ''
}

/**
 * One themed panel. The DS `ThemeScope` applies the theme to this subtree only;
 * `mode` is explicit (not inherited) so server and client render the same mode —
 * that's what keeps it hydration-safe AND lets us show light + dark at once. The
 * `Box` paints the scope's own `--color-background`, so the surface tint shows.
 */
function Panel({
  label,
  mode,
  theme,
}: {
  label: string
  mode: ResolvedTheme
  theme?: ProductTheme
}) {
  return (
    <Stack gap="sm">
      <Text size="sm" weight="medium" color="var(--color-text-secondary)">
        {label}
      </Text>
      <ThemeScope mode={mode} theme={theme}>
        <Box background="var(--color-background)" border borderRadius="lg" padding="md">
          <SampleCluster />
        </Box>
      </ThemeScope>
    </Stack>
  )
}

export function PalettePreview({ theme }: PalettePreviewProps) {
  return (
    <Card variant="elevated">
      <CardHeader>
        <CardTitle>Live preview</CardTitle>
      </CardHeader>
      <CardBody>
        <Stack gap="lg">
          {/* Your three brand roles. Accent has no DS component of its own — it's
              a token for your OWN components — so it's shown as a swatch, honestly. */}
          <Inline gap="lg" wrap>
            <ColorSwatch color={roleHex(theme, 'primary')} label="Primary" size="lg" />
            <ColorSwatch color={roleHex(theme, 'secondary')} label="Secondary" size="lg" />
            <ColorSwatch color={roleHex(theme, 'accent')} label="Accent" size="lg" />
          </Inline>

          {/* The DS default, then your theme in both modes — same components, so
              the customisation (and the theme-adjacent light/dark) is legible. */}
          <Grid columns={{ md: 2, lg: 3 }} gap="lg" align="start">
            <Panel label="DS default" mode="light" />
            <Panel label="Your theme · light" mode="light" theme={theme} />
            <Panel label="Your theme · dark" mode="dark" theme={theme} />
          </Grid>
        </Stack>
      </CardBody>
    </Card>
  )
}
