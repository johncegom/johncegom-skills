import { atom, read, update } from 'claude-code'
import type { Register } from 'claude-code'

import type { LoadedSkill } from '../types'

const loaded = atom({ plugin: 'skill-badge', key: 'loaded' } as const, [] as LoadedSkill[])
const fresh = atom({ plugin: 'skill-badge', key: 'fresh' } as const, [] as string[])
const turnNo = atom({ plugin: 'skill-badge', key: 'turn' } as const, 0)

export const register: Register = on => {
  // A new prompt starts a new turn: nothing is "new this turn" until a skill loads.
  on('prompt.submit', async ($, e, next) => {
    await update($, turnNo, n => n + 1)
    await update($, fresh, () => [])

    return next(e)
  })

  // Fires for the Skill tool, a typed /name and a subagent preload alike.
  on('skill.prompt', async ($, e, next) => {
    const turn = await read($, turnNo)

    await update($, loaded, list => {
      const rest = list.filter(s => s.name !== e.skill)
      const first = list.find(s => s.name === e.skill)

      return [...rest, { name: e.skill, turn: first === undefined ? turn : first.turn, stale: false }]
    })
    await update($, fresh, list => (list.includes(e.skill) ? list : [...list, e.skill]))

    return next(e)
  })

  // The summary may have dropped the skill's text, so mark what loaded before it.
  on('session.compact', async ($, e, next) => {
    const result = await next(e)

    // Only a real compaction of the main conversation counts, not a skip or a precompute.
    if (e.agentId === undefined && e.trigger !== 'precompute' && result.messages !== undefined) {
      await update($, loaded, list => list.map(s => ({ ...s, stale: true })))
    }

    return result
  })

  // /clear starts a fresh conversation with no session.start, so reset here.
  on('session.end', async ($, e, next) => {
    await update($, loaded, () => [])
    await update($, fresh, () => [])
    await update($, turnNo, () => 0)

    return next(e)
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const list = await read($, loaded)

    if (e.props.hasSurvey || list.length === 0) {
      return next(e)
    }

    const newNow = await read($, fresh)
    const { Box, Text } = $.ui.resolve(e)
    const names = list.map(s => `${s.name}${s.stale ? '?' : ''}`).join(', ')
    const hasStale = list.some(s => s.stale)

    return (
      <Box>
        <Text dimColor>
          Skills loaded: {names}
          {newNow.length > 0 ? ` · new this turn: ${newNow.join(', ')}` : ''}
          {hasStale ? ' · ? = loaded before a compact, may be dropped' : ''}
        </Text>
      </Box>
    )
  })
}
