'use client'

import { ThemeProvider } from '@lando-labs/lando-ds'
// To brand the app: generate a theme on the getting-started page, save it as
// `app/brand-theme.ts`, then uncomment these two lines.
// import { brandTheme } from './brand-theme'

/**
 * THE THEME LIVES HERE.
 *
 * `preset` is the DS's neutral starting point. To make the app yours, the
 * getting-started page generates a DS `ProductTheme` from a colour you pick;
 * save it as `app/brand-theme.ts` and pass it as `defaultProductTheme` below —
 * the DS derives every ramp, hover/active state and surface from it. Your AI
 * reads this file rather than keeping its own copy of your colours.
 *
 * Global CSS is imported once, in `app/layout.tsx`, in the golden-path order
 * (layer-order primer → globals → DS styles). Don't re-import it here.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider preset="brand-neutral" /* defaultProductTheme={brandTheme} */>
      {children}
    </ThemeProvider>
  )
}
