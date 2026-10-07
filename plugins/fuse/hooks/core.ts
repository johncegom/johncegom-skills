import type { Meter, Turn } from '../types'

export type Limits = { minutes: number; calls: number; context: number; maxExtensions: number }
export type Palette = {
  lit: string
  burning: string
  short: string
  hissing: string
  held: string
  ash: string
  rope: string
  ember: string
  bomb: string
}
export type Stage = 'Lit' | 'Burning' | 'Short' | 'Hissing' | 'HELD'
export type Symbols = { ash: string; rope: string; bomb: string; held: string; spark: Record<Stage, string> }
export type Meters = {
  minutes: number
  calls: number
  growth: number
  ratios: Record<Meter, number>
  pct: number
  nearest: Meter
  limits: { minutes: number; calls: number; context: number }
}

export const DARK: Palette = {
  lit: '#4ADE80',
  burning: '#FACC15',
  short: '#FB923C',
  hissing: '#EF4444',
  held: '#FF3B3B',
  ash: '#6B7280',
  rope: '#C8A165',
  ember: '#FF7A1A',
  bomb: '#9AA0A6',
}
export const LIGHT: Palette = {
  lit: '#16A34A',
  burning: '#CA8A04',
  short: '#EA580C',
  hissing: '#DC2626',
  held: '#B91C1C',
  ash: '#9CA3AF',
  rope: '#8B6B3A',
  ember: '#C2410C',
  bomb: '#4B5563',
}

export const STOP_MESSAGE =
  'The user stopped this turn. List what you changed and what is left. Do not edit more.'

const PLAIN: Symbols = {
  ash: '·',
  rope: '~',
  bomb: '◉',
  held: '✹',
  spark: { Lit: '✦', Burning: '✦', Short: '✧', Hissing: '✸', HELD: '✹' },
}
const ASCII: Symbols = {
  ash: '.',
  rope: '~',
  bomb: 'O',
  held: '*',
  spark: { Lit: '*', Burning: '*', Short: '*', Hissing: '*', HELD: '*' },
}

export function symbolsFor(options: { ascii?: boolean; emoji?: boolean }): Symbols {
  if (options.ascii) return ASCII
  if (options.emoji) return { ...PLAIN, bomb: '💣', held: '💥', spark: { ...PLAIN.spark, HELD: '💥' } }
  return PLAIN
}

/** Each limit grows by half of its base per extension: 45 → 67.5 → 90. */
export function scaledLimits(limits: Limits, extensions: number) {
  const factor = 1 + 0.5 * extensions
  return { minutes: limits.minutes * factor, calls: limits.calls * factor, context: limits.context * factor }
}

export function elapsedMs(turn: Turn, now: number) {
  const openFor = turn.pausedAt === null ? 0 : Math.max(0, now - turn.pausedAt)
  return Math.max(0, now - turn.startedAt - turn.pausedMs - openFor)
}

/** Growth since the turn began, as a percent of the window; never negative. */
export function growthPercent(turn: Turn) {
  if (turn.tokens === null || turn.baseTokens === null || turn.window <= 0) return 0
  return Math.max(0, ((turn.tokens - turn.baseTokens) / turn.window) * 100)
}

/** A compaction that shrinks the context moves the baseline down with it. */
export function withTokens(turn: Turn, tokens: number | null, window: number): Turn {
  if (tokens === null) return { ...turn, window: window || turn.window }
  const base = turn.baseTokens === null ? tokens : Math.min(turn.baseTokens, tokens)
  return { ...turn, tokens, baseTokens: base, window: window || turn.window }
}

export function measure(turn: Turn, limits: Limits, now: number): Meters {
  const lim = scaledLimits(limits, turn.extensions)
  const minutes = elapsedMs(turn, now) / 60_000
  const growth = growthPercent(turn)
  const ratios: Record<Meter, number> = {
    calls: turn.calls / lim.calls,
    minutes: minutes / lim.minutes,
    context: growth / lim.context,
  }
  const order: Meter[] = ['calls', 'minutes', 'context']
  const nearest = order.reduce((best, m) => (ratios[m] > ratios[best] ? m : best), 'calls' as Meter)
  return { minutes, calls: turn.calls, growth, ratios, pct: ratios[nearest] * 100, nearest, limits: lim }
}

