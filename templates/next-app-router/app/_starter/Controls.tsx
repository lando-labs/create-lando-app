'use client'

/**
 * The interactive bits of the starter page. Everything else renders on the
 * server — only what needs state lives here.
 *
 * Delete this folder when you replace the starter page.
 */
import { useMemo, useState, type CSSProperties, type ChangeEvent } from 'react'
import { useTheme } from '@lando-labs/lando-ds'
import { useDisclosure, useMounted } from '@lando-labs/lando-ds/hooks'
import { Button } from '@lando-labs/lando-ds/components/Button/Button'
import { Input } from '@lando-labs/lando-ds/components/Input/Input'
import { Switch } from '@lando-labs/lando-ds/components/Switch/Switch'
import { Badge } from '@lando-labs/lando-ds/components/Badge/Badge'
import { Alert } from '@lando-labs/lando-ds/components/Alert/Alert'
import { ColorSwatch } from '@lando-labs/lando-ds/components/ColorSwatch/ColorSwatch'
import { CodeBlock } from '@lando-labs/lando-ds/components/CodeBlock/CodeBlock'
import { Divider } from '@lando-labs/lando-ds/components/Divider/Divider'
import {
  ensureAccessiblePrimary,
  buildPalette,
  deriveHarmony,
  emitLayerApp,
  paletteVars,
  hexToOklch,
  oklchToHex,
  RAMP_TYPES,
  type RampType,
} from './color'

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

const HEX_RE = /^#[0-9a-fA-F]{6}$/

/**
 * Pleasant, AA-passing starting points — each clears 4.5:1 white-text
 * contrast as-is (checked against the DS's own contrast maths), so picking
 * one never trips the correction path. Spread across hue so there's a
 * reasonable starting point regardless of taste.
 */
const QUICK_START: ReadonlyArray<{ hex: string; name: string }> = [
  { hex: '#4F46E5', name: 'Indigo' },
  { hex: '#0F766E', name: 'Teal' },
  { hex: '#BE123C', name: 'Rose' },
  { hex: '#C2410C', name: 'Orange' },
  { hex: '#334155', name: 'Slate' },
]

// Fixed affordance sizes (a colour well, a swatch dot) — an intrinsic control
// dimension, like an icon, not layout rhythm, so an explicit rem is correct
// here rather than a spacing-scale token.
const swatchDotStyle = (hex: string, active: boolean): CSSProperties => ({
  width: '2rem',
  height: '2rem',
  borderRadius: 'var(--radius-full)',
  border: active ? '2px solid var(--color-text-primary)' : '1px solid var(--color-border-default)',
  background: hex,
  cursor: 'pointer',
  padding: 0,
})

const colorInputStyle: CSSProperties = {
  width: '3rem',
  height: '2.5rem',
  border: '1px solid var(--color-border-default)',
  borderRadius: 'var(--radius-sm)',
  padding: 0,
  background: 'none',
  cursor: 'pointer',
}

/**
 * The colour-foundation control: pick or paste a primary, choose how
 * secondary + accent relate to it, optionally pin a secondary, and get back
 * the `@layer app` block to paste into `globals.css`. Below it, the same
 * palette re-colours real DS components live — so what you're picking is
 * never a swatch in the abstract, it's the actual Button/Badge/Alert.
 */
