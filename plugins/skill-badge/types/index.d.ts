/** A skill the engine loaded this session. `stale` once a compaction ran after it loaded. */
export type LoadedSkill = { name: string; turn: number; stale: boolean }

declare module 'claude-code' {
  interface PluginState {
    'skill-badge': { loaded: LoadedSkill[]; fresh: string[]; turn: number }
  }
}
