'use client'

/**
 * The interactive bits of the starter page. Everything else renders on the
 * server — only what needs state lives here.
 *
 * Delete this folder when you replace the starter page.
 */
import { useMemo, useState, type CSSProperties, type ChangeEvent } from 'react'
import { ChevronDown, Copy, Check } from 'lucide-react'
import { useTheme } from '@lando-labs/lando-ds'
import { useClipboard, useDisclosure, useMounted } from '@lando-labs/lando-ds/hooks'
import { Button } from '@lando-labs/lando-ds/components/Button/Button'
import { IconButton } from '@lando-labs/lando-ds/components/IconButton/IconButton'
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

/**
 * A starter prompt, copyable in one click. The DS's clipboard hook tracks
 * success/failure itself — no try/catch, no hand-rolled "Copied!" timer.
 */
export function PromptRow({ prompt }: { prompt: string }) {
  const { copy, copied } = useClipboard()
  return (
    <li
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--spacing-3)',
        marginBottom: 'var(--spacing-2)',
      }}
    >
      <span style={{ flex: 1 }}>{prompt}</span>
      <IconButton
        aria-label={copied ? 'Copied' : `Copy prompt: ${prompt}`}
        size="sm"
        variant="ghost"
        onClick={() => copy(prompt)}
      >
        {copied ? <Check size={16} /> : <Copy size={16} />}
      </IconButton>
    </li>
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

const captionStyle: CSSProperties = {
  margin: 0,
  fontSize: 'var(--text-sm)',
  color: 'var(--color-text-secondary)',
}

/**
 * The colour-foundation control: pick or paste a primary, get an AA-safe
 * result and a few quick starts, see it on real components, copy the CSS.
 * Secondary/accent harmony is an optional deep end — collapsed by default,
 * because toggling a ramp changes nothing on the real components below (and
 * under Tonal, primary/accent are byte-identical tokens).
 */
export function ColorFoundation() {
  const [primaryHex, setPrimaryHex] = useState(QUICK_START[0].hex) // committed, drives the palette
  const [hexDraft, setHexDraft] = useState(QUICK_START[0].hex) // the text field's live value; may be mid-edit
  const [ramp, setRamp] = useState<RampType>('tonal')
  const [customizeOpen, customizeHandlers] = useDisclosure(false)
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
  const resolvedSecondaryHex = oklchToHex(palette.secondary.L, palette.secondary.C, palette.secondary.H)
  const resolvedAccentHex = oklchToHex(palette.accent.L, palette.accent.C, palette.accent.H)

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

        {/* The deep end — off by default. Toggling a ramp changes nothing on
            the real components below (and under Tonal, primary/accent are
            byte-identical tokens), so it's opt-in, not part of the main path. */}
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={customizeHandlers.toggle}
            aria-expanded={customizeOpen}
            aria-controls="harmony-customize"
            rightIcon={
              <ChevronDown
                size={16}
                style={{
                  transform: customizeOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'var(--transitions-transform)',
                }}
              />
            }
          >
            Customise secondary + accent (optional)
          </Button>
          {/* Conditionally rendered, not just visually collapsed. The DS
              Collapsible hides closed content with height:0 + aria-hidden but
              leaves its controls focusable and in the tab order (no `inert`), so
              a keyboard user would tab into invisible fields. Unmounting avoids
              that; the ramp + secondary STATE lives in this component, so it
              survives the close and is intact when reopened. */}
          {customizeOpen && (
            <div
              id="harmony-customize"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--spacing-4)',
                paddingTop: 'var(--spacing-4)',
              }}
            >
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
                        title={r.label}
                      >
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                          {r.blurb}
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
                  <p style={{ ...captionStyle, marginTop: 'var(--spacing-2)' }}>
                    Off by default — accent derives from primary alone.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <Divider label="Preview" />

      {/* The result, on real components — live, not a screenshot. `previewVars`
          is applied as inline style on this wrapper, so everything inside
          re-colours from the palette above. Primary leads: it's the one role
          that visibly recolours a filled component, so it's the star here —
          secondary/accent are proven as swatches with their resolved hex,
          not faked onto components the DS deliberately keeps neutral. */}
      <div style={{ ...previewVars, display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' } as CSSProperties}>
        <div style={{ display: 'flex', gap: 'var(--spacing-3)', flexWrap: 'wrap', alignItems: 'center' }}>
          <Button variant="primary" size="lg">
            Primary action
          </Button>
          <Button variant="outline">Outline</Button>
        </div>

        <div style={{ display: 'flex', gap: 'var(--spacing-5)', flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <ColorSwatch
            size="lg"
            color="var(--color-primary)"
            aria-label="Primary colour preview"
            label={
              <span style={{ display: 'flex', flexDirection: 'column' }}>
                <span>Primary</span>
                <code style={{ fontFamily: 'var(--font-mono)' }}>{accessible.hex}</code>
              </span>
            }
          />
          <ColorSwatch
            size="md"
            color="var(--color-secondary)"
            aria-label="Secondary colour preview"
            label={
              <span style={{ display: 'flex', flexDirection: 'column' }}>
                <span>Secondary</span>
                <code style={{ fontFamily: 'var(--font-mono)' }}>{resolvedSecondaryHex}</code>
              </span>
            }
          />
          <ColorSwatch
            size="md"
            color="var(--color-accent)"
            aria-label="Accent colour preview"
            label={
              <span style={{ display: 'flex', flexDirection: 'column' }}>
                <span>Accent</span>
                <code style={{ fontFamily: 'var(--font-mono)' }}>{resolvedAccentHex}</code>
              </span>
            }
          />
        </div>
        {customizeOpen ? (
          <p style={captionStyle}>
            Secondary and accent are derived supporting roles you consume manually — the DS keeps filled
            components primary-only by design, so look-alike swatches under a Tonal ramp are expected, not
            broken.
          </p>
        ) : null}

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

      <Divider label="Your CSS" />

      {/* The artifact — what you actually take away. */}
      <div>
        <p style={{ marginTop: 0, marginBottom: 'var(--spacing-2)', fontSize: 'var(--text-sm)' }}>
          Paste into <code style={{ fontFamily: 'var(--font-mono)' }}>app/globals.css</code>, inside the{' '}
          <code style={{ fontFamily: 'var(--font-mono)' }}>@layer app</code> block already there. No reroll
          needed — the same inputs always build the same palette.
        </p>
        {accessible.corrected ? (
          <p style={{ ...captionStyle, marginBottom: 'var(--spacing-2)' }}>
            Emitted with the contrast-safe value (
            <code style={{ fontFamily: 'var(--font-mono)' }}>{accessible.hex}</code>), not the colour you
            picked (<code style={{ fontFamily: 'var(--font-mono)' }}>{primaryHex}</code>). Click{' '}
            <strong>Fix contrast</strong> above to make them match.
          </p>
        ) : null}
        <CodeBlock code={artifact} language="css" title="app/globals.css — inside @layer app" />
      </div>
    </div>
  )
}
