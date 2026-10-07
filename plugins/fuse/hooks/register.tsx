import { atom, read, update } from 'claude-code'
import type { Register } from 'claude-code'

import type { Pending, Turn } from '../types'
import {
  DARK,
  LIGHT,
  STOP_MESSAGE,
  barParts,
  isEscapeStop,
  layoutFor,
  measure,
  meterText,
  shortCommand,
  stageColor,
  stageOf,
  statsLine,
  symbolsFor,
  whole,
  withTokens,
} from './core'
import type { Limits, Meters, Palette, Symbols } from './core'

const PANE = 'fuse-hold'
const POLL_MS = 400
// A hook has 10 s of its own time, and $.clock.sleep spends it; a $ call in
// flight does not. So the wait between key checks is a short child process.
const SLEEP_ARGV = [
  ['sleep', String(POLL_MS / 1000)],
  ['powershell', '-NoProfile', '-NonInteractive', '-Command', `Start-Sleep -Milliseconds ${POLL_MS}`],
]
let sleeper: string[] | null = null

const turnAtom = atom({ plugin: 'fuse', key: 'turn' } as const, null)
const pendingAtom = atom({ plugin: 'fuse', key: 'pending' } as const, null)
const lastAtom = atom({ plugin: 'fuse', key: 'last' } as const, null)
// The hold loop reads the answer from here: a state read inside a running
// dispatch can return the value it first saw. State still drives the drawing.
const answers = new Map<string, 'extend' | 'stop'>()
let holding: string | null = null

const remindedAtom = atom({ plugin: 'fuse', key: 'isReminded' } as const, false)

type Cfg = { limits: Limits; countSubagents: boolean; palette: Palette; sym: Symbols; statsPath: string }

function configOf(options: Record<string, unknown>): Cfg {
  return {
    limits: {
      minutes: Number(options.minutes ?? 45),
      calls: Number(options.toolCalls ?? 100),
      context: Number(options.contextGrowth ?? 40),
      maxExtensions: Number(options.maxExtensions ?? 2),
    },
    countSubagents: options.countSubagents !== false,
    palette: options.theme === 'light' ? LIGHT : DARK,
    sym: symbolsFor({ ascii: options.ascii === true, emoji: options.emoji === true }),
    statsPath: String(options.statsPath ?? '.claude/fuse-stats.jsonl'),
  }
}

async function safeUsage($: any) {
  try {
    const u = await $.session.usage()
    return { tokens: (u.context.tokens ?? null) as number | null, window: (u.context.window ?? 0) as number }
  } catch {
    return { tokens: null, window: 0 }
  }
}

/** Reads the clock and the context, and writes them into the turn. */
async function refresh($: any): Promise<Turn | null> {
  const now = await $.clock.now()
  const u = await safeUsage($)
  return update($, turnAtom, (t: Turn | null) =>
    t === null ? null : { ...withTokens(t, u.tokens, u.window), nowAt: now },
  ) as Promise<Turn | null>
}

/** One short sleep that costs the hook no budget; rejects when `signal` aborts. */
async function pause($: any, signal: AbortSignal) {
  for (const argv of sleeper === null ? SLEEP_ARGV : [sleeper]) {
    if (signal.aborted) throw new Error('aborted')
    try {
      const done = await $.process.run(argv, { timeoutMs: 5000 })
      if (done.exitCode === 0) {
        sleeper = argv
        return
      }
    } catch {
      // try the next one
    }
  }
  if (signal.aborted) throw new Error('aborted')
  await $.clock.sleep(POLL_MS, { signal }) // no sleeper on this machine: the hook's own time
}

async function closePane($: any) {
  try {
    await $.ui.close({ id: PANE })
  } catch {
    // already closed
  }
}

/**
 * Holds one call and waits for the person. Resolves 'extend' or 'stop', or
 * 'again' when another held call was the one asked and has since been answered.
 */
