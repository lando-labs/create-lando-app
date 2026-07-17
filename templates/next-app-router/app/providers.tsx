'use client'

import { ThemeProvider } from '@lando-labs/lando-ds'

/**
 * THE THEME LIVES HERE.
 *
 * `preset` is the single source of truth for this app's palette. Change it and
 * every design token re-skins. Your AI reads this file rather than keeping its own
 * copy of your colours, so changing it here is all you have to do.
 *
 * ⚠️ It must match `themeScript({ defaultPreset })` in `app/layout.tsx`. That call
 * paints the preset before React hydrates; if the two disagree, every page load
 * flashes one palette and then snaps to the other.
 *
 * Available presets that meet WCAG AA contrast: 'brand-neutral' (default),
 * 'lando', 'slate'.
 */
const THEME_PRESET = 'brand-neutral'

// Global CSS is imported once, in `app/layout.tsx`, in the golden-path order
// (layer-order primer → globals → DS styles). Don't re-import it here.
export function Providers({ children }: { children: React.ReactNode }) {
  return <ThemeProvider preset={THEME_PRESET}>{children}</ThemeProvider>
}
