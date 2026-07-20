/**
 * The colour engine behind the getting-started page.
 *
 * It computes a palette with the design system's OWN exported maths
 * (`@lando-labs/lando-ds/tokens` re-exports `./oklch` + `./contrast`) and hands
 * back a DS `ProductTheme` — the same object `ThemeProvider`/`ThemeScope` take.
 * Nothing here writes CSS or injects custom properties by hand; the DS resolves
 * the theme (ramps, hover/active states, everything) from these base values.
 *
 * Delete `app/_starter/` when you replace the starter page.
 */
import {
  hexToOklch,
  oklchToHex,
  contrastRatio,
  AA_NORMAL,
  AA_LARGE,
  type Oklch,
  type ProductTheme,
} from '@lando-labs/lando-ds/tokens'

export { hexToOklch, oklchToHex, type Oklch, type ProductTheme } from '@lando-labs/lando-ds/tokens'

const WHITE = '#FFFFFF'
/** Don't darken past this — below it every hue is just "near-black". */
const L_FLOOR = 0.2

const clampHue = (h: number): number => ((h % 360) + 360) % 360

/** Walk lightness DOWN at constant hue + chroma until it meets `min` on white. */
function darkenToRatio(o: Oklch, min: number): Oklch {
  let { L } = o
  const { C, H } = o
  while (L > L_FLOOR && contrastRatio(oklchToHex(L, C, H), WHITE) < min) {
    L = Math.max(L_FLOOR, L - 0.01)
  }
  return { L, C, H }
}

