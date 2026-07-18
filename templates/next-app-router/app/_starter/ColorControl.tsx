'use client'

/**
 * The colour-foundation control card: pick or paste a primary, get an
 * AA-safe result and a few quick starts, dial in optional secondary/accent
 * harmony, and copy the emitted CSS. Pure controls + display — all state
 * and handlers are owned by `ColorFoundation` and passed in as props.
 *
 * Delete this file when you replace the starter page.
 */
import { type CSSProperties, type ChangeEvent } from 'react'
import { ChevronDown } from 'lucide-react'
import { Card } from '@lando-labs/lando-ds/components/Card/Card'
import { CardHeader } from '@lando-labs/lando-ds/components/Card/CardHeader'
import { CardTitle } from '@lando-labs/lando-ds/components/Card/CardTitle'
import { CardBody } from '@lando-labs/lando-ds/components/Card/CardBody'
import { Stack } from '@lando-labs/lando-ds/components/Stack/Stack'
import { Inline } from '@lando-labs/lando-ds/components/Inline/Inline'
import { Text } from '@lando-labs/lando-ds/components/Text/Text'
import { Button } from '@lando-labs/lando-ds/components/Button/Button'
import { Input } from '@lando-labs/lando-ds/components/Input/Input'
import { Switch } from '@lando-labs/lando-ds/components/Switch/Switch'
import { Badge } from '@lando-labs/lando-ds/components/Badge/Badge'
import { Alert } from '@lando-labs/lando-ds/components/Alert/Alert'
import { ColorSwatch } from '@lando-labs/lando-ds/components/ColorSwatch/ColorSwatch'
import { CodeBlock } from '@lando-labs/lando-ds/components/CodeBlock/CodeBlock'
import { Divider } from '@lando-labs/lando-ds/components/Divider/Divider'
import {
  SegmentedControl,
  type SegmentedControlOption,
} from '@lando-labs/lando-ds/components/SegmentedControl/SegmentedControl'
import { QUICK_START } from './starter-data'
import { deriveHarmony, oklchToHex, RAMP_TYPES, type AccessibleColor, type Oklch, type RampType } from './color'

const HEX_RE = /^#[0-9a-fA-F]{6}$/

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

export interface ColorControlProps {
  primaryHex: string
  hexDraft: string
  accessible: AccessibleColor
  onPickPrimary: (hex: string) => void
  onHexDraftChange: (value: string) => void
  onHexDraftBlur: () => void
  onApplyFix: () => void

  ramp: RampType
  onRampChange: (ramp: RampType) => void
  pinnedSecondary: Oklch | undefined

  customizeOpen: boolean
  onToggleCustomize: () => void

  secondaryOn: boolean
  onToggleSecondary: () => void
  secondaryHex: string
  secondaryDraft: string
  onPickSecondary: (hex: string) => void
  onSecondaryDraftChange: (value: string) => void
  onSecondaryDraftBlur: () => void

  artifact: string
}

