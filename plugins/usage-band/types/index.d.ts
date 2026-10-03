export type Limit = { kind: string; percentUsed: number; resetsAt?: string }

export type Reading = {
  /** Context window fill; `percent` is absent before the first reply. */
  context: { tokens?: number; window: number; percent?: number }
  /** Rate-limit windows; empty off a subscription. */
  limits: Limit[]
  /** Session cost in US dollars; absent where the host keeps no ledger. */
  costUsd?: number
}

declare module 'claude-code' {
  interface PluginState {
    'usage-band': { reading: Reading | null }
  }
}
