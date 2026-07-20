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
  'Build a dashboard with metric cards and a recent-activity table.',
  'Add a settings form with validation and a save action.',
  'Give me a sidebar nav with the routes I have so far.',
]
