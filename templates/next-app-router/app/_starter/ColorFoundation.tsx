'use client'

/**
 * Owns the colour-foundation state: the primary you picked, the optional
 * harmony customisation, and every value derived from them. Renders the
 * two-column workspace — controls on the left, live preview on the right —
 * via `./color`, the DS's own OKLCH + contrast maths.
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
 * - **Page light/dark** (`ThemeToggle`, in the hero) flips `:root`'s mode,
 *   independent of the preview's.
 *
 * The `setProductTheme` effect cleans up on unmount
 * (`setProductTheme(undefined)`) so this deletable starter leaves no lasting
 * `:root` or localStorage effect once you delete `app/_starter/`.
 *
 * Delete this file when you replace the starter page.
 */
import { useEffect, useMemo, useState } from 'react'
import { useTheme, type ResolvedTheme } from '@lando-labs/lando-ds'
import { useDisclosure, useToggle } from '@lando-labs/lando-ds/hooks'
import { Grid } from '@lando-labs/lando-ds/components/Grid/Grid'
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
  const { setProductTheme } = useTheme()
  useEffect(() => {
    setProductTheme(applyToPage ? theme : SLATE_BASELINE)
    return () => setProductTheme(undefined)
  }, [theme, applyToPage, setProductTheme])

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
        artifact={artifact}
      />
      <PalettePreview
        theme={theme}
        previewMode={previewMode}
        onTogglePreviewMode={() => cyclePreviewMode()}
        applyToPage={applyToPage}
        onToggleApplyToPage={() => applyToPageHandlers.toggle()}
      />
    </Grid>
  )
}
