import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'

import { useMatchupMatrix } from '../hooks/useMatchupMatrix'
import type { TeamMemberConfig } from '../hooks/useTeamConfiguration'
import {
  getMoveType,
  getPokemon,
  getTypeMap,
  RateLimitError,
} from '../services/pokeapi'

vi.mock('../services/pokeapi', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../services/pokeapi')>()
  return {
    ...actual,
    getMoveType: vi.fn(),
    getPokemon: vi.fn(),
    getTypeMap: vi.fn(),
  }
})

const BASE_PARAMS = {
  exactMatchFound: true,
  gameLabel: 'Emerald',
  generation: 3,
  nameIndexReady: true,
  normalizedOpponent: 'gyarados',
  pokemonNameSet: new Set(['manectric']),
  selectedTeamIndex: 0,
  teamMembers: [{ name: 'manectric', moves: [] }] as TeamMemberConfig[],
  teamNames: ['manectric'],
}

function makeParams(
  overrides: Partial<
    typeof BASE_PARAMS & { onError: (m: string | null) => void }
  > = {},
) {
  return {
    ...BASE_PARAMS,
    onError: vi.fn(),
    ...overrides,
  }
}

describe('useMatchupMatrix', () => {
  beforeEach(() => {
    vi.mocked(getMoveType).mockResolvedValue('electric')

    vi.mocked(getTypeMap).mockResolvedValue(
      new Map([
        [
          'electric',
          {
            doubleDamageTo: ['water', 'flying'],
            halfDamageTo: ['electric', 'grass'],
            noDamageTo: ['ground'],
          },
        ],
        [
          'normal',
          {
            doubleDamageTo: [],
            halfDamageTo: ['rock', 'steel'],
            noDamageTo: ['ghost'],
          },
        ],
        [
          'water',
          {
            doubleDamageTo: ['fire', 'ground', 'rock'],
            halfDamageTo: ['water', 'grass'],
            noDamageTo: [],
          },
        ],
        [
          'flying',
          {
            doubleDamageTo: ['grass', 'fighting', 'bug'],
            halfDamageTo: ['electric', 'rock', 'steel'],
            noDamageTo: [],
          },
        ],
        [
          'ground',
          {
            doubleDamageTo: ['fire', 'electric', 'poison', 'rock', 'steel'],
            halfDamageTo: ['grass', 'bug'],
            noDamageTo: ['flying'],
          },
        ],
        [
          'ice',
          {
            doubleDamageTo: ['grass', 'ground', 'flying', 'dragon'],
            halfDamageTo: ['fire', 'water', 'ice', 'steel'],
            noDamageTo: [],
          },
        ],
      ]),
    )

    vi.mocked(getPokemon).mockImplementation(async (name) => {
      if (name === 'gyarados') {
        return {
          name: 'gyarados',
          types: ['water', 'flying'],
          sprite: null,
        }
      }

      return {
        name: 'manectric',
        types: ['electric'],
        sprite: null,
      }
    })
  })

  it('returns null matchup until an opponent is present', () => {
    const onError = vi.fn()
    const params = makeParams({ normalizedOpponent: '', onError })

    const { result } = renderHook(() => useMatchupMatrix(params))

    expect(result.current.loading).toBe(false)
    expect(result.current.matchup).toBe(null)
  })

  it('builds offense and defense groups from live type data', async () => {
    const onError = vi.fn()
    const params = makeParams({ onError })

    const { result } = renderHook(() => useMatchupMatrix(params))

    await waitFor(() => expect(result.current.matchup).not.toBe(null))

    const matchup = result.current.matchup!

    expect(matchup.player.name).toBe('manectric')
    expect(matchup.opponent.name).toBe('gyarados')

    const superMoveNames = matchup.offense.superEffective.map(
      (move) => move.name,
    )
    expect(superMoveNames).toContain('Thunderbolt')
    expect(superMoveNames).toContain('Spark')

    const dangerousNames = matchup.defense.dangerous.map((move) => move.name)
    expect(dangerousNames).toContain('Earthquake')

    expect(matchup.summary.offenseRating).toBeGreaterThanOrEqual(3)
    expect(matchup.summary.defenseRating).toBeGreaterThanOrEqual(1)
  })

  it('uses configured team moves when provided', async () => {
    vi.mocked(getMoveType).mockImplementation(async (moveName) => {
      if (moveName === 'ice beam') return 'ice'
      if (moveName === 'thunderbolt') return 'electric'
      return 'normal'
    })

    const onError = vi.fn()
    const params = makeParams({
      onError,
      teamMembers: [
        {
          name: 'manectric',
          moves: ['ice beam', 'thunderbolt'],
        },
      ],
    })

    const { result } = renderHook(() => useMatchupMatrix(params))

    await waitFor(() => expect(result.current.matchup).not.toBe(null))

    const superMoveNames = result.current.matchup!.offense.superEffective.map(
      (move) => move.name,
    )
    expect(superMoveNames).toContain('Thunderbolt')

    const neutralMoveNames = result.current.matchup!.offense.neutral.map(
      (move) => move.name,
    )
    expect(neutralMoveNames).toContain('Ice Beam')
  })

  it('reports validation error when saved team contains out-of-dex pokemon', async () => {
    const onError = vi.fn()
    const params = makeParams({
      onError,
      teamMembers: [{ name: 'charizard', moves: [] }],
      teamNames: ['charizard'],
      pokemonNameSet: new Set(['manectric']),
    })

    renderHook(() => useMatchupMatrix(params))

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith(
        'Your saved team has Pokemon outside the Emerald Pokedex. Tap Edit Team to fix it.',
      )
    })
  })

  it('surfaces rate-limit errors', async () => {
    const onError = vi.fn()
    vi.mocked(getPokemon).mockRejectedValue(new RateLimitError())
    const params = makeParams({ onError })

    renderHook(() => useMatchupMatrix(params))

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith(
        'Rate limit reached. Please wait a moment and try again.',
      )
    })
  })
})
