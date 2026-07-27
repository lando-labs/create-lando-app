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
    // `defaultMode="light"` pins the app to light unless a visitor has a stored
    // preference. Without it the DS falls back to `"system"`, so a dark-OS
    // visitor would land on a dark page. Change it to `"system"` (or wire up a
    // theme toggle) whenever you want this app to follow the OS — this is your
    // file. The getting-started page relies on the light default: its preview
    // renders a scoped dark specimen, and a dark page + light scope currently
    // mis-renders in the DS (lando-labs/lando-ds#92).
    <ThemeProvider preset="brand-neutral" defaultMode="light" /* defaultProductTheme={brandTheme} */>
      {children}
    </ThemeProvider>
  )
}