async function hold($: any, cfg: Cfg, input: Record<string, unknown>, signal: AbortSignal, m: Meters) {
  const turn = (await read($, turnAtom)) as Turn
  const mine: Pending = {
    id: String(input.tool_use_id ?? `${turn.nowAt}`),
    tool: String(input.tool ?? ''),
    command: shortCommand(input),
    which: m.nearest,
    meter: meterText(m),
    extLeft: Math.max(0, cfg.limits.maxExtensions - turn.extensions),
    extMax: cfg.limits.maxExtensions,
    minutes: m.minutes,
    calls: m.calls,
    growth: m.growth,
    canExtend: turn.extensions < cfg.limits.maxExtensions,
    isInline: false,
    choice: null,
  }
  const claimed = (await update($, pendingAtom, (p: Pending | null) => p ?? mine)) as Pending
  if (claimed.id !== mine.id || (holding !== null && holding !== mine.id)) {
    // Another call is being asked; wait for its answer, then check again.
    try {
      while (holding !== null) await pause($, signal)
    } catch {
      return 'stop'
    }
    return 'again'
  }

  holding = mine.id
  answers.delete(mine.id)
  const openedAt = turn.nowAt
  await update($, turnAtom, (t: Turn | null) => (t === null ? null : { ...t, pausedAt: openedAt }))

  let choice: 'extend' | 'stop' = 'stop'
  try {
    const opened = await $.ui.open({ id: PANE, title: 'Fuse', focus: true, closeOnEscape: true, holdToasts: true, rows: 7 })
    if (!opened.isPlaced) {
      // The pane waits undrawn (narrow terminal): draw the same box above the prompt.
      await closePane($)
      await update($, pendingAtom, (p: Pending | null) => (p === null ? null : { ...p, isInline: true }))
    }
    for (;;) {
      const answered = answers.get(mine.id)
      if (answered !== undefined) {
        choice = answered
        break
      }
      await pause($, signal)
    }
  } catch {
    choice = 'stop' // interrupted, or the hook's own budget ran out
  }

  await closePane($)
  const closedAt = await $.clock.now()
  await update($, turnAtom, (t: Turn | null) =>
    t === null
      ? null
      : {
          ...t,
          nowAt: closedAt,
          pausedMs: t.pausedMs + (t.pausedAt === null ? 0 : Math.max(0, closedAt - t.pausedAt)),
          pausedAt: null,
          extensions: choice === 'extend' ? t.extensions + 1 : t.extensions,
          isStopped: choice === 'stop' ? true : t.isStopped,
        },
  )
  await update($, pendingAtom, () => null)
  answers.delete(mine.id)
  holding = null

  return choice
}

async function choose($: any, choice: 'extend' | 'stop') {
  const p = (await update($, pendingAtom, (cur: Pending | null) =>
    cur !== null && cur.choice === null ? { ...cur, choice } : cur,
  )) as Pending | null
  if (p !== null && p.choice !== null && !answers.has(p.id)) answers.set(p.id, p.choice)
}

async function logTurn($: any, cfg: Cfg, e: any, before: Turn) {
  const turn = (await refresh($)) ?? before
  const m = measure(turn, cfg.limits, turn.nowAt)
  await update($, lastAtom, () => ({ pct: Math.min(100, whole(m.pct)), minutes: whole(m.minutes), calls: m.calls }))
  await update($, turnAtom, () => null)
  if ((await read($, pendingAtom)) !== null) {
    await update($, pendingAtom, () => null)
    await closePane($)
  }

  const line = statsLine({
    at: turn.nowAt,
    turnId: e.turnId,
    minutes: m.minutes,
    calls: m.calls,
    growth: m.growth,
    pct: m.pct,
    extensions: turn.extensions,
    isAborted: e.isAborted,
  })
  try {
    const old = (await $.fs.exists(cfg.statsPath)) ? ((await $.fs.read(cfg.statsPath)) as string) : ''
    await $.fs.write(cfg.statsPath, `${old}${old === '' || old.endsWith('\n') ? '' : '\n'}${line}\n`)
    if (!(await read($, remindedAtom))) {
      await update($, remindedAtom, () => true)
      const ignore = (await $.fs.exists('.gitignore')) ? ((await $.fs.read('.gitignore')) as string) : ''
      if (!ignore.includes(cfg.statsPath)) $.ui.toast(`fuse: keep ${cfg.statsPath} out of git (add it to .gitignore)`)
    }
  } catch {
    $.ui.toast(`fuse: could not write ${cfg.statsPath}`)
  }
}

