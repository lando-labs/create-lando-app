'use client'

/**
 * Owns the colour-foundation state: the primary you picked, the optional
 * harmony customisation, and every value derived from them. Renders the
 * two-column workspace — controls on the left, live preview on the right —
 * via `./color`, the DS's own OKLCH + contrast maths, then the "Your theme"
 * copy-paste artifact FULL-WIDTH below both columns (its own `CodeBlock` can
 * run tall, and putting it inside the grid would either tower over the
 * preview on desktop or shove the preview below it on narrow screens).
 *
 * Three independent controls, three regions (DS issue #36 — supersedes the
 * page-level-only preview from #34, now that DS #11 makes a scoped
 * `ThemeScope` re-derive truthful ramps/hover/active for a theme that isn't
 * on `:root`):
 *
 * - **Page `:root`** carries `applyToPage ? theme : SLATE_BASELINE`, via
 *   `useTheme().setProductTheme`. Defaults OFF, so the page around the
 *   preview is a neutral slate baseline — a picked brand colour visibly pops
 *   against it in the preview instead of the page ambiently wearing it.
 * - **The preview** (`PalettePreview`) always renders `theme` inside its own
 *   `<ThemeScope>`, with its own independent light/dark mode — #11 is what
 *   makes that scope's ramps and hover/active states truthful now.
 * - **The page mode follows the preview WHEN applied.** The page starts light
 *   (`app/providers.tsx` pins `defaultMode="light"`), and stays light while the
 *   preview is just a scoped specimen. But flipping "Apply to page" also carries
 *   the preview's own light/dark mode onto `:root` (`useTheme().setMode`), so a
 *   dark preview darkens the whole page. This is safe against the one nested-scope
 *   direction the DS still mis-renders (a light scope inside a dark page —
 *   lando-labs/lando-ds#92): the page goes dark ONLY while applied + preview-dark,
 *   and in that state every scope on the page is dark too, so a light-on-dark
 *   nesting never occurs. Unapplied → light, and the preview's own scope only ever
 *   runs the working light-page → dark-scope direction.
 *
 * The effect cleans up on unmount (`setProductTheme(undefined)` +
 * `setMode('light')`) so this deletable starter resets `:root` and the page mode
 * once you delete `app/_starter/`.
 *
 * Delete this file when you replace the starter page.
 */
import { useEffect, useMemo, useState } from 'react'
import { useTheme, type ResolvedTheme } from '@lando-labs/lando-ds'
import { useDisclosure, useToggle } from '@lando-labs/lando-ds/hooks'
import { Grid } from '@lando-labs/lando-ds/components/Grid/Grid'
import { Stack } from '@lando-labs/lando-ds/components/Stack/Stack'
import { Text } from '@lando-labs/lando-ds/components/Text/Text'
import { Divider } from '@lando-labs/lando-ds/components/Divider/Divider'
import { CodeBlock } from '@lando-labs/lando-ds/components/CodeBlock/CodeBlock'
import { QUICK_START } from './starter-data'
import { ColorControl } from './ColorControl'
import { PalettePreview } from './PalettePreview'
import {
  ensureAccessiblePrimary,
  buildPalette,
  buildProductTheme,
  formatThemeSource,
  hexToOklch,
  SLATE_BASELINE,
  type RampType,
  type TintStrength,
} from './color'

const HEX_RE = /^#[0-9a-fA-F]{6}$/