/** floor that survives float error (58000/200000*100 is 28.999999999999996). */
export const whole = (n: number) => Math.floor(n + 1e-9)

export function stageOf(pct: number): Stage {
  pct += 1e-9
  if (pct >= 100) return 'HELD'
  if (pct >= 85) return 'Hissing'
  if (pct >= 60) return 'Short'
  if (pct >= 30) return 'Burning'
  return 'Lit'
}

export function stageColor(stage: Stage, p: Palette) {
  return { Lit: p.lit, Burning: p.burning, Short: p.short, Hissing: p.hissing, HELD: p.held }[stage]
}

export type BarPart = { text: string; color: 'ash' | 'spark' | 'ember' | 'rope' | 'bomb' }

/** The bar as coloured runs, `width` cells wide: ash, spark, rope (2 ember cells first), bomb. */
export function barParts(pct: number, width: number, sym: Symbols): BarPart[] {
  const stage = stageOf(pct)
  const room = width - 2
  if (stage === 'HELD') {
    return [
      { text: sym.ash.repeat(width - 2), color: 'ash' },
      { text: sym.held, color: 'spark' },
      { text: ' ', color: 'rope' },
    ]
  }
  const ash = Math.min(room, Math.max(0, Math.round((pct / 100) * room)))
  const rope = room - ash
  const ember = Math.min(2, rope)
  const parts: BarPart[] = []
  if (ash > 0) parts.push({ text: sym.ash.repeat(ash), color: 'ash' })
  parts.push({ text: sym.spark[stage], color: 'spark' })
  if (ember > 0) parts.push({ text: sym.rope.repeat(ember), color: 'ember' })
  if (rope - ember > 0) parts.push({ text: sym.rope.repeat(rope - ember), color: 'rope' })
  parts.push({ text: sym.bomb, color: 'bomb' })
  return parts
}

export const barText = (parts: BarPart[]) => parts.map(p => p.text).join('')

const trim = (n: number) => String(Number(n.toFixed(1)))

/** The meter text: "calls 91/100", "20 of 45 min", "context 29% of 40%". */
export function meterText(m: Meters) {
  if (m.nearest === 'calls') return `calls ${m.calls}/${trim(m.limits.calls)}`
  if (m.nearest === 'minutes') return `${whole(m.minutes)} of ${trim(m.limits.minutes)} min`
  return `context ${whole(m.growth)}% of ${trim(m.limits.context)}%`
}

export const WHICH_LABEL: Record<Meter, string> = {
  calls: 'tool calls',
  minutes: 'minutes',
  context: 'context growth',
}

export type Layout = { kind: 'full' | 'short' | 'tiny'; width: number }
export function layoutFor(bodyColumns: number): Layout {
  if (bodyColumns >= 60) return { kind: 'full', width: 16 }
  if (bodyColumns >= 40) return { kind: 'short', width: 8 }
  return { kind: 'tiny', width: 0 }
}

/** The tool and a short form of what it was about to do. */
export function shortCommand(input: Record<string, unknown>) {
  for (const key of ['command', 'file_path', 'path', 'pattern', 'url', 'query', 'description', 'prompt']) {
    const v = input[key]
    if (typeof v === 'string' && v.trim() !== '') {
      const line = v.trim().split('\n')[0] as string
      return line.length > 60 ? `${line.slice(0, 57)}...` : line
    }
  }
  return ''
}

export function statsLine(fields: {
  at: number
  turnId: string
  minutes: number
  calls: number
  growth: number
  pct: number
  extensions: number
  isAborted: boolean
}) {
  const r = (n: number) => Number(n.toFixed(2))
  return JSON.stringify({
    at: new Date(fields.at).toISOString(),
    turnId: fields.turnId,
    minutes: r(fields.minutes),
    calls: fields.calls,
    growth: r(fields.growth),
    pct: whole(fields.pct),
    extensions: fields.extensions,
    aborted: fields.isAborted,
  })
}

export const HOLD_PANE = 'fuse-hold'

/** Esc on the focused pane (closeOnEscape) or its close mark is the person's Stop. */
export const isEscapeStop = (id: string, origin: { kind: string }) => id === HOLD_PANE && origin.kind === 'person'
