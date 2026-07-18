/**
 * The colour engine behind the getting-started page.
 *
 * Every calculation runs through the design system's OWN exported maths
 * (`@lando-labs/lando-ds/tokens` re-exports `./oklch` + `./contrast`), so what
 * this page computes can't drift from how the DS resolves colour. Nothing here
 * holds a hardcoded hex except the DS's documented default semantic anchors,
 * which are the values being harmonised *away* from.
 *
 * Delete `app/_starter/` when you replace the starter page.
 */
import {
  hexToOklch,
  oklchToHex,
  formatOklch,
  contrastRatio,
  AA_NORMAL,
  AA_LARGE,
  type Oklch,
} from '@lando-labs/lando-ds/tokens'

const WHITE = '#FFFFFF'
/** Don't darken past this — below it every hue is just "near-black". */
const L_FLOOR = 0.2

const clampHue = (h: number): number => ((h % 360) + 360) % 360

/** Walk lightness DOWN at constant hue + chroma until `hex` meets `min` on white. */
function darkenToRatio(o: Oklch, min: number): Oklch {
  let { L } = o
  const { C, H } = o
  while (L > L_FLOOR && contrastRatio(oklchToHex(L, C, H), WHITE) < min) {
    L = Math.max(L_FLOOR, L - 0.01)
  }
  return { L, C, H }
}

export interface AccessibleColor {
  oklch: Oklch
  hex: string
  ratioOnWhite: number
  /** True if the input failed and had to be darkened. */
  corrected: boolean
}

/**
 * Make a colour safe as the `primary` — where white button text sits on it, so
 * it must clear WCAG AA (4.5:1) on white. Hue and chroma are preserved; only
 * lightness moves. "Pick any colour you love — we keep it readable."
 */
export function ensureAccessiblePrimary(input: string | Oklch): AccessibleColor {
  const start = typeof input === 'string' ? hexToOklch(input) : input
  const startedOk = contrastRatio(oklchToHex(start.L, start.C, start.H), WHITE) >= AA_NORMAL
  const fixed = startedOk ? start : darkenToRatio(start, AA_NORMAL)
  const hex = oklchToHex(fixed.L, fixed.C, fixed.H)
  return {
    oklch: fixed,
    hex,
    ratioOnWhite: contrastRatio(hex, WHITE),
    corrected: !startedOk,
  }
}

export type RampType = 'tonal' | 'neighbouring' | 'opposite'

export const RAMP_TYPES: ReadonlyArray<{ id: RampType; label: string; blurb: string }> = [
  { id: 'tonal', label: 'Tonal', blurb: 'Shades of your one colour' },
  { id: 'neighbouring', label: 'Neighbouring', blurb: 'Colours next to yours' },
  { id: 'opposite', label: 'Opposite', blurb: 'A contrasting pop for accents' },
]

export interface Harmony {
  secondary: Oklch
  accent: Oklch
}

/**
 * Derive secondary + accent from the primary and a ramp type — deterministic,
 * so the same inputs always give the same palette (no reroll needed).
 *
 * If a secondary is pinned, the ramp type governs only where the accent sits
 * relative to the two anchors; the pinned colour is respected exactly.
 *
 * Derived colours are lower-stakes than primary (no white text sits on them), so
 * they're only floored at AA_LARGE (3:1) — enough that they never come out washed.
 */
export function deriveHarmony(
  primary: Oklch,
  ramp: RampType,
  pinnedSecondary?: Oklch,
): Harmony {
  const p = primary
  let secondary: Oklch
  let accent: Oklch

  if (pinnedSecondary) {
    secondary = pinnedSecondary
    switch (ramp) {
      case 'tonal':
        accent = { L: p.L, C: p.C, H: p.H }
        break
      case 'neighbouring':
        // reflect the pinned secondary across the primary to extend the run
        accent = { L: p.L, C: p.C, H: clampHue(2 * p.H - secondary.H) }
        break
      case 'opposite':
        accent = { L: p.L, C: p.C, H: clampHue(p.H + 180) }
        break
    }
  } else {
    switch (ramp) {
      case 'tonal':
        secondary = { L: Math.min(0.7, p.L + 0.08), C: p.C * 0.6, H: p.H }
        accent = { L: p.L, C: p.C, H: p.H }
        break
      case 'neighbouring':
        secondary = { L: p.L, C: p.C, H: clampHue(p.H + 30) }
        accent = { L: p.L, C: p.C, H: clampHue(p.H - 30) }
        break
      case 'opposite':
        secondary = { L: p.L, C: p.C * 0.7, H: p.H }
        accent = { L: p.L, C: p.C, H: clampHue(p.H + 180) }
        break
    }
  }

  return {
    secondary: darkenToRatio(secondary, AA_LARGE),
    accent: darkenToRatio(accent, AA_LARGE),
  }
}

