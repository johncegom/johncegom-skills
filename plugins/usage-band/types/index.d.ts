export type Limit = { kind: string; percentUsed: number; resetsAt?: string }

export type Reading = {
  /** Context window fill; `percent` is absent before the first reply. */
  context: { tokens?: number; window: number; percent?: number }
  /** Rate-limit windows; empty off a subscription. */
  limits: Limit[]
  /** Session cost in US dollars; absent where the host keeps no ledger. */
  costUsd?: number
}

/**
 * What the dancer is doing, and its beat (timer ticks since the stage began).
 * `work` runs while a turn does; after it `cheer` (1 min), `doze` (4 min), then
 * `sleep`, which has no timer. `off` draws nothing.
 */
export type Dance = { stage: 'off' | 'work' | 'cheer' | 'doze' | 'sleep'; tick: number }

declare module 'claude-code' {
  interface PluginState {
    'usage-band': { reading: Reading | null; dance: Dance }
  }
}
