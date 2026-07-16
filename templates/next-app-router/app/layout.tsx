// GOLDEN-PATH CSS ORDER (issue #462) — this import order matters.
//
// 1. Layer-order primer: declares the cascade-layer order up front, so the
//    reset in globals.css can sit BELOW the DS layers instead of clobbering
//    component spacing.
import '@lando-labs/lando-ds/layer-order.css'
// 2. Your global CSS (an aggressive reset bucketed into @layer app-reset).
import './globals.css'
// 3. The DS component styles (all inside the ll.* layers).
import '@lando-labs/lando-ds/styles'

import type { Metadata } from 'next'
import { themeScript } from '@lando-labs/lando-ds'
import { Providers } from './providers'

export const metadata: Metadata = {
  title: '{{PROJECT_NAME}}',
  description: 'Built with the Lando Labs Design System',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Anti-flash: apply the persisted theme before first paint.
            themeScript() is RSC-safe, so calling it here in a Server
            Component is supported (#384). */}
        <script dangerouslySetInnerHTML={{ __html: themeScript() }} />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
