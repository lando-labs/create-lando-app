'use client'

import { ThemeProvider } from '@lando-labs/lando-ds'

/**
 * The neutral base. Your brand colours live in `app/globals.css`, as
 * `@layer app` custom properties (`--color-primary`, `--color-secondary`,
 * `--color-accent`, plus the tuned semantics) — see the getting-started page.
 * Those CSS custom properties paint on the first frame, same as this preset,
 * so there's nothing here to keep in sync when you change your palette.
 *
 * `preset` stays 'brand-neutral': it's the base your `@layer app` overrides
 * sit on top of. Swapping it for a different preset still works (the two are
 * independent), but the getting-started flow assumes this base.
 */
const THEME_PRESET = 'brand-neutral'

// Global CSS is imported once, in `app/layout.tsx`, in the golden-path order
// (layer-order primer → globals → DS styles). Don't re-import it here.
export function Providers({ children }: { children: React.ReactNode }) {
  return <ThemeProvider preset={THEME_PRESET}>{children}</ThemeProvider>
}
