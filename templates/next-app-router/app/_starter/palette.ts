/**
 * The palette shown on the getting-started page.
 *
 * THE RULE: fill comes from the CSS custom property, the label comes from here.
 * This file never holds a colour value — only token names. A hex here would lie
 * the moment you toggle the theme or switch preset, because what a token
 * *resolves* to depends on preset + light/dark at runtime. `var(--…)` stays
 * honest in every mode.
 *
 * These are the ROLE tokens — the ones a theme preset actually re-skins. The DS
 * also ships raw ramps (`--color-ocean-*`, `--color-teal-*`), but a preset never
 * moves those, so showing them here would be showing the library's crayons rather
 * than this app's identity — and they'd sit inert while the preset chooser
 * visibly changed everything around them.
 *
 * Delete this file when you replace the starter page.
 */

export interface Swatch {
  /** Token path — what gets copied. Never a hex. */
  token: string
  /** Short label under the swatch. */
  step: string
}

export interface SwatchRow {
  family: string
  note: string
  swatches: Swatch[]
}

const ramp = (name: string, steps: string[]): Swatch[] =>
  steps.map((step) => ({
    token: step === 'base' ? `--color-${name}` : `--color-${name}-${step}`,
    step,
  }))

export const PALETTE: SwatchRow[] = [
  {
    family: 'Primary',
    note: 'Your main action colour. The preset moves this.',
    swatches: ramp('primary', ['base', 'hover', 'active']),
  },
  {
    family: 'Secondary',
    note: 'The supporting brand ramp.',
    swatches: [{ token: '--color-secondary', step: 'base' }],
  },
  {
    family: 'Accent',
    note: 'Highlights and emphasis.',
    swatches: ramp('accent', ['light', 'base', 'dark']),
  },
  {
    family: 'Semantic',
    note: 'Status colours — meaning, not decoration.',
    swatches: [
      { token: '--color-success-base', step: 'success' },
      { token: '--color-warning-base', step: 'warning' },
      { token: '--color-error-base', step: 'error' },
      { token: '--color-info-base', step: 'info' },
    ],
  },
  {
    family: 'Surface',
    note: 'Backgrounds and text. These carry your contrast.',
    swatches: [
      { token: '--color-bg-primary', step: 'bg' },
      { token: '--color-surface-elevated', step: 'elevated' },
      { token: '--color-border-default', step: 'border' },
      { token: '--color-text-primary', step: 'text' },
    ],
  },
]

/**
 * Theme presets offered by the chooser.
 *
 * The DS ships seven, but only these three pass WCAG AA for the button text that
 * sits on them — the others would hand you an inaccessible app on your first day.
 * See lando-labs/lando-labs-design-system#542.
 */
export const PRESETS = [
  { id: 'brand-neutral', name: 'Brand neutral', note: 'The default. Calm greys.' },
  { id: 'lando', name: 'Lando', note: 'Ocean + teal.' },
  { id: 'slate', name: 'Slate', note: 'Cool and understated.' },
] as const

export type PresetId = (typeof PRESETS)[number]['id']
