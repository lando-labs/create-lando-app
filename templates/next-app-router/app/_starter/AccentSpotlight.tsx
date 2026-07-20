/**
 * A purpose-built demo of the `accent` role. Nothing in the DS's own
 * components consumes `--color-accent` — it exists for the components YOU
 * build — so the honest way to show it is a small custom composition, not a
 * DS component prop. Built entirely from DS primitives (`Box`/`Stack`/
 * `Inline`/`Text`); the fill and text colours read the live `:root` vars,
 * so they're truthful under whatever theme `ColorFoundation` has applied.
 *
 * Delete this file when you replace the starter page.
 */
import { Box } from '@lando-labs/lando-ds/components/Box/Box'
import { Stack } from '@lando-labs/lando-ds/components/Stack/Stack'
import { Inline } from '@lando-labs/lando-ds/components/Inline/Inline'
import { Text } from '@lando-labs/lando-ds/components/Text/Text'

export function AccentSpotlight() {
  return (
    <Stack gap="md">
      {/* Stripe — a thin accent-filled bar. Height comes from the spacing
          scale (not a hardcoded rem), same as every other value here. */}
      <Box background="var(--color-accent)" borderRadius="md" height="var(--spacing-xs)" width="100%" />

      {/* Pill — accent fill with inverse text for legibility on the fill. */}
      <Inline gap="sm" align="center" wrap>
        <Box
          background="var(--color-accent)"
          borderRadius="full"
          paddingLeft="md"
          paddingRight="md"
          paddingTop="xs"
          paddingBottom="xs"
        >
          <Text size="sm" weight="semibold" color="var(--color-text-inverse)">
            Featured
          </Text>
        </Box>
        <Text size="sm" color="var(--color-text-secondary)">
          A `Box` filled with your accent, `Text` in `--color-text-inverse` on top.
        </Text>
      </Inline>

      {/* Emphasis word — accent as a text colour, inline in a sentence. */}
      <Text size="sm">
        The stripe and the pill above both lean on{' '}
        <Text as="span" color="var(--color-accent)" weight="semibold">
          accent
        </Text>{' '}
        — reserve it for the one thing on a screen you want to pop.
      </Text>
    </Stack>
  )
}