export function ColorControl({
  primaryHex,
  hexDraft,
  accessible,
  onPickPrimary,
  onHexDraftChange,
  onHexDraftBlur,
  onApplyFix,
  ramp,
  onRampChange,
  pinnedSecondary,
  customizeOpen,
  onToggleCustomize,
  secondaryOn,
  onToggleSecondary,
  secondaryHex,
  secondaryDraft,
  onPickSecondary,
  onSecondaryDraftChange,
  onSecondaryDraftBlur,
  artifact,
}: ColorControlProps) {
  const rampOptions: SegmentedControlOption[] = RAMP_TYPES.map((r) => {
    const preview = deriveHarmony(accessible.oklch, r.id, pinnedSecondary)
    return {
      value: r.id,
      label: r.label,
      icon: (
        <Inline gap="xs" as="span">
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
        </Inline>
      ),
    }
  })
  const selectedRamp = RAMP_TYPES.find((r) => r.id === ramp)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your colours</CardTitle>
      </CardHeader>
      <CardBody>
        <Stack gap="lg">
          <Stack gap="md">
            <Inline gap="md" align="end" wrap>
              <Stack gap="xs">
                <Text as="label" htmlFor="primary-color-well" size="sm" color="var(--color-text-secondary)">
                  Primary
                </Text>
                {/* Shows the colour you chose, not the corrected one — the well and
                    hex field reflect your input; the preview reflects the safe
                    output; the "Fix contrast" button bridges the two. */}
                <input
                  id="primary-color-well"
                  type="color"
                  value={primaryHex}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => onPickPrimary(e.target.value)}
                  aria-label="Pick primary colour"
                  style={colorInputStyle}
                />
              </Stack>
              <Inline grow={1}>
                <Input
                  id="primary-hex"
                  name="primary-hex"
                  label="Hex"
                  value={hexDraft}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => onHexDraftChange(e.target.value)}
                  onBlur={onHexDraftBlur}
                  placeholder="#4F46E5"
                  error={hexDraft && !HEX_RE.test(hexDraft) ? 'Needs a 6-digit hex, e.g. #4F46E5' : undefined}
                />
              </Inline>
            </Inline>

            {/* A11y feedback: quiet when it already passes, actionable when it didn't. */}
            {accessible.corrected ? (
              <Alert variant="warning" inline title="Contrast adjusted">
                <Stack gap="sm">
                  <Text size="sm">
                    That colour didn&rsquo;t clear 4.5:1 white-text contrast, so it&rsquo;s been darkened to{' '}
                    <Text as="span" variant="mono">
                      {accessible.hex}
                    </Text>{' '}
                    ({accessible.ratioOnWhite.toFixed(2)}:1) — same hue, same chroma, just readable.
                  </Text>
                  <Inline>
                    <Button size="sm" variant="outline" onClick={onApplyFix}>
                      Fix contrast
                    </Button>
                  </Inline>
                </Stack>
              </Alert>
            ) : (
              <Inline>
                <Badge variant="success" size="sm">
                  AA ✓ {accessible.ratioOnWhite.toFixed(2)}:1 on white
                </Badge>
              </Inline>
            )}

            <Stack gap="xs">
              <Text size="sm" color="var(--color-text-secondary)">
                No colour in mind? Start here.
              </Text>
              <Inline gap="sm" wrap>
                {QUICK_START.map((s) => (
                  <button
                    key={s.hex}
                    type="button"
                    onClick={() => onPickPrimary(s.hex)}
                    aria-label={`Use ${s.name}`}
                    title={s.name}
                    style={swatchDotStyle(s.hex, primaryHex === s.hex)}
                  />
                ))}
              </Inline>
            </Stack>

            {/* The deep end — off by default. Toggling a ramp changes nothing on
                the real components in the preview card (and under Tonal,
                primary/accent are byte-identical tokens), so it's opt-in. */}
            <Stack gap="md">
              <Inline>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onToggleCustomize}
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
              </Inline>
              {/* Conditionally rendered, not just visually collapsed. The DS
                  Collapsible hides closed content with height:0 + aria-hidden but
                  leaves its controls focusable and in the tab order (no `inert`), so
                  a keyboard user would tab into invisible fields. Unmounting avoids
                  that; the ramp + secondary STATE lives in the parent, so it
                  survives the close and is intact when reopened. */}
              {customizeOpen && (
                <Stack gap="md" id="harmony-customize">
                  <Stack gap="xs">
                    <Text size="sm" color="var(--color-text-secondary)">
                      How secondary + accent relate to primary
                    </Text>
                    <SegmentedControl options={rampOptions} value={ramp} onChange={(v) => onRampChange(v as RampType)} fullWidth />
                    {selectedRamp ? (
                      <Text size="sm" color="var(--color-text-secondary)">
                        {selectedRamp.blurb}
                      </Text>
                    ) : null}
                  </Stack>

                  <Stack gap="sm">
                    <Switch label="Pin a secondary colour" checked={secondaryOn} onChange={() => onToggleSecondary()} />
                    {secondaryOn ? (
                      <Inline gap="md" align="end" wrap>
                        <Stack gap="xs">
                          <Text as="label" htmlFor="secondary-color-well" size="sm" color="var(--color-text-secondary)">
                            Secondary
                          </Text>
                          <input
                            id="secondary-color-well"
                            type="color"
                            value={HEX_RE.test(secondaryHex) ? secondaryHex : '#0F766E'}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => onPickSecondary(e.target.value)}
                            aria-label="Pick secondary colour"
                            style={colorInputStyle}
                          />
                        </Stack>
                        <Inline grow={1}>
                          <Input
                            id="secondary-hex"
                            name="secondary-hex"
                            label="Hex"
                            value={secondaryDraft}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => onSecondaryDraftChange(e.target.value)}
                            onBlur={onSecondaryDraftBlur}
                            placeholder="#0F766E"
                            error={
                              secondaryDraft && !HEX_RE.test(secondaryDraft)
                                ? 'Needs a 6-digit hex, e.g. #0F766E'
                                : undefined
                            }
                          />
                        </Inline>
                      </Inline>
                    ) : (
                      <Text size="sm" color="var(--color-text-secondary)">
                        Off by default — accent derives from primary alone.
                      </Text>
                    )}
                  </Stack>
                </Stack>
              )}
            </Stack>
          </Stack>

          <Divider label="Your CSS" />

          <Stack gap="sm">
            <Text size="sm">
              Paste into{' '}
              <Text as="span" variant="mono">
                app/globals.css
              </Text>
              , inside the{' '}
              <Text as="span" variant="mono">
                @layer app
              </Text>{' '}
              block already there. No reroll needed — the same inputs always build the same palette.
            </Text>
            {accessible.corrected ? (
              <Text size="sm" color="var(--color-text-secondary)">
                Emitted with the contrast-safe value (
                <Text as="span" variant="mono">
                  {accessible.hex}
                </Text>
                ), not the colour you picked (
                <Text as="span" variant="mono">
                  {primaryHex}
                </Text>
                ). Click <strong>Fix contrast</strong> above to make them match.
              </Text>
            ) : null}
            <CodeBlock code={artifact} language="css" title="app/globals.css — inside @layer app" />
          </Stack>
        </Stack>
      </CardBody>
    </Card>
  )
}