// ---- drawing ---------------------------------------------------------------

function barRuns(el: any, cfg: Cfg, pct: number, width: number, calls: number) {
  const { Text } = el
  const stage = stageOf(pct)
  const color = stageColor(stage, cfg.palette)
  const flicker = calls % 2 === 1 || stage === 'HELD'
  return barParts(pct, width, cfg.sym).map(part => {
    if (part.color === 'spark') return <Text color={color} bold={flicker}>{part.text}</Text>
    const c = { ash: cfg.palette.ash, ember: cfg.palette.ember, rope: cfg.palette.rope, bomb: cfg.palette.bomb }[part.color]
    return <Text color={c}>{part.text}</Text>
  })
}

function holdBox($: any, el: any, cfg: Cfg, p: Pending, isInline: boolean, columns: number) {
  const { Box, Text, Button } = el
  const width = Math.max(20, Math.min(columns, 56))
  const row = (label: string, value: string) => (
    <Box>
      <Text dimColor>{` ${label.padEnd(10)}`}</Text>
      <Text>{value}</Text>
    </Box>
  )
  const rule = <Text color={cfg.palette.ash}>{'─'.repeat(width)}</Text>

  return (
    <Box flexDirection="column">
      <Box>
        <Text color={cfg.palette.ash}>{cfg.sym.ash.repeat(Math.max(2, width - 14))}</Text>
        <Text color={cfg.palette.held} bold>{`${cfg.sym.held}  FUSE HELD`}</Text>
      </Box>
      {rule}
      {row('limit hit', p.meter)}
      {row('this turn', `${whole(p.minutes)} min · ${p.calls} calls · ${whole(p.growth)}% growth`)}
      {row('next call', `${p.tool}  ${p.command}`)}
      {rule}
      <Box>
        <Text> </Text>
        {p.canExtend && <Button key="extend" plain hotkey="1" label="Extend by half" onPress={() => choose($, 'extend')} />}
        {p.canExtend && <Text color={cfg.palette.ember}>{`  (↻ ${p.extLeft} of ${p.extMax} left)`}</Text>}
        <Text>{p.canExtend ? '     ' : ''}</Text>
        <Button key="stop" plain hotkey="2" label="Stop" onPress={() => choose($, 'stop')} />
      </Box>
      <Text dimColor>{isInline ? ' ctrl+x tab or a click, then 1 or 2' : ' Esc stops the turn'}</Text>
    </Box>
  )
}

function lastBurnLine(el: any, cfg: Cfg, last: { pct: number; minutes: number; calls: number }, columns: number) {
  const { Box, Text } = el
  const layout = layoutFor(columns)
  if (layout.kind === 'tiny') return <Text dimColor>{cfg.sym.spark[stageOf(last.pct)]} {last.pct}%</Text>
  const bar = barParts(last.pct, layout.width, cfg.sym).map(part => <Text dimColor>{part.text}</Text>)
  const pct = `${last.pct}%`.padStart(4)
  if (layout.kind === 'short') return <Box>{bar}<Text dimColor> {pct}</Text></Box>
  return (
    <Box>
      <Text dimColor>last burn  </Text>{bar}
      <Text dimColor>  {pct} · {last.minutes} min · {last.calls} calls</Text>
    </Box>
  )
}

