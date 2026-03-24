import { describe, expect, it } from 'vitest'

import {
  DEFAULT_GAME_VERSION,
  SUPPORTED_GAMES,
  getGameDefinition,
} from '../data/games'

describe('games metadata', () => {
  it('includes the default game in the supported list', () => {
    expect(
      SUPPORTED_GAMES.some((game) => game.version === DEFAULT_GAME_VERSION),
    ).toBe(true)
  })

  it('returns the matching game definition when present', () => {
    expect(getGameDefinition('emerald')).toEqual({
      version: 'emerald',
      label: 'Pokémon Emerald',
      generation: 3,
    })
  })

  it('returns null for unsupported games', () => {
    expect(getGameDefinition('yellow')).toBeNull()
  })
})
