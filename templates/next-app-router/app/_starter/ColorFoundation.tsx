'use client'

/**
 * Owns the colour-foundation state: the primary you picked, the optional
 * harmony customisation, and every value derived from them. Renders the
 * two-column workspace — controls on the left, live preview on the right —
 * via `./color`, the DS's own OKLCH + contrast maths.
 *
 * Delete this file when you replace the starter page.
 */
import { useMemo, useState } from 'react'
import { useDisclosure } from '@lando-labs/lando-ds/hooks'
import { Grid } from '@lando-labs/lando-ds/components/Grid/Grid'
import { QUICK_START } from './starter-data'
import { ColorControl } from './ColorControl'
import { PalettePreview } from './PalettePreview'
import {
  ensureAccessiblePrimary,
  buildPalette,
  emitLayerApp,
  paletteVars,
  hexToOklch,
  type RampType,
  type TintStrength,
} from './color'

const HEX_RE = /^#[0-9a-fA-F]{6}$/

export function ColorFoundation() {
  const [primaryHex, setPrimaryHex] = useState(QUICK_START[0].hex) // committed, drives the palette
  const [hexDraft, setHexDraft] = useState(QUICK_START[0].hex) // the text field's live value; may be mid-edit
  const [ramp, setRamp] = useState<RampType>('tonal')
  // Lifted here (not local to ColorControl): it gates both the harmony
  // controls' visibility AND the preview card's "derived roles" caption.
  const [customizeOpen, customizeHandlers] = useDisclosure(false)
  const [secondaryOn, secondaryHandlers] = useDisclosure(false)
  const [secondaryHex, setSecondaryHex] = useState('#0F766E')
  const [secondaryDraft, setSecondaryDraft] = useState('#0F766E')
  // How hard the surfaces lean toward the brand. Subtle by default so the page
  // shows the theme-adjacency off the bat; 'none' emits no surface overrides.
  const [tint, setTint] = useState<TintStrength>('subtle')

  const accessible = useMemo(() => ensureAccessiblePrimary(primaryHex), [primaryHex])
  const pinnedSecondary = useMemo(
    () => (secondaryOn ? hexToOklch(secondaryHex) : undefined),
    [secondaryOn, secondaryHex],
  )
  const palette = useMemo(
    () => buildPalette(accessible.oklch, ramp, pinnedSecondary),
    [accessible.oklch, ramp, pinnedSecondary],
  )
  const artifact = useMemo(() => emitLayerApp(palette, tint), [palette, tint])
  const previewVars = useMemo(() => paletteVars(palette), [palette])

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
    <Grid columns={{ lg: 2 }} gap="xl" align="start">
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
        customizeOpen={customizeOpen}
        onToggleCustomize={customizeHandlers.toggle}
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
        primary={accessible.oklch}
        tint={tint}
        previewVars={previewVars}
        showHarmonyCaption={customizeOpen}
      />
    </Grid>
  )
}