function fuseLine(el: any, cfg: Cfg, turn: Turn, columns: number) {
  const { Box, Text } = el
  const layout = layoutFor(columns)
  const m = measure(turn, cfg.limits, turn.nowAt)
  const pct = Math.min(100, whole(m.pct))
  const stage = stageOf(m.pct)
  const color = stageColor(stage, cfg.palette)
  const isHeld = stage === 'HELD'

  if (layout.kind === 'tiny') return <Text color={color} bold={isHeld}>{cfg.sym.spark[stage]} {pct}%</Text>
  if (layout.kind === 'short') {
    return (
      <Box>
        {barRuns(el, cfg, m.pct, layout.width, turn.calls)}
        <Text color={color} bold={isHeld}> {`${pct}%`.padStart(4)}</Text>
      </Box>
    )
  }
  const text = meterText(m)
  const splice = turn.extensions > 0 ? `  ↻ spliced ${turn.extensions}×` : ''
  const fits = 8 + 16 + 2 + 4 + 3 + text.length + splice.length <= columns
  return (
    <Box>
      <Text color={color} bold={isHeld}>{stage.padEnd(8)}</Text>
      {barRuns(el, cfg, m.pct, layout.width, turn.calls)}
      <Text>  </Text>
      <Text color={color} bold={isHeld}>{`${pct}%`.padStart(4)}</Text>
      <Text> · {text}</Text>
      {fits && splice !== '' && <Text dimColor>{splice}</Text>}
    </Box>
  )
}

export const register: Register = (on, options) => {
  const cfg = configOf(options as Record<string, unknown>)

  on('turn.start', async ($, e, next) => {
    const now = await $.clock.now()
    const u = await safeUsage($)
    const turn: Turn = {
      startedAt: now,
      nowAt: now,
      baseTokens: u.tokens,
      tokens: u.tokens,
      window: u.window,
      calls: 0,
      extensions: 0,
      pausedMs: 0,
      pausedAt: null,
      isStopped: false,
    }
    await update($, turnAtom, () => turn)
    await update($, pendingAtom, () => null)

    return next(e)
  })

  on('tool.call', async ($, e, next) => {
    const input = e as unknown as Record<string, unknown>
    if (input.agentId !== undefined && !cfg.countSubagents) return next(e)

    for (;;) {
      // `refresh` writes and returns the live turn. A plain read here can return a value
      // seen earlier in this dispatch, so a call that waited for another call's answer
      // would miss that the person chose Stop and ask again.
      const turn = await refresh($)
      if (turn === null) return next(e)
      if (turn.isStopped) return { deny: STOP_MESSAGE }
      const m = measure(turn, cfg.limits, turn.nowAt)
      if (m.pct < 100) break

      const verdict = await hold($, cfg, input, next.signal, m)
      if (verdict === 'stop') return { deny: STOP_MESSAGE }
    }

    await update($, turnAtom, (t: Turn | null) => (t === null ? null : { ...t, calls: t.calls + 1 }))

    return next(e)
  }).catch(($, e, next) =>
    // A hold that outran its hook budget stays a stop; any other bug must never block a tool.
    holding !== null && next.error?.kind === 'timeout' ? { deny: STOP_MESSAGE } : next(e),
  )

  // Escape or the close mark on the pane is Stop.
  on('ui.close', async ($, e, next) => {
    if (isEscapeStop(e.id, e.origin)) await choose($, 'stop')

    return next(e)
  }).catch(($, e, next) => next(e))

  on('turn.complete', async ($, e, next) => {
    if ((e as { agentId?: string }).agentId !== undefined) return next(e)
    const before = (await read($, turnAtom)) as Turn | null
    if (before !== null) await logTurn($, cfg, e, before)

    return next(e)
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const el = $.ui.resolve(e)
    const p = (await read($, pendingAtom)) as Pending | null
    if (p === null) return <el.Text dimColor>Nothing held.</el.Text>

    return holdBox($, el, cfg, p, false, e.props.bodyColumns)
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const turn = (await read($, turnAtom)) as Turn | null
    const last = (await read($, lastAtom)) as { pct: number; minutes: number; calls: number } | null
    const pending = (await read($, pendingAtom)) as Pending | null
    if (e.props.hasSurvey || (turn === null && last === null)) return next(e)

    const el = $.ui.resolve(e)
    // Other mods share this band (usage-band, skill-badge): keep what they drew and add below it.
    const below = await next(e)
    const own =
      turn === null
        ? lastBurnLine(el, cfg, last as NonNullable<typeof last>, e.props.bodyColumns)
        : fuseLine(el, cfg, turn, e.props.bodyColumns)
    const box = turn !== null && pending !== null && pending.isInline ? holdBox($, el, cfg, pending, true, e.props.bodyColumns) : null

    return <el.Box flexDirection="column">{below}{box}{own}</el.Box>
  })
}
