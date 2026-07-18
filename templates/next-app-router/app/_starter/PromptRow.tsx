'use client'

/**
 * A starter prompt, copyable in one click. The DS's clipboard hook tracks
 * success/failure itself — no try/catch, no hand-rolled "Copied!" timer.
 * Renders as a List's `ListItem` so it composes straight into the DS list
 * primitive instead of a hand-rolled `<li>`.
 *
 * Delete this file when you replace the starter page.
 */
import { Copy, Check } from 'lucide-react'
import { useClipboard } from '@lando-labs/lando-ds/hooks'
import { ListItem } from '@lando-labs/lando-ds/components/List/ListItem'
import { IconButton } from '@lando-labs/lando-ds/components/IconButton/IconButton'
import { Text } from '@lando-labs/lando-ds/components/Text/Text'

export function PromptRow({ prompt }: { prompt: string }) {
  const { copy, copied } = useClipboard()
  return (
    <ListItem
      actions={
        <IconButton
          aria-label={copied ? 'Copied' : `Copy prompt: ${prompt}`}
          size="sm"
          variant="ghost"
          onClick={() => copy(prompt)}
        >
          {copied ? <Check size={16} /> : <Copy size={16} />}
        </IconButton>
      }
    >
      <Text size="sm">{prompt}</Text>
    </ListItem>
  )
}
