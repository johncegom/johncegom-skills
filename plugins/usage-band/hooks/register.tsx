import { atom, read, update } from 'claude-code'
import type { Register } from 'claude-code'

import type { Dance, Limit, Reading } from '../types'

const reading = atom({ plugin: 'usage-band', key: 'reading' } as const, null)
const dance = atom({ plugin: 'usage-band', key: 'dance' } as const, { stage: 'off', tick: 0 })

const CELLS = 10
const FULL_COLUMNS = 98
const MEDIUM_COLUMNS = 64
// The dancer needs room past the full band; below this width it stays out.
const DANCER_COLUMNS = 112
// Tick lengths: fast while working, slow once the turn is over. The stages after a
// turn end on `after` timers, and the last one (sleep) has none, so a long-idle
// session redraws nothing.
const WORK_MS = 200
const CHEER_MS = 1000
const DOZE_MS = 2000
const CHEER_FOR_MS = 60_000
const DOZE_FOR_MS = 240_000

// Green below 60% used, yellow from 60%, red from 85%.
const colorFor = (percent: number) => (percent >= 85 ? 'red' : percent >= 60 ? 'yellow' : 'green')

const barFor = (percent: number) => {
  const filled = Math.max(0, Math.min(CELLS, Math.round((percent / 100) * CELLS)))
  return '▰'.repeat(filled) + '▱'.repeat(CELLS - filled)
}

// While a turn runs, the dancer's mood follows the fullest meter, and so does its
// tempo: a beat is one to three ticks, so it moves faster as a limit gets close.
// After the turn it is a dim, calmer figure. `ascii` swaps the few characters that
// East Asian terminals draw double width (♪ ♫ • °) for plain ones.
const dancerFor = (stage: Dance['stage'], worst: number, tick: number, ascii: boolean) => {
  const notes = ascii ? ['~', '*'] : ['♪', '♫']
  if (stage === 'sleep') return '(-_-) zZZ'
  if (stage === 'doze') return tick % 2 === 0 ? '(-_-) zZ' : '(-_-) Zz'
  if (stage === 'cheer') return `${notes[tick % 2]} (^o^)`
  if (worst >= 100) return '\\(x_x)/ !!'
  const [face, stride] =
    worst >= 85 ? [ascii ? '>O<' : '°O°', 1] : worst >= 60 ? [ascii ? 'o_o' : '•_•', 2] : ['^o^', 3]
  const beat = Math.floor(tick / Number(stride))
  const [left, right] = beat % 2 === 0 ? ['\\', '/'] : ['/', '\\']
  return `${notes[Math.floor((beat % 4) / 2)]} ${left}(${face})${right}`
}

// The dancer as the band draws it, or null when it is off. Colour marks work; the
// figure at rest is dim, so it never reads as an alert.
const dancerPart = async ($: any, Text: any, worst: number, isAscii: boolean) => {
  const beat = await read($, dance)
  if (beat.stage === 'off') return null
  const figure = dancerFor(beat.stage, worst, beat.tick, isAscii)

  return beat.stage === 'work' ? <Text color={colorFor(worst)}>{figure}</Text> : <Text dimColor>{figure}</Text>
}

// The timers of the stage in force. A callback that fires after its stage was
// replaced finds `gen` moved on and does nothing.
let gen = 0
let timers: { cancel: () => void }[] = []

const stopTimers = () => {
  for (const timer of timers) timer.cancel()
  timers = []
  gen += 1
}

const startBeat = ($: any, ms: number) => {
  const mine = gen
  timers.push(
    $.clock.every(ms, () => {
      if (mine === gen) void update($, dance, d => ({ ...d, tick: d.tick + 1 }))
    }),
  )
}

const startSleep = async ($: any) => {
  stopTimers()
  await update($, dance, () => ({ stage: 'sleep', tick: 0 }))
}

const startDoze = async ($: any) => {
  stopTimers()
  await update($, dance, () => ({ stage: 'doze', tick: 0 }))
  const mine = gen
  startBeat($, DOZE_MS)
  timers.push(
    $.clock.after(DOZE_FOR_MS, () => {
      if (mine === gen) void startSleep($)
    }),
  )
}

const startCheer = async ($: any) => {
  stopTimers()
  await update($, dance, () => ({ stage: 'cheer', tick: 0 }))
  const mine = gen
  startBeat($, CHEER_MS)
  timers.push(
    $.clock.after(CHEER_FOR_MS, () => {
      if (mine === gen) void startDoze($)
    }),
  )
}

// A session at rest: asleep when the dancer is always on, absent otherwise.
const startRest = async ($: any, isAlwaysOn: boolean) => {
  if (isAlwaysOn) return startSleep($)
  stopTimers()
  await update($, dance, () => ({ stage: 'off', tick: 0 }))
}

const startWork = async ($: any) => {
  stopTimers()
  await update($, dance, () => ({ stage: 'work', tick: 0 }))
  startBeat($, WORK_MS)
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

export const register: Register = (on, options) => {
  const config = options as Record<string, unknown> | undefined
  // `dancer` is 'always' (default), 'working' or 'off'; a stored `false` reads as off.
  const mode = config?.dancer === 'off' || config?.dancer === false ? 'off' : config?.dancer === 'working' ? 'working' : 'always'
  const isAscii = config?.ascii === true
  // Headless runs (`claude -p`, the SDK) have no prompt to dance above: no timers there.
  let isLive = false

  on('session.start', async ($, e, next) => {
    isLive = e.isInteractive
    stopTimers()
    // A resumed session has figures already; draw them before the first new reply.
    const usage = await $.session.usage()
    await update($, reading, () => toReading(usage))
    // Also runs again after a hot reload, which drops the timers but keeps the state.
    await startRest($, mode === 'always' && isLive)

    return next(e)
  })

  // The band redraws only when a figure changes, which is once per reply. While a
  // turn runs, and for a few minutes after it, a timer advances the dancer's beat.
  on('turn.start', async ($, e, next) => {
    if (mode !== 'off' && isLive && (e as { agentId?: string }).agentId === undefined) await startWork($)

    return next(e)
  })

  // Also ends an interrupted or failed turn (`reason` is 'aborted' or 'error').
  on('turn.complete', async ($, e, next) => {
    if ((e as { agentId?: string }).agentId === undefined) {
      if (mode === 'always' && isLive) await startCheer($)
      else await startRest($, false)
    }

    return next(e)
  })

  // A /clear ends the session and starts none, so the timers must stop here.
  on('session.end', async ($, e, next) => {
    await startRest($, mode === 'always' && isLive)

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
      const waiting = <Text dimColor>{`Context ${barFor(0)} —  waiting for first reply`}</Text>
      const figure = isMedium ? await dancerPart($, Text, 0, isAscii) : null

      return <Box>{figure === null ? [waiting] : [waiting, sep, figure]}</Box>
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
      // The Belly sign ฿, as in One Piece; the amount is still the session's cost in US dollars.
      parts.push(<Text dimColor>{`${isAscii ? 'B' : '฿'}${current.costUsd.toFixed(2)}`}</Text>)
    }

    // Read the dance only where it is drawn, so a narrow band is not redrawn by every tick.
    if (columns >= DANCER_COLUMNS) {
      const worst = Math.max(percent, ...current.limits.map(l => l.percentUsed))
      const figure = await dancerPart($, Text, worst, isAscii)
      if (figure !== null) parts.push(figure)
    }

    return (
      <Box>
        {parts.flatMap((part, i) => (i === 0 ? [part] : [sep, part]))}
      </Box>
    )
  })
}
