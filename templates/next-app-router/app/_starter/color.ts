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

// Re-exported so the starter UI has a single colour module to import from —
// the hex⇄OKLCH conversions come straight from the DS's own maths.
export { hexToOklch, oklchToHex, type Oklch } from '@lando-labs/lando-ds/tokens'

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
        // A deeper, saturated tone of the same hue — a real third role, not a
        // copy of primary. Multiplicative so it stays distinct at any lightness.
        accent = { L: p.L * 0.72, C: p.C, H: p.H }
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
export function emitLayerApp(pal: Palette, tint: TintStrength = 'none'): string {
  const decl = (name: string, o: Oklch) => `    --color-${name}: ${formatOklch(o)};`
  const lines = [
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
  ]
  // Optional: lean the surfaces toward the brand, per mode. Emitted only when
  // asked — a plain palette shouldn't carry surface overrides it doesn't use.
  const tinted = deriveTintedSurfaces(pal.primary, tint)
  if (tinted) {
    for (const mode of ['light', 'dark'] as const) {
      // Unquoted attribute value on purpose: valid CSS, and it dodges a
      // syntax-highlighter quirk that renders a stray ';' inside quoted ones.
      lines.push(`  :root[data-theme=${mode}] {`)
      lines.push(`    /* Surfaces tinted toward your brand (${tint}) — same lightness, so contrast holds. */`)
      for (const [token, o] of Object.entries(tinted[mode])) lines.push(decl(token, o))
      lines.push('  }')
    }
  }
  lines.push('}', '')
  return lines.join('\n')
}

/**
 * The DS derives each brand role's ramp + interaction states from
 * `var(--color-<role>)` with these oklab mixes. On `:root` (where the emitted
 * CSS sets `--color-<role>`) they re-derive automatically. But a custom
 * property's nested `var()` resolves at its DECLARATION scope — so setting
 * `--color-<role>` on the preview WRAPPER doesn't re-derive the `:root`-declared
 * tokens. We re-declare them on the wrapper so the preview's ramps + hover match
 * what the emitted CSS actually produces (not the DS's default grey).
 */
const RAMP_DERIVATION: ReadonlyArray<[suffix: string, mix: string | null]> = [
  ['lightest', 'white 90%'],
  ['lighter', 'white 70%'],
  ['light', 'white 45%'],
  ['medium', null], // = the base colour itself
  ['base', 'white 23%'],
  ['dark', 'black 18%'],
  ['darker', 'black 36%'],
  ['darkest', 'black 52.5%'],
  ['hover', 'white 22%'],
  ['active', 'black 18%'],
]

function roleRampVars(role: string): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [suffix, mix] of RAMP_DERIVATION) {
    out[`--color-${role}-${suffix}`] = mix
      ? `color-mix(in oklab, var(--color-${role}), ${mix})`
      : `var(--color-${role})`
  }
  return out
}

/** Live-preview helper: the DOM custom properties for the current palette. */
export function paletteVars(pal: Palette): Record<string, string> {
  return {
    '--color-primary': formatOklch(pal.primary),
    '--color-secondary': formatOklch(pal.secondary),
    '--color-accent': formatOklch(pal.accent),
    // Re-declare the derived ramp/state tokens so they re-resolve against the
    // wrapper's brand colours (see RAMP_DERIVATION) instead of inheriting the
    // DS's :root-computed defaults.
    ...roleRampVars('primary'),
    ...roleRampVars('secondary'),
    ...roleRampVars('accent'),
    '--color-success-base': formatOklch(pal.semantics.success),
    '--color-warning-base': formatOklch(pal.semantics.warning),
    '--color-info-base': formatOklch(pal.semantics.info),
  }
}

// ---- Brand-tinted surfaces: theme-adjacent light + dark --------------------

export type TintStrength = 'none' | 'subtle' | 'more'

export const TINT_STRENGTHS: ReadonlyArray<{ id: TintStrength; label: string }> = [
  { id: 'none', label: 'None' },
  { id: 'subtle', label: 'Subtle' },
  { id: 'more', label: 'More' },
]

type SurfaceMode = 'light' | 'dark'
type SurfaceKind = 'fill' | 'text'

/**
 * The DS's surface-token LIGHTNESS scaffold, measured live from
 * `@lando-labs/lando-ds@0.57.0` in both modes. The tint keeps each token's
 * lightness and only swaps its hue to the brand's + adds a little chroma — so
 * the whole theme leans warm/cool with the brand while every contrast ratio
 * (which is lightness-driven) is preserved. Text carries less tint than fills.
 *
 * (Light `--color-background`/text/border follow the neutral ramp, but dark
 * `--color-background`/`--color-surface` are separate literals — so the tint is
 * emitted per-mode under `:root[data-theme='…']`, not once at `:root`.)
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

/** How much chroma to mix in at each strength — fills carry more than text. */
const TINT_CHROMA: Record<TintStrength, { fill: number; text: number }> = {
  none: { fill: 0, text: 0 },
  subtle: { fill: 0.01, text: 0.004 },
  more: { fill: 0.022, text: 0.01 },
}

export interface TintedSurfaces {
  light: Record<string, Oklch>
  dark: Record<string, Oklch>
}

/**
 * Brand-tinted surface tokens for both modes — `null` when strength is 'none'.
 * L preserved (contrast-safe), H = the brand's hue, C = the strength.
 */
export function deriveTintedSurfaces(primary: Oklch, strength: TintStrength): TintedSurfaces | null {
  if (strength === 'none') return null
  const c = TINT_CHROMA[strength]
  const build = (mode: SurfaceMode): Record<string, Oklch> => {
    const out: Record<string, Oklch> = {}
    for (const { token, L, kind } of SURFACE_L[mode]) {
      out[token] = { L, C: kind === 'text' ? c.text : c.fill, H: primary.H }
    }
    return out
  }
  return { light: build('light'), dark: build('dark') }
}

/**
 * Live-preview helper for the tint: the CURRENT mode's tinted surface tokens,
 * to apply on the preview wrapper so its background/cards/borders lean toward
 * the brand. Empty when strength is 'none'.
 */
export function surfaceVars(
  primary: Oklch,
  strength: TintStrength,
  mode: SurfaceMode,
): Record<string, string> {
  const tinted = deriveTintedSurfaces(primary, strength)
  if (!tinted) return {}
  const out: Record<string, string> = {}
  for (const [token, o] of Object.entries(tinted[mode])) out[`--color-${token}`] = formatOklch(o)
  return out
}