const hex = (o: Oklch): string => oklchToHex(o.L, o.C, o.H)

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
  return {
    oklch: fixed,
    hex: hex(fixed),
    ratioOnWhite: contrastRatio(hex(fixed), WHITE),
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
 * so the same inputs always give the same palette. A pinned secondary is
 * respected exactly; the ramp then governs only where the accent sits.
 * Derived roles are floored at AA_LARGE (3:1) so they never come out washed.
 */
export function deriveHarmony(primary: Oklch, ramp: RampType, pinnedSecondary?: Oklch): Harmony {
  const p = primary
  let secondary: Oklch
  let accent: Oklch

  if (pinnedSecondary) {
    secondary = pinnedSecondary
    switch (ramp) {
      case 'tonal':
        accent = { L: p.L * 0.72, C: p.C, H: p.H }
        break
      case 'neighbouring':
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
        // A deeper, saturated tone of the same hue — a real third role, not a
        // copy of primary. Multiplicative so it stays distinct at any lightness.
        accent = { L: p.L * 0.72, C: p.C, H: p.H }
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
 * The DS's documented default semantic anchors — the ONLY hardcoded colours
 * here, the reference we harmonise away from. `error` is deliberately absent:
 * danger must read as danger, so we never touch it.
 */
const DEFAULT_SEMANTICS = { success: '#10B981', warning: '#F59E0B', info: '#3B82F6' } as const
export type SemanticKey = keyof typeof DEFAULT_SEMANTICS

/**
 * Tune success / warning / info toward the brand — hue nudges at most 15° and
 * chroma blends 30% toward the primary, but lightness is untouched, so success
 * still reads green, warning amber, info blue.
 */
export function harmonizeSemantics(primary: Oklch): Record<SemanticKey, Oklch> {
  const out = {} as Record<SemanticKey, Oklch>
  for (const key of Object.keys(DEFAULT_SEMANTICS) as SemanticKey[]) {
    const s = hexToOklch(DEFAULT_SEMANTICS[key])
    const raw = ((primary.H - s.H + 540) % 360) - 180
    const dh = Math.max(-15, Math.min(15, raw * 0.2))
    out[key] = { L: s.L, C: s.C + (primary.C - s.C) * 0.3, H: clampHue(s.H + dh) }
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
export function buildPalette(primary: Oklch, ramp: RampType, pinnedSecondary?: Oklch): Palette {
  const { secondary, accent } = deriveHarmony(primary, ramp, pinnedSecondary)
  return { primary, secondary, accent, semantics: harmonizeSemantics(primary) }
}

// ---- Brand-tinted surfaces (theme-adjacent light + dark) -------------------

export type TintStrength = 'none' | 'subtle' | 'more'

export const TINT_STRENGTHS: ReadonlyArray<{ id: TintStrength; label: string }> = [
  { id: 'none', label: 'None' },
  { id: 'subtle', label: 'Subtle' },
  { id: 'more', label: 'More' },
]

type SurfaceMode = 'light' | 'dark'
type SurfaceKind = 'fill' | 'text'

/**
 * The DS's surface-token LIGHTNESS scaffold, per mode (measured from
 * `@lando-labs/lando-ds@0.57.0`). The tint keeps each token's lightness and
 * only swaps its hue to the brand's + adds a little chroma — so the whole theme
 * leans warm/cool with the brand while every contrast ratio (lightness-driven)
 * is preserved. Text carries less tint than fills.
 */
const SURFACE_L: Record<SurfaceMode, ReadonlyArray<{ token: string; L: number; kind: SurfaceKind }>> = {
  light: [
    { token: 'background', L: 0.9839, kind: 'fill' },
    { token: 'surface', L: 1.0, kind: 'fill' },
    { token: 'text-primary', L: 0.3873, kind: 'text' },
    { token: 'text-secondary', L: 0.5724, kind: 'text' },
    { token: 'border-default', L: 0.8601, kind: 'fill' },
    { token: 'border-subtle', L: 0.9271, kind: 'fill' },
    { token: 'border-strong', L: 0.7928, kind: 'fill' },
  ],
  dark: [
    { token: 'background', L: 0.18, kind: 'fill' },
    { token: 'surface', L: 0.21, kind: 'fill' },
    { token: 'text-primary', L: 0.9839, kind: 'text' },
    { token: 'text-secondary', L: 0.9271, kind: 'text' },
    { token: 'border-default', L: 0.38, kind: 'fill' },
    { token: 'border-subtle', L: 0.31, kind: 'fill' },
    { token: 'border-strong', L: 0.5, kind: 'fill' },
  ],
}

const TINT_CHROMA: Record<TintStrength, { fill: number; text: number }> = {
  none: { fill: 0, text: 0 },
  subtle: { fill: 0.01, text: 0.004 },
  more: { fill: 0.022, text: 0.01 },
}

// ---- ProductTheme assembly (the DS's own theme object) ---------------------

/** A DS ProductTheme colour value: flat, or mode-aware. */
type ThemeColor = string | { light: string; dark: string }

/**
 * Assemble a DS `ProductTheme` from the palette + surface tint. This is the
 * object the DS's `ThemeScope` / `ThemeProvider` consume — they resolve the
 * ramps, hover/active states and everything else from these base values, so we
 * never compute or inject a derived token ourselves.
 *
 * - brand: `primary` / `secondary` / `accent`
 * - semantics: both `<key>` and `<key>-base` (the DS reads both), `error` left
 *   at the DS default so danger stays red
 * - surfaces: only when tinted — mode-aware `{ light, dark }`, same lightness as
 *   the DS defaults with the brand hue mixed in (contrast preserved)
 */
export function buildProductTheme(pal: Palette, tint: TintStrength, name = 'brand'): ProductTheme {
  const color: Record<string, ThemeColor> = {
    primary: hex(pal.primary),
    secondary: hex(pal.secondary),
    accent: hex(pal.accent),
    success: hex(pal.semantics.success),
    'success-base': hex(pal.semantics.success),
    warning: hex(pal.semantics.warning),
    'warning-base': hex(pal.semantics.warning),
    info: hex(pal.semantics.info),
    'info-base': hex(pal.semantics.info),
  }

  if (tint !== 'none') {
    const c = TINT_CHROMA[tint]
    const at = (mode: SurfaceMode, L: number, kind: SurfaceKind) =>
      hex({ L, C: kind === 'text' ? c.text : c.fill, H: pal.primary.H })
    // Surface tokens are mode-aware: light + dark leaning toward the brand hue.
    for (let i = 0; i < SURFACE_L.light.length; i++) {
      const l = SURFACE_L.light[i]
      const d = SURFACE_L.dark[i]
      color[l.token] = { light: at('light', l.L, l.kind), dark: at('dark', d.L, d.kind) }
    }
  }

  return { name, tokens: { color } } as ProductTheme
}

/** The copy-paste artifact: the ProductTheme as a TS constant for `providers.tsx`. */
export function formatThemeSource(theme: ProductTheme): string {
  return `import type { ProductTheme } from '@lando-labs/lando-ds/tokens'\n\nexport const brandTheme = ${JSON.stringify(
    theme,
    null,
    2,
  )} satisfies ProductTheme\n`
}
