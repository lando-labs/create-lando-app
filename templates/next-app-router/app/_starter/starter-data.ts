/**
 * Static copy for the starter page — quick-start swatches, the AI brief
 * highlights, the file map, and the starter prompts. Split out so both the
 * server page and the client controls read from one place instead of
 * duplicating literals.
 *
 * Delete `app/_starter/` when you replace the starter page.
 */

/**
 * Pleasant, AA-passing starting points — each clears 4.5:1 white-text
 * contrast as-is (checked against the DS's own contrast maths), so picking
 * one never trips the correction path. Spread across hue so there's a
 * reasonable starting point regardless of taste.
 */
export const QUICK_START: ReadonlyArray<{ hex: string; name: string }> = [
  { hex: '#4F46E5', name: 'Indigo' },
  { hex: '#0F766E', name: 'Teal' },
  { hex: '#7C3AED', name: 'Violet' },
  { hex: '#C2410C', name: 'Orange' },
  { hex: '#334155', name: 'Slate' },
]

export const BRIEF_HIGHLIGHTS: readonly string[] = [
  'Reads the DS via MCP instead of assuming an API from memory.',
  'Server Components by default; \'use client\' only for interactivity.',
  'No Tailwind, no hardcoded colors — design tokens only.',
]

export interface FileMapEntry {
  path: string
  owns: string
}

export const FILE_MAP: readonly FileMapEntry[] = [
  { path: 'app/page.tsx', owns: 'This page. Replace it — that’s the point.' },
  { path: 'app/layout.tsx', owns: 'The HTML shell and page metadata.' },
  { path: 'app/providers.tsx', owns: 'The theme — pass your ProductTheme here.' },
  { path: 'app/globals.css', owns: 'Your CSS. The app reset lives in @layer app-reset.' },
  { path: 'AGENTS.md', owns: 'What your AI is told about this project. Yours to edit.' },
]

export const PROMPTS: readonly string[] = [
  'Using the Lando DS, build a dashboard with metric cards and a recent-activity table.',
  'Using the Lando DS, add a settings form with validation and a save action.',
  'Build an app that [your idea] — using the Lando DS.',
]

/**
 * §4, card 1 — retuning the look. Each prompt is a theme/token change, not a
 * rewrite: same components, different feel.
 */
export const REFINE_PROMPTS: readonly string[] = [
  'The cards feel too soft — sharpen every corner.',
  "Bump the base text size up a notch so everything's easier to read.",
  'Tighten it into a dense, data-heavy layout — more on screen at once.',
  'Default the whole app to dark mode, with a light/dark toggle in the header.',
]

/**
 * §4, card 2 — composing new UI. The AI assembles higher-level components
 * from DS primitives rather than the DS shipping them ready-made.
 */
export const COMPOSE_PROMPTS: readonly string[] = [
  'Compose a dashboard header row of stat tiles — StatCards with trend arrows and a sparkline in each.',
  "Build a three-tier pricing section — a Card per plan, a 'Most popular' Badge, and a Button to choose each.",
]
