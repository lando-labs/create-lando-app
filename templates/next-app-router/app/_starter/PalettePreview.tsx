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
import { Card } from '@lando-labs/lando-ds/components/Card/Card'
import { CardHeader } from '@lando-labs/lando-ds/components/Card/CardHeader'
import { CardTitle } from '@lando-labs/lando-ds/components/Card/CardTitle'
import { CardBody } from '@lando-labs/lando-ds/components/Card/CardBody'
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

const VIEW_OPTIONS: SegmentedControlOption[] = [
  { value: 'list', label: 'List' },
  { value: 'grid', label: 'Grid' },
  { value: 'table', label: 'Table' },
]

const PLAN_OPTIONS = [
  { label: 'Starter', value: 'starter' },
  { label: 'Pro', value: 'pro' },
  { label: 'Enterprise', value: 'enterprise' },
]

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
              <Stack gap="md">
                <Inline gap="sm" wrap>
                  <Button variant="primary">Primary</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="outline">Outline</Button>
                  <Button variant="danger">Delete</Button>
                </Inline>
                <SegmentedControl options={VIEW_OPTIONS} defaultValue="list" />
                <Switch label="Enable notifications" defaultChecked />
              </Stack>
            </AccordionItem>

            <AccordionItem value="status" title="Status & feedback">
              <Stack gap="md">
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
              </Stack>
            </AccordionItem>

            <AccordionItem value="forms" title="Forms & inputs">
              <Stack gap="md">
                <Input label="Email" placeholder="you@example.com" />
                <Input
                  label="Password"
                  type="password"
                  defaultValue="not-a-password"
                  error="Needs at least 8 characters"
                />
                <Select label="Plan" options={PLAN_OPTIONS} defaultValue="pro" placeholder="Choose a plan" />
              </Stack>
            </AccordionItem>

            <AccordionItem value="accent" title="Accent in context">
              <Stack gap="md">
                <AccentSpotlight />
                <Text size="sm" color="var(--color-text-secondary)">
                  Accent is a token for <Text as="span" weight="medium">your own</Text> components to
                  consume — nothing in the DS base reads it, which is why it gets a purpose-built demo
                  instead of a spot in the button/badge/alert galleries above.
                </Text>
              </Stack>
            </AccordionItem>
          </Accordion>
        </Stack>
      </CardBody>
    </Card>
  )
}
