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
 * Two independent regions (DS issue #36 — supersedes the page-level-only
 * preview from #34, now that DS #11 makes a scoped `ThemeScope` re-derive
 * truthful ramps/hover/active for a theme that isn't on `:root`):
 *
 * - **The preview** (`PalettePreview`) always renders `theme` inside its own
 *   `<ThemeScope>`, with its own independent light/dark mode — #11 is what
 *   makes that scope's ramps and hover/active states truthful now. This is
 *   where a picked colour is shown, so the surrounding page doesn't need to
 *   wear it for you to judge it.
 * - **Page `:root`** is left ALONE by default. `useTheme().setProductTheme`
 *   persists to `localStorage`, and its cleanup only runs on React unmount —
 *   NOT on a browser reload — so persisting a throwaway starter theme here
 *   would shadow `app/providers.tsx`'s `defaultProductTheme` on the next load
 *   (that was #53: configure, reload, and the app came up in the wrong
 *   colours). So when "Apply to page" is OFF we persist NOTHING and clear any
 *   stored value (`setProductTheme(undefined)`), which also heals a browser
 *   already poisoned by an older starter. The page then shows whatever
 *   `ThemeProvider` serves: the neutral `brand-neutral` preset before you
 *   theme, your `brandTheme` after.
 * - **"Apply to page" is the one opt-in.** Flipping it on is the only time we
 *   touch `:root`: it carries `theme` AND the preview's own light/dark mode
 *   (`setMode`) onto the page, so a dark preview darkens the whole page. That
 *   stays clear of the one nested-scope direction the DS still mis-renders (a
 *   light scope inside a dark page — lando-labs/lando-ds#92): the page goes
 *   dark ONLY while applied + preview-dark, and in that state every scope on
 *   the page is dark too. Toggling back off (or reloading) clears it again.
 *
 * The effect cleans up on unmount (`setProductTheme(undefined)` +
 * `setMode('light')`) so this deletable starter resets `:root` and the page
 * mode once you delete `app/_starter/`.
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
  // Off by default: the page is left on the ThemeProvider default until you opt
  // in to "seeing it live" — OFF persists nothing to :root (see the effect).
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

  // Touch :root ONLY when "Apply to page" is on. See the file-level comment for
  // the state model; the short version is #53: setProductTheme persists to
  // localStorage and only cleans up on unmount (not reload), so persisting a
  // throwaway starter theme when OFF would shadow app/providers.tsx's brand
  // theme on the next load.
  const { setProductTheme, setMode } = useTheme()
  useEffect(() => {
    if (applyToPage) {
      // The one persistence the user actually asked for: carry the picked
      // theme AND the preview's own light/dark mode onto the page. Mode is kept
      // in SYNC with `previewMode` (dark only while applied + preview-dark), so
      // there's never a light scope inside a dark page — the one direction the
      // DS still mis-renders (lando-labs/lando-ds#92).
      setProductTheme(theme)
      setMode(previewMode)
    } else {
      // OFF (default): persist NOTHING, and clear any stored ProductTheme so a
      // browser poisoned by an earlier starter session heals — after you wire
      // app/providers.tsx and reload, the page shows YOUR brand theme, not a
      // stale starter value (#53). The page falls back to whatever
      // ThemeProvider serves (brand-neutral before you theme, brandTheme after).
      setProductTheme(undefined)
      setMode('light')
    }
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
          — the DS derives every ramp and state from it.
        </Text>
        <Text size="sm" color="var(--color-text-secondary)">
          This page stays neutral on purpose, so your colour pops in the preview instead of the page
          ambiently wearing it — that&rsquo;s why saving your theme won&rsquo;t visibly change{' '}
          <Text as="span" variant="mono">
            this
          </Text>{' '}
          page. Your theme goes live the moment your first real screen replaces it. Want the full look
          now? Flip{' '}
          <Text as="span" weight="semibold">
            Apply to page
          </Text>
          .
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
