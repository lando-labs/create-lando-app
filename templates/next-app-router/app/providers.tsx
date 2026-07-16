'use client'

import { ThemeProvider } from '@lando-labs/lando-ds'

// Global CSS is imported once, in `app/layout.tsx`, in the golden-path order
// (layer-order primer → globals → DS styles). Don't re-import it here.
export function Providers({ children }: { children: React.ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>
}
