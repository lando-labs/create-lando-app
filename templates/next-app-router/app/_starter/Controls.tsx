'use client'

/**
 * The interactive bits of the starter page. Everything else renders on the
 * server — only what needs state lives here.
 *
 * Delete this folder when you replace the starter page.
 */
import { useEffect, useState } from 'react'
import { useTheme } from '@lando-labs/lando-ds'
import { Button } from '@lando-labs/lando-ds/components/Button/Button'
import { PALETTE, PRESETS, type PresetId } from './palette'

/**
 * True only after hydration.
 *
 * Anything whose value the SERVER cannot know — the OS colour-scheme preference,
 * a preset persisted in localStorage — must not be rendered until this is true.
 * The server would guess, the client would correct it, and React reports the
 * difference as a hydration error. Render something stable until mounted.
 */
function useMounted(): boolean {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  return mounted
}

/** Toggle light/dark. Sits above the palette, because it re-colours it. */
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

function CopyButton({ value, label }: { value: string; label: string }) {
  const [done, setDone] = useState(false)
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => {
        void navigator.clipboard?.writeText(value)
        setDone(true)
        setTimeout(() => setDone(false), 1200)
      }}
    >
      {done ? 'Copied' : label}
    </Button>
  )
}

/**
 * The swatch grid.
 *
 * Each chip's background is `var(--token)` — resolved by the browser, so it is
 * always the real colour for the current preset and mode. Clicking copies the
 * TOKEN PATH, never a hex: copying hex out of a design system is the exact
 * failure the tokens exist to prevent, so there's no affordance for it.
 */
export function Palette() {
  const [copied, setCopied] = useState<string | null>(null)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-6)' }}>
      {PALETTE.map((row) => (
        <div key={row.family}>
          <div style={{ marginBottom: 'var(--spacing-2)' }}>
            <strong>{row.family}</strong>{' '}
            <span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
              {row.note}
            </span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-2)' }}>
            {row.swatches.map((s) => (
              <button
                key={s.token}
                type="button"
                title={`Copy ${s.token}`}
                aria-label={`Copy token ${s.token}`}
                onClick={() => {
                  void navigator.clipboard?.writeText(`var(${s.token})`)
                  setCopied(s.token)
                  setTimeout(() => setCopied(null), 1200)
                }}
                style={{
                  cursor: 'pointer',
                  border: '1px solid var(--color-border-default)',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--color-surface-elevated)',
                  padding: 'var(--spacing-2)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--spacing-1)',
                  minWidth: '5.5rem',
                  textAlign: 'left',
                  font: 'inherit',
                  color: 'var(--color-text-primary)',
                }}
              >
                {/* The fill is the live custom property — never a value from JS. */}
                <span
                  aria-hidden
                  style={{
                    display: 'block',
                    height: '2.5rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--color-border-subtle)',
                    background: `var(${s.token})`,
                  }}
                />
                <span style={{ fontSize: 'var(--text-xs)' }}>{s.step}</span>
                <span
                  style={{
                    fontSize: 'var(--text-xs)',
                    color: 'var(--color-text-secondary)',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  {copied === s.token ? 'copied' : s.token.replace('--color-', '')}
                </span>
              </button>
            ))}
          </div>
        </div>
      ))}
      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
        Click a swatch to copy its token. Use <code>var(--color-…)</code> in your CSS —
        never the hex. The token follows the theme; a hex doesn&rsquo;t.
      </p>
    </div>
  )
}

/**
 * Preset chooser — the page proposes, the file disposes.
 *
 * Clicking previews the preset live (the swatches above re-colour instantly,
 * because they read `var()`). But a preview is all it is: refresh and it's gone,
 * and your AI reads `providers.tsx`, not this page's runtime state. To keep a
 * preset you paste two lines — and they must agree, or the app paints the old
 * palette for a frame on every load before snapping to the new one.
 */
export function PresetChooser() {
  const { themePreset, setThemePreset } = useTheme()
  const [picked, setPicked] = useState<PresetId | null>(null)
  const mounted = useMounted()
  // Until mounted, show the declared default — the server has no way to know a
  // preset the user persisted last visit, and guessing would be a hydration error.
  const active = mounted ? ((picked ?? themePreset ?? 'brand-neutral') as string) : 'brand-neutral'

  const providers = `<ThemeProvider preset="${active}">`
  const layout = `themeScript({ defaultPreset: '${active}' })`

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-2)' }}>
        {PRESETS.map((p) => (
          <Button
            key={p.id}
            variant={active === p.id ? 'primary' : 'outline'}
            size="sm"
            onClick={() => {
              setThemePreset(p.id)
              setPicked(p.id)
            }}
            title={p.note}
          >
            {p.name}
          </Button>
        ))}
      </div>

      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', margin: 0 }}>
        This is a <strong>preview</strong> — a refresh resets it. To keep{' '}
        <code>{active}</code>, make these two edits. They have to match, or the app
        flashes the old palette on every load.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' }}>
        <div>
          <div style={{ fontSize: 'var(--text-sm)', marginBottom: 'var(--spacing-1)' }}>
            <code style={{ fontFamily: 'var(--font-mono)' }}>app/providers.tsx</code>
          </div>
          <div style={{ display: 'flex', gap: 'var(--spacing-2)', alignItems: 'center' }}>
            <code
              style={{
                flex: 1,
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--text-sm)',
                background: 'var(--color-surface-secondary)',
                border: '1px solid var(--color-border-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: 'var(--spacing-2)',
                overflowX: 'auto',
              }}
            >
              {providers}
            </code>
            <CopyButton value={providers} label="Copy" />
          </div>
        </div>

        <div>
          <div style={{ fontSize: 'var(--text-sm)', marginBottom: 'var(--spacing-1)' }}>
            <code style={{ fontFamily: 'var(--font-mono)' }}>app/layout.tsx</code>
          </div>
          <div style={{ display: 'flex', gap: 'var(--spacing-2)', alignItems: 'center' }}>
            <code
              style={{
                flex: 1,
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--text-sm)',
                background: 'var(--color-surface-secondary)',
                border: '1px solid var(--color-border-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: 'var(--spacing-2)',
                overflowX: 'auto',
              }}
            >
              {layout}
            </code>
            <CopyButton value={layout} label="Copy" />
          </div>
        </div>
      </div>

      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', margin: 0 }}>
        Only three presets are offered here — the design system ships more, but
        these are the ones whose button text passes WCAG AA contrast today.
      </p>
    </div>
  )
}
