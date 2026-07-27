'use client'

/**
 * A realistic, packed `DetailCard` — the shared specimen rendered by BOTH the
 * "Actions & controls" and "Using secondary & accent" accordion sections in
 * `PalettePreview`. Same composition, multiple times: once under the
 * preview's own primary/secondary, and twice more inside a nested
 * `ThemeScope` that overrides only `primary` — once with the theme's
 * secondary, once with its accent (see `PalettePreview.tsx`) — so `primary`,
 * `secondary`, `danger` and the ramp all move with whichever scope it lands
 * in, which is what makes those scoped versions honest demos (DS #11) rather
 * than a colour swatch pretending to be a component.
 *
 * `DetailCard` renders `footer || actions` (footer wins outright — see its
 * source), so the primary/outline/ghost/danger button set lives INSIDE
 * `footer`, stacked above the SegmentedControl/Switch/Progress trio, instead
 * of being split across both props where only one would ever show.
 *
 * `variant="outlined"`, not the DS default `elevated` — this card always
 * renders inside another elevated `Card` (the preview panel), so a second
 * drop shadow would double up; an outline reads as "a card within a card."
 *
 * The footer's second button is `variant="ghost"`, not `"secondary"`.
 * `Button variant="secondary"` is a false friend — in the DS's own naming it
 * means "neutral, low-emphasis," NOT the brand secondary hue (nothing in
 * `Button` reads `--color-secondary`). Demoing the brand secondary colour
 * belongs to the "Using secondary & accent" section below, not this footer.
 *
 * The `Owner` field's value is a small `Avatar` + name instead of bare text —
 * `Avatar` gradient-fills its initials from primary→secondary by default
 * (no `src`, no explicit `gradient` prop needed), so it's a genuine, unforced
 * secondary-hue consumer sitting right in this everyday card.
 *
 * Delete this file when you replace the starter page.
 */
import { DetailCard, type DetailField } from '@lando-labs/lando-ds/components/DetailCard/DetailCard'
import { Stack } from '@lando-labs/lando-ds/components/Stack/Stack'
import { Inline } from '@lando-labs/lando-ds/components/Inline/Inline'
import { Text } from '@lando-labs/lando-ds/components/Text/Text'
import { Button } from '@lando-labs/lando-ds/components/Button/Button'
import { Badge } from '@lando-labs/lando-ds/components/Badge/Badge'
import { Avatar } from '@lando-labs/lando-ds/components/Avatar/Avatar'
import { Switch } from '@lando-labs/lando-ds/components/Switch/Switch'
import { Progress } from '@lando-labs/lando-ds/components/Progress/Progress'
import { Divider } from '@lando-labs/lando-ds/components/Divider/Divider'
import {
  SegmentedControl,
  type SegmentedControlOption,
} from '@lando-labs/lando-ds/components/SegmentedControl/SegmentedControl'

// Deliberately abstract labels: this is a component demo, not a real view
// switcher — concrete labels ("List / Grid / Table") imply it does something.
const SEGMENT_OPTIONS: SegmentedControlOption[] = [
  { value: 'one', label: 'One' },
  { value: 'two', label: 'Two' },
  { value: 'three', label: 'Three' },
]

const FIELDS: DetailField[] = [
  {
    label: 'Owner',
    value: (
      <Inline gap="xs" align="center">
        <Avatar initials="PT" alt="Platform team" size="xs" />
        <Text as="span" size="sm">
          Platform team
        </Text>
      </Inline>
    ),
  },
  { label: 'Region', value: 'us-east-1' },
  { label: 'Uptime', value: '99.98%', variant: 'highlight' },
]

export function DetailCardSpecimen() {
  return (
    <DetailCard
      variant="outlined"
      title="Checkout API"
      subtitle="Production deployment"
      badges={[
        <Badge key="status" variant="success" size="sm">
          Healthy
        </Badge>,
        <Badge key="version" variant="info" size="sm">
          v2.4.1
        </Badge>,
      ]}
      fields={FIELDS}
      footer={
        <Stack gap="md">
          <Inline gap="sm" wrap>
            <Button variant="primary" size="sm">
              Redeploy
            </Button>
            <Button variant="ghost" size="sm">
              Restart
            </Button>
            <Button variant="outline" size="sm">
              View logs
            </Button>
            <Button variant="danger" size="sm">
              Decommission
            </Button>
          </Inline>
          <Divider spacing="sm" />
          <Stack gap="sm">
            <SegmentedControl options={SEGMENT_OPTIONS} defaultValue="one" aria-label="Example view switcher" />
            <Switch label="Auto-scale" defaultChecked />
            <Progress value={68} color="primary" label="Rollout" showValue />
          </Stack>
        </Stack>
      }
    />
  )
}
