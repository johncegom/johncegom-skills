import { atom, read, update } from 'claude-code'
import type { Register } from 'claude-code'

import type { Limit, Reading } from '../types'

const reading = atom({ plugin: 'usage-band', key: 'reading' } as const, null)

const CELLS = 10
const FULL_COLUMNS = 98
const MEDIUM_COLUMNS = 64

// Green below 60% used, yellow from 60%, red from 85%.
const colorFor = (percent: number) => (percent >= 85 ? 'red' : percent >= 60 ? 'yellow' : 'green')

const barFor = (percent: number) => {
  const filled = Math.max(0, Math.min(CELLS, Math.round((percent / 100) * CELLS)))
  return '▰'.repeat(filled) + '▱'.repeat(CELLS - filled)
}

const tokensFor = (count: number) =>
  count >= 1_000_000 ? `${(count / 1_000_000).toFixed(1)}M` : `${Math.round(count / 1000)}k`

const clockFor = (iso?: string) => {
  if (iso === undefined) return undefined
  const at = new Date(iso)
  if (Number.isNaN(at.getTime())) return undefined
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(at.getHours())}:${pad(at.getMinutes())}`
}

const labelFor = (kind: string) =>
  kind === 'five_hour' ? '5h' : kind === 'seven_day' ? '7d' : kind === 'spend_limit' ? 'Spend' : kind.replace(/_/g, ' ')

const toReading = (usage: {
  context: { tokens?: number; window: number; percent?: number }
  rateLimits: Limit[]
  cost?: { usd: number }
}): Reading => ({
  context: { tokens: usage.context.tokens, window: usage.context.window, percent: usage.context.percent },
  limits: usage.rateLimits.map(({ kind, percentUsed, resetsAt }) => ({ kind, percentUsed, resetsAt })),
  costUsd: usage.cost?.usd,
})

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    // A resumed session has figures already; draw them before the first new reply.
    const usage = await $.session.usage()
    await update($, reading, () => toReading(usage))

    return next(e)
  })

  on('session.measure', async ($, e, next) => {
    await update($, reading, () => toReading(e))

    return next(e)
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const current = await read($, reading)

    if (current === null || e.props.hasSurvey) {
      return next(e)
    }

    const { Box, Text } = $.ui.resolve(e)
    const columns = e.props.bodyColumns
    const sep = <Text dimColor>{'  │  '}</Text>

    // One meter: label, ten-cell bar, percent used, and an optional note.
    const meter = (label: string, percent: number, note?: string) => {
      const color = colorFor(percent)
      return (
        <Text>
          <Text dimColor>{label} </Text>
          <Text color={color}>{barFor(percent)}</Text>
          <Text color={color} bold>{` ${Math.round(percent)}%`}</Text>
          {note === undefined ? '' : <Text dimColor>{`  ${note}`}</Text>}
        </Text>
      )
    }

    const percent = current.context.percent
    const isWide = columns >= FULL_COLUMNS
    const isMedium = columns >= MEDIUM_COLUMNS

    // Before the first reply there is nothing to measure yet.
    if (percent === undefined) {
      return (
        <Box>
          <Text dimColor>{`Context ${barFor(0)} —  waiting for first reply`}</Text>
        </Box>
      )
    }

    const five = current.limits.find(l => l.kind === 'five_hour')

    // Very narrow: one short phrase, coloured by the fuller of the two figures.
    if (!isMedium) {
      const worst = Math.max(percent, five?.percentUsed ?? 0)
      const text = `ctx ${Math.round(percent)}%` + (five ? ` · 5h ${Math.round(five.percentUsed)}%` : '')
      return (
        <Box>
          <Text color={colorFor(worst)}>{text}</Text>
        </Box>
      )
    }

    const tokens =
      isWide && current.context.tokens !== undefined
        ? `${tokensFor(current.context.tokens)}/${tokensFor(current.context.window)}`
        : undefined

    const parts = [meter('Context', percent, tokens)]

    for (const limit of current.limits) {
      const resets = clockFor(limit.resetsAt)
      const isOver = limit.percentUsed >= 100
      const note = isOver
        ? resets === undefined ? 'limit reached' : `limit reached, resets ${resets}`
        : limit.kind === 'five_hour' && resets !== undefined ? `resets ${resets}` : undefined
      parts.push(meter(labelFor(limit.kind), limit.percentUsed, note))
    }

    if (isWide && current.costUsd !== undefined) {
      parts.push(<Text dimColor>{`$${current.costUsd.toFixed(2)}`}</Text>)
    }

    return (
      <Box>
        {parts.flatMap((part, i) => (i === 0 ? [part] : [sep, part]))}
      </Box>
    )
  })
}
