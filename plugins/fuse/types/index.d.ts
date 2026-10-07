export type Meter = 'calls' | 'minutes' | 'context'

/** Counters of the running turn. Times are `$.clock.now()` milliseconds. */
export type Turn = {
  startedAt: number
  /** The clock when the meters were last refreshed (the bar draws from it). */
  nowAt: number
  /** Context tokens at turn start; lowered when a compaction shrinks the context. */
  baseTokens: number | null
  tokens: number | null
  window: number
  calls: number
  extensions: number
  /** Milliseconds spent with the decision pane open. */
  pausedMs: number
  pausedAt: number | null
  /** The person chose Stop: every later call this turn is refused. */
  isStopped: boolean
}

/** A held call waiting for the person. */
export type Pending = {
  id: string
  tool: string
  command: string
  which: Meter
  /** The meter that hit its limit, as the bar words it: "calls 100/100". */
  meter: string
  /** Extensions still available, and the most allowed, for the "↻ n of m left" note. */
  extLeft: number
  extMax: number
  minutes: number
  calls: number
  growth: number
  canExtend: boolean
  /** The pane could not be placed, so the same box is drawn above the prompt. */
  isInline: boolean
  choice: 'extend' | 'stop' | null
}

export type Last = { pct: number; minutes: number; calls: number }

declare module 'claude-code' {
  interface PluginState {
    fuse: {
      turn: Turn | null
      pending: Pending | null
      last: Last | null
      isReminded: boolean
    }
  }
}
