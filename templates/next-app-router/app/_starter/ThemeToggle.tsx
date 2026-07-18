'use client'

/**
 * Light/dark toggle. Sits in the hero, because it re-colours everything
 * below it.
 *
 * Delete this file when you replace the starter page.
 */
import { useTheme } from '@lando-labs/lando-ds'
import { useMounted } from '@lando-labs/lando-ds/hooks'
import { Button } from '@lando-labs/lando-ds/components/Button/Button'

export function ThemeToggle() {
  const { theme, toggle } = useTheme()
  const mounted = useMounted()
  return (
    <Button variant="ghost" size="sm" onClick={toggle} aria-label="Toggle light or dark theme">
      {/* Neutral until mounted: with defaultMode="system" the server renders
          "light" while the client may resolve "dark", and the mismatch is a
          hydration error. */}
      {!mounted ? 'Theme' : theme === 'dark' ? '☾ Dark' : '☀ Light'}
    </Button>
  )
}
