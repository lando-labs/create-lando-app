'use client'

/**
 * The live preview — real DS components, not swatch chips or a scoped
 * `ThemeScope`. `ColorFoundation` applies the generated `ProductTheme` at the
 * document root (see its file-level comment), so everything rendered here
 * simply inherits the live `:root` — the DS itself resolves the ramps,
 * hover/active states and surfaces from your palette. Nothing in this file
 * writes a CSS variable by hand; every colour below is a `var(--color-…)`
 * reference that resolves to whatever `ColorFoundation` currently has
 * applied.
 *
 * Delete this file when you replace the starter page.
 */
import type { ReactNode } from 'react'
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
import { ColorSwatch } from '@lando-labs/lando-ds/components/ColorSwatch/ColorSwatch'
import {
  SegmentedControl,
  type SegmentedControlOption,
} from '@lando-labs/lando-ds/components/SegmentedControl/SegmentedControl'
import { AccentSpotlight } from './AccentSpotlight'

/** The surface ladder — reads the live `:root` vars, so it's truthful under
 * whatever theme is currently applied (DS default, or your generated one). */
const SURFACE_LADDER: ReadonlyArray<{ token: string; label: string }> = [
  { token: 'background', label: 'Background' },
  { token: 'surface', label: 'Surface' },
  { token: 'border-subtle', label: 'Border · subtle' },
  { token: 'border-default', label: 'Border · default' },
  { token: 'border-strong', label: 'Border · strong' },
  { token: 'text-secondary', label: 'Text · secondary' },
  { token: 'text-primary', label: 'Text · primary' },
]

// Deliberately abstract labels: this is a component demo, not a real view
// switcher — concrete labels ("List / Grid / Table") imply it does something.
const SEGMENT_OPTIONS: SegmentedControlOption[] = [
  { value: 'one', label: 'One' },
  { value: 'two', label: 'Two' },
  { value: 'three', label: 'Three' },
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

export function PalettePreview() {
  return (
    <Card variant="elevated">
      <CardHeader>
        <CardTitle>Live preview</CardTitle>
      </CardHeader>
      <CardBody>
        <Stack gap="lg">
          {/* Roles, then the surface ladder underneath them — both read
              directly off the live `:root`, so this reference is honest
              about what's actually applied right now. */}
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
          </Stack>

          <Accordion type="multiple" defaultValue={['actions']}>
            <AccordionItem value="actions" title="Actions & controls">
              <ItemBody>
                <Inline gap="sm" wrap>
                  <Button variant="primary">Primary</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="outline">Outline</Button>
                  <Button variant="danger">Delete</Button>
                </Inline>
                <SegmentedControl options={SEGMENT_OPTIONS} defaultValue="one" />
                <Switch label="Enable notifications" defaultChecked />
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

            <AccordionItem value="accent" title="Accent in context">
              <ItemBody>
                <AccentSpotlight />
                <Text size="sm" color="var(--color-text-secondary)">
                  Accent is a token for <Text as="span" weight="medium">your own</Text> components to
                  consume — nothing in the DS base reads it, which is why it gets a purpose-built demo
                  instead of a spot in the button/badge/alert galleries above.
                </Text>
              </ItemBody>
            </AccordionItem>
          </Accordion>
        </Stack>
      </CardBody>
    </Card>
  )
}
