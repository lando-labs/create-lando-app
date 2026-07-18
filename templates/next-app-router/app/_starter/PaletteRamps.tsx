'use client'

/**
 * The full palette your one colour generates. Each role has a five-step ramp
 * the DS derives from its base with `color-mix` — so every block below reads
 * `var(--color-<role>-<step>)` and is the real derived colour, live. The last
 * row is the surface set the tint leans toward your brand.
 *
 * Delete this file when you replace the starter page.
 */
import type { CSSProperties } from 'react'
import { Stack } from '@lando-labs/lando-ds/components/Stack/Stack'
import { Inline } from '@lando-labs/lando-ds/components/Inline/Inline'
import { Text } from '@lando-labs/lando-ds/components/Text/Text'
import { RAMP_ROLES, RAMP_STEPS, SURFACE_SWATCHES } from './starter-data'

const barStyle: CSSProperties = {
  display: 'inline-flex',
  borderRadius: 'var(--radius-md)',
  overflow: 'hidden',
  border: '1px solid var(--color-border-subtle)',
}
const cellStyle = (varName: string): CSSProperties => ({
  width: '2.25rem',
  height: '1.75rem',
  background: `var(${varName})`,
})

/** A continuous ramp bar of `var()`-backed cells — never a JS-computed colour. */
function Ramp({ label, note, cells }: { label: string; note?: string; cells: { varName: string; title: string }[] }) {
  return (
    <Inline gap="sm" align="center" wrap>
      <div style={{ minWidth: '6rem' }}>
        <Text size="sm" weight="medium">
          {label}
        </Text>
        {note ? (
          <Text as="div" size="sm" color="var(--color-text-secondary)">
            {note}
          </Text>
        ) : null}
      </div>
      <span style={barStyle}>
        {cells.map((c) => (
          <span key={c.varName} aria-hidden title={c.title} style={cellStyle(c.varName)} />
        ))}
      </span>
    </Inline>
  )
}

export function PaletteRamps() {
  return (
    <Stack gap="sm">
      {RAMP_ROLES.map((r) => (
        <Ramp
          key={r.role}
          label={r.label}
          note={r.note}
          cells={RAMP_STEPS.map((step) => ({
            varName: `--color-${r.role}-${step}`,
            title: `${r.role}-${step}`,
          }))}
        />
      ))}
      <Ramp
        label="Surfaces"
        note="tint follows brand"
        cells={SURFACE_SWATCHES.map((s) => ({ varName: `--color-${s.token}`, title: s.token }))}
      />
    </Stack>
  )
}