export function ColorFoundation() {
  const [primaryHex, setPrimaryHex] = useState(QUICK_START[0].hex) // committed, drives the palette
  const [hexDraft, setHexDraft] = useState(QUICK_START[0].hex) // the text field's live value; may be mid-edit
  const [ramp, setRamp] = useState<RampType>('tonal')
  const [secondaryOn, secondaryHandlers] = useDisclosure(false)
  const [secondaryHex, setSecondaryHex] = useState('#0F766E')
  const [secondaryDraft, setSecondaryDraft] = useState('#0F766E')

  const accessible = useMemo(() => ensureAccessiblePrimary(primaryHex), [primaryHex])
  const pinnedSecondary = useMemo(
    () => (secondaryOn ? hexToOklch(secondaryHex) : undefined),
    [secondaryOn, secondaryHex],
  )
  const palette = useMemo(
    () => buildPalette(accessible.oklch, ramp, pinnedSecondary),
    [accessible.oklch, ramp, pinnedSecondary],
  )
  const artifact = useMemo(() => emitLayerApp(palette), [palette])
  const previewVars = useMemo(() => paletteVars(palette), [palette])

  const commitPrimary = (value: string) => {
    setHexDraft(value)
    if (HEX_RE.test(value)) setPrimaryHex(value)
  }

  const commitSecondary = (value: string) => {
    setSecondaryDraft(value)
    if (HEX_RE.test(value)) setSecondaryHex(value)
  }

  const applyFix = () => {
    setPrimaryHex(accessible.hex)
    setHexDraft(accessible.hex)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-6)' }}>
      {/* The control. */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
        <div style={{ display: 'flex', gap: 'var(--spacing-4)', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <label
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--spacing-1)',
              fontSize: 'var(--text-sm)',
              color: 'var(--color-text-secondary)',
            }}
          >
            Primary
            {/* Shows the colour you chose, not the corrected one — the well and
                hex field reflect your input; the preview below reflects the safe
                output; the "Fix contrast" button bridges the two. */}
            <input
              type="color"
              value={primaryHex}
              onChange={(e: ChangeEvent<HTMLInputElement>) => {
                setPrimaryHex(e.target.value)
                setHexDraft(e.target.value)
              }}
              aria-label="Pick primary colour"
              style={colorInputStyle}
            />
          </label>
          <div style={{ flex: 1, minWidth: '12rem' }}>
            <Input
              id="primary-hex"
              name="primary-hex"
              label="Hex"
              value={hexDraft}
              onChange={(e: ChangeEvent<HTMLInputElement>) => commitPrimary(e.target.value)}
              onBlur={() => setHexDraft(primaryHex)}
              placeholder="#4F46E5"
              error={hexDraft && !HEX_RE.test(hexDraft) ? 'Needs a 6-digit hex, e.g. #4F46E5' : undefined}
            />
          </div>
        </div>

        {/* A11y feedback: quiet when it already passes, actionable when it didn't. */}
        {accessible.corrected ? (
          <Alert variant="warning" inline title="Contrast adjusted">
            That colour didn&rsquo;t clear 4.5:1 white-text contrast, so it&rsquo;s been darkened to{' '}
            <code style={{ fontFamily: 'var(--font-mono)' }}>{accessible.hex}</code>{' '}
            ({accessible.ratioOnWhite.toFixed(2)}:1) — same hue, same chroma, just readable.
            <div style={{ marginTop: 'var(--spacing-2)' }}>
              <Button size="sm" variant="outline" onClick={applyFix}>
                Fix contrast
              </Button>
            </div>
          </Alert>
        ) : (
          <div>
            <Badge variant="success" size="sm">
              AA ✓ {accessible.ratioOnWhite.toFixed(2)}:1 on white
            </Badge>
          </div>
        )}

        <div>
          <div
            style={{
              fontSize: 'var(--text-sm)',
              color: 'var(--color-text-secondary)',
              marginBottom: 'var(--spacing-2)',
            }}
          >
            No colour in mind? Start here.
          </div>
          <div style={{ display: 'flex', gap: 'var(--spacing-2)', flexWrap: 'wrap' }}>
            {QUICK_START.map((s) => (
              <button
                key={s.hex}
                type="button"
                onClick={() => {
                  setPrimaryHex(s.hex)
                  setHexDraft(s.hex)
                }}
                aria-label={`Use ${s.name}`}
                title={s.name}
                style={swatchDotStyle(s.hex, primaryHex === s.hex)}
              />
            ))}
          </div>
        </div>

        <div>
          <div
            style={{
              fontSize: 'var(--text-sm)',
              color: 'var(--color-text-secondary)',
              marginBottom: 'var(--spacing-2)',
            }}
          >
            How secondary + accent relate to primary
          </div>
          <div style={{ display: 'flex', gap: 'var(--spacing-2)', flexWrap: 'wrap' }}>
            {RAMP_TYPES.map((r) => {
              const preview = deriveHarmony(accessible.oklch, r.id, pinnedSecondary)
              return (
                <Button
                  key={r.id}
                  variant={ramp === r.id ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setRamp(r.id)}
                  title={r.blurb}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                    {r.label}
                    <ColorSwatch
                      size="sm"
                      shape="circle"
                      color={oklchToHex(preview.secondary.L, preview.secondary.C, preview.secondary.H)}
                      aria-label={`${r.label}: secondary preview`}
                    />
                    <ColorSwatch
                      size="sm"
                      shape="circle"
                      color={oklchToHex(preview.accent.L, preview.accent.C, preview.accent.H)}
                      aria-label={`${r.label}: accent preview`}
                    />
                  </span>
                </Button>
              )
            })}
          </div>
        </div>

        <div>
          <Switch
            label="Pin a secondary colour"
            checked={secondaryOn}
            onChange={() => secondaryHandlers.toggle()}
          />
          {secondaryOn ? (
            <div
              style={{
                display: 'flex',
                gap: 'var(--spacing-4)',
                alignItems: 'flex-end',
                marginTop: 'var(--spacing-3)',
                flexWrap: 'wrap',
              }}
            >
              <label
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--spacing-1)',
                  fontSize: 'var(--text-sm)',
                  color: 'var(--color-text-secondary)',
                }}
              >
                Secondary
                <input
                  type="color"
                  value={HEX_RE.test(secondaryHex) ? secondaryHex : '#0F766E'}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => {
                    setSecondaryHex(e.target.value)
                    setSecondaryDraft(e.target.value)
                  }}
                  aria-label="Pick secondary colour"
                  style={colorInputStyle}
                />
              </label>
              <div style={{ flex: 1, minWidth: '12rem' }}>
                <Input
                  id="secondary-hex"
                  name="secondary-hex"
                  label="Hex"
                  value={secondaryDraft}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => commitSecondary(e.target.value)}
                  onBlur={() => setSecondaryDraft(secondaryHex)}
                  placeholder="#0F766E"
                  error={
                    secondaryDraft && !HEX_RE.test(secondaryDraft)
                      ? 'Needs a 6-digit hex, e.g. #0F766E'
                      : undefined
                  }
                />
              </div>
            </div>
          ) : (
            <p
              style={{
                margin: 0,
                marginTop: 'var(--spacing-2)',
                fontSize: 'var(--text-sm)',
                color: 'var(--color-text-secondary)',
              }}
            >
              Off by default — accent derives from primary alone.
            </p>
          )}
        </div>

        <div>
          <p style={{ marginTop: 0, marginBottom: 'var(--spacing-2)', fontSize: 'var(--text-sm)' }}>
            Paste into <code style={{ fontFamily: 'var(--font-mono)' }}>app/globals.css</code>, inside the{' '}
            <code style={{ fontFamily: 'var(--font-mono)' }}>@layer app</code> block already there. No reroll
            needed — the same inputs always build the same palette.
          </p>
          <CodeBlock code={artifact} language="css" title="app/globals.css — inside @layer app" />
        </div>
      </div>

      <Divider label="Preview" />

      {/* The result, on real components. `previewVars` is applied as inline
          style on this wrapper, so everything inside re-colours from the
          palette above — live, not a screenshot. */}
      <div style={{ ...previewVars, display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' } as CSSProperties}>
        {/* The three brand roles, shown truthfully as swatches — each reads its
            own token, and the DS derives a full ramp from every one. */}
        <div style={{ display: 'flex', gap: 'var(--spacing-4)', flexWrap: 'wrap', alignItems: 'center' }}>
          <ColorSwatch color="var(--color-primary)" label="Primary" />
          <ColorSwatch color="var(--color-secondary)" label="Secondary" />
          <ColorSwatch color="var(--color-accent)" label="Accent" />
        </div>
        {/* On real components — proof the tokens flow into the DS, not just
            swatches. Only `primary` demos a brand colour on a filled button:
            the DS's `secondary`/`outline` variants are intentionally neutral. */}
        <div style={{ display: 'flex', gap: 'var(--spacing-3)', flexWrap: 'wrap', alignItems: 'center' }}>
          <Button variant="primary">Primary action</Button>
          <Button variant="outline">Outline</Button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)' }}>
          <Alert variant="success" inline title="Success">
            Harmonised toward your brand — still reads green.
          </Alert>
          <Alert variant="warning" inline title="Warning">
            Nudged toward your brand — still reads amber.
          </Alert>
          <Alert variant="info" inline title="Info">
            Tuned toward your brand — still reads blue.
          </Alert>
          <Alert variant="error" inline title="Error">
            Untouched. Danger stays red — there&rsquo;s no override for it.
          </Alert>
        </div>
      </div>
    </div>
  )
}