export function ColorFoundation() {
  const [primaryHex, setPrimaryHex] = useState(QUICK_START[0].hex) // committed, drives the palette
  const [hexDraft, setHexDraft] = useState(QUICK_START[0].hex) // the text field's live value; may be mid-edit
  const [ramp, setRamp] = useState<RampType>('tonal')
  const [secondaryOn, secondaryHandlers] = useDisclosure(false)
  const [secondaryHex, setSecondaryHex] = useState('#0F766E')
  const [secondaryDraft, setSecondaryDraft] = useState('#0F766E')
  // How hard the surfaces lean toward the brand. Subtle by default so the page
  // shows the theme-adjacency off the bat; 'none' emits no surface overrides.
  const [tint, setTint] = useState<TintStrength>('subtle')
  // The preview's OWN light/dark mode — independent of the page's. A plain
  // two-value cycle; always passed explicitly to `ThemeScope`, so it's
  // SSR-stable from first paint (no `useMounted` gate needed here).
  const [previewMode, cyclePreviewMode] = useToggle<ResolvedTheme>(['light', 'dark'])
  // Off by default: the page stays on the slate baseline until you opt in to
  // "seeing it live".
  const [applyToPage, applyToPageHandlers] = useDisclosure(false)

  const accessible = useMemo(() => ensureAccessiblePrimary(primaryHex), [primaryHex])
  const pinnedSecondary = useMemo(
    () => (secondaryOn ? hexToOklch(secondaryHex) : undefined),
    [secondaryOn, secondaryHex],
  )
  const palette = useMemo(
    () => buildPalette(accessible.oklch, ramp, pinnedSecondary),
    [accessible.oklch, ramp, pinnedSecondary],
  )
  // The DS ProductTheme is the single source of truth: it drives the live
  // preview (applied at :root, below) AND is the copy-paste artifact (for
  // ThemeProvider).
  const theme = useMemo(() => buildProductTheme(palette, tint), [palette, tint])
  const artifact = useMemo(() => formatThemeSource(theme), [theme])

  // Apply at :root — slate baseline unless "apply to page" is on. See the
  // file-level comment for the three-region state model.
  const { setProductTheme, setMode } = useTheme()
  useEffect(() => {
    setProductTheme(applyToPage ? theme : SLATE_BASELINE)
    // Applying also carries the preview's OWN light/dark mode onto the page, so
    // a dark preview darkens the whole page (not just its colours). The page
    // mode is kept in SYNC with `previewMode`: it goes dark ONLY while applied
    // AND the preview is dark — and in that state every scope on the page (this
    // preview, plus the nested accent/secondary scopes) is dark too. So there's
    // never a light scope inside a dark page, which is the one direction the DS
    // still mis-renders (lando-labs/lando-ds#92). Off/unapplied → back to light.
    setMode(applyToPage ? previewMode : 'light')
    return () => {
      setProductTheme(undefined)
      setMode('light')
    }
  }, [theme, applyToPage, previewMode, setProductTheme, setMode])

  const commitPrimary = (value: string) => {
    setHexDraft(value)
    if (HEX_RE.test(value)) setPrimaryHex(value)
  }
  const pickPrimary = (hex: string) => {
    setPrimaryHex(hex)
    setHexDraft(hex)
  }
  const commitSecondary = (value: string) => {
    setSecondaryDraft(value)
    if (HEX_RE.test(value)) setSecondaryHex(value)
  }
  const pickSecondary = (hex: string) => {
    setSecondaryHex(hex)
    setSecondaryDraft(hex)
  }
  const applyFix = () => {
    setPrimaryHex(accessible.hex)
    setHexDraft(accessible.hex)
  }

  return (
    // Grid rows are just [controls | preview] — the "Your theme" artifact
    // below is full-width, outside the grid, so it can't tower over the
    // preview column on desktop or shove it below the fold on narrow screens.
    <Stack gap="xl">
      <Grid columns={{ lg: 2 }} gap="var(--spacing-2xl)" align="start">
        <ColorControl
          primaryHex={primaryHex}
          hexDraft={hexDraft}
          accessible={accessible}
          onPickPrimary={pickPrimary}
          onHexDraftChange={commitPrimary}
          onHexDraftBlur={() => setHexDraft(primaryHex)}
          onApplyFix={applyFix}
          ramp={ramp}
          onRampChange={setRamp}
          pinnedSecondary={pinnedSecondary}
          secondaryOn={secondaryOn}
          onToggleSecondary={secondaryHandlers.toggle}
          secondaryHex={secondaryHex}
          secondaryDraft={secondaryDraft}
          onPickSecondary={pickSecondary}
          onSecondaryDraftChange={commitSecondary}
          onSecondaryDraftBlur={() => setSecondaryDraft(secondaryHex)}
          tint={tint}
          onTintChange={setTint}
        />
        <PalettePreview
          theme={theme}
          previewMode={previewMode}
          onTogglePreviewMode={() => cyclePreviewMode()}
          applyToPage={applyToPage}
          onToggleApplyToPage={() => applyToPageHandlers.toggle()}
        />
      </Grid>

      <Divider label="Your theme" />

      <Stack gap="sm">
        <Text size="sm">
          This is a DS{' '}
          <Text as="span" variant="mono">
            ProductTheme
          </Text>
          . Save it as{' '}
          <Text as="span" variant="mono">
            app/brand-theme.ts
          </Text>{' '}
          and pass it to{' '}
          <Text as="span" variant="mono">
            {'<ThemeProvider defaultProductTheme={brandTheme}>'}
          </Text>{' '}
          in{' '}
          <Text as="span" variant="mono">
            app/providers.tsx
          </Text>{' '}
          — the DS derives every ramp and state from it. It&rsquo;s what&rsquo;s driving the preview;
          flip <Text as="span" weight="semibold">Apply to page</Text> to see it on this whole page.
          Saving it is what makes it stick after you delete{' '}
          <Text as="span" variant="mono">app/_starter/</Text>.
        </Text>
        {accessible.corrected ? (
          <Text size="sm" color="var(--color-text-secondary)">
            Built with the contrast-safe primary (
            <Text as="span" variant="mono">
              {accessible.hex}
            </Text>
            ), not the colour you picked (
            <Text as="span" variant="mono">
              {primaryHex}
            </Text>
            ). Click{' '}
            <Text as="span" weight="semibold">
              Fix contrast
            </Text>{' '}
            above to make them match.
          </Text>
        ) : null}
        <CodeBlock code={artifact} language="tsx" title="app/brand-theme.ts" />
      </Stack>
    </Stack>
  )
}