/**
 * The DS's documented default semantic anchors. These are the ONLY hardcoded
 * colours here — they're the reference we harmonise away from. `error` is
 * deliberately absent: danger must read as danger, and every DS preset leaves
 * it red, so we never touch it.
 */
const DEFAULT_SEMANTICS = {
  success: '#10B981',
  warning: '#F59E0B',
  info: '#3B82F6',
} as const

export type SemanticKey = keyof typeof DEFAULT_SEMANTICS

/**
 * Tune success / warning / info toward the brand — the "better green for this
 * app" the DS itself does (lando pushes success→teal, rose pushes info→pink).
 *
 * Restrained on purpose: hue nudges at most 15° toward the primary and chroma
 * blends 30% toward it, but lightness is untouched — so success still reads
 * green, warning amber, info blue. Contrast is a non-issue: Badge/Alert render
 * darkest-on-lightest of the same ramp, both derived from the base, so moving
 * the base keeps their contrast.
 */
export function harmonizeSemantics(primary: Oklch): Record<SemanticKey, Oklch> {
  const out = {} as Record<SemanticKey, Oklch>
  for (const key of Object.keys(DEFAULT_SEMANTICS) as SemanticKey[]) {
    const s = hexToOklch(DEFAULT_SEMANTICS[key])
    // signed shortest hue delta toward the brand, capped at ±15°
    const raw = ((primary.H - s.H + 540) % 360) - 180
    const dh = Math.max(-15, Math.min(15, raw * 0.2))
    out[key] = {
      L: s.L,
      C: s.C + (primary.C - s.C) * 0.3,
      H: clampHue(s.H + dh),
    }
  }
  return out
}

export interface Palette {
  primary: Oklch
  secondary: Oklch
  accent: Oklch
  semantics: Record<SemanticKey, Oklch>
}

/** Build the full palette from a (already-accessible) primary + ramp choice. */
export function buildPalette(
  primary: Oklch,
  ramp: RampType,
  pinnedSecondary?: Oklch,
): Palette {
  const { secondary, accent } = deriveHarmony(primary, ramp, pinnedSecondary)
  return { primary, secondary, accent, semantics: harmonizeSemantics(primary) }
}

/**
 * The artifact the page proposes: an `@layer app` block of OKLCH custom
 * properties. `@layer app` is the highest cascade layer the DS declares, so
 * these beat the defaults; being CSS, they paint on the first frame (no flash).
 * Setting a base re-skins its whole ramp via the DS's `color-mix` derivations.
 */
export function emitLayerApp(pal: Palette): string {
  const decl = (name: string, o: Oklch) => `    --color-${name}: ${formatOklch(o)};`
  return [
    '@layer app {',
    '  :root {',
    '    /* Your brand palette. Change --color-primary and the whole ramp follows. */',
    decl('primary', pal.primary),
    decl('secondary', pal.secondary),
    decl('accent', pal.accent),
    decl('success-base', pal.semantics.success),
    decl('warning-base', pal.semantics.warning),
    decl('info-base', pal.semantics.info),
    '  }',
    '}',
    '',
  ].join('\n')
}

/** Live-preview helper: the DOM custom properties for the current palette. */
export function paletteVars(pal: Palette): Record<string, string> {
  return {
    '--color-primary': formatOklch(pal.primary),
    '--color-secondary': formatOklch(pal.secondary),
    '--color-accent': formatOklch(pal.accent),
    '--color-success-base': formatOklch(pal.semantics.success),
    '--color-warning-base': formatOklch(pal.semantics.warning),
    '--color-info-base': formatOklch(pal.semantics.info),
  }
}
