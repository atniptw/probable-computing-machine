import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'

import { useMatchupMatrix } from '../hooks/useMatchupMatrix'
import {
  getMoveDetail,
  getPokemon,
  getTypeMap,
  RateLimitError,
} from '../services/pokeapi'
import type { MoveDetail } from '../services/pokeapiClient'
import { makeTeamMember, TEST_STATS } from './testUtils'

vi.mock('../services/pokeapi', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../services/pokeapi')>()
  return {
    ...actual,
    getMoveDetail: vi.fn(),
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
  teamMembers: [makeTeamMember({ name: 'manectric' })],
  teamNames: ['manectric'],
}

function makeParams(
  overrides: Partial<
    typeof BASE_PARAMS & {
      onError: (m: string | null) => void
      opponentMoves: string[]
      opponentLevel: number | null
    }
  > = {},
) {
  return {
    ...BASE_PARAMS,
    onError: vi.fn(),
    ...overrides,
  }
}

function makeMoveDetail(
  name: string,
  type: string,
  basePower: number | null = 90,
): MoveDetail {
  return { name, type, basePower, damageClass: 'special' }
}

describe('useMatchupMatrix', () => {
  beforeEach(() => {
    vi.mocked(getMoveDetail).mockImplementation(async (moveName) =>
      makeMoveDetail(moveName, 'electric'),
    )

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
          stats: TEST_STATS,
        }
      }

      return {
        name: 'manectric',
        types: ['electric'],
        sprite: null,
        stats: TEST_STATS,
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
    vi.mocked(getMoveDetail).mockImplementation(async (moveName) => {
      if (moveName === 'ice beam') return makeMoveDetail(moveName, 'ice')
      if (moveName === 'thunderbolt')
        return makeMoveDetail(moveName, 'electric')
      return makeMoveDetail(moveName, 'normal')
    })

    const onError = vi.fn()
    const params = makeParams({
      onError,
      teamMembers: [
        makeTeamMember({
          name: 'manectric',
          moves: ['ice beam', 'thunderbolt'],
        }),
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
      teamMembers: [makeTeamMember({ name: 'charizard' })],
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

  it('uses opponentMoves for defense when provided (gym mode)', async () => {
    vi.mocked(getMoveDetail).mockImplementation(async (moveName) => {
      if (moveName === 'rock-throw') return makeMoveDetail(moveName, 'rock')
      if (moveName === 'tackle') return makeMoveDetail(moveName, 'normal')
      return makeMoveDetail(moveName, 'normal')
    })

    const onError = vi.fn()
    const params = makeParams({
      onError,
      // Gyarados opponent, but give it rock-type gym moves instead of water/flying
      opponentMoves: ['rock-throw', 'tackle'],
    })

    const { result } = renderHook(() => useMatchupMatrix(params))

    await waitFor(() => expect(result.current.matchup).not.toBe(null))

    // Defense should reflect the provided moves, not type-inferred Gyarados moves
    const allDefenseNames = [
      ...result.current.matchup!.defense.dangerous,
      ...result.current.matchup!.defense.neutral,
      ...result.current.matchup!.defense.resisted,
    ].map((m) => m.name)

    expect(allDefenseNames).toContain('Rock Throw')
    expect(allDefenseNames).toContain('Tackle')
    // Type-inferred moves like Surf/Hydro Pump should NOT appear
    expect(allDefenseNames).not.toContain('Surf')
    expect(allDefenseNames).not.toContain('Hydro Pump')
  })

  it('falls back to type inference when opponentMoves is empty (free battle)', async () => {
    const onError = vi.fn()
    const params = makeParams({ onError, opponentMoves: [] })

    const { result } = renderHook(() => useMatchupMatrix(params))

    await waitFor(() => expect(result.current.matchup).not.toBe(null))

    // Gyarados is water/flying — type inference should include water and flying moves
    const allDefenseNames = [
      ...result.current.matchup!.defense.dangerous,
      ...result.current.matchup!.defense.neutral,
      ...result.current.matchup!.defense.resisted,
    ].map((m) => m.name)

    expect(allDefenseNames.length).toBeGreaterThan(0)
    // Earthquake is in COMMON_COVERAGE_THREATS and should appear
    expect(allDefenseNames).toContain('Earthquake')
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

  describe('damage calc fields', () => {
    it('damageCalcAvailable is false when the attacker has no level', async () => {
      const params = makeParams({
        teamMembers: [
          makeTeamMember({ name: 'manectric', moves: ['thunderbolt'] }),
        ],
        opponentLevel: 50,
      })
      const { result } = renderHook(() => useMatchupMatrix(params))
      await waitFor(() => expect(result.current.matchup).not.toBe(null))

      expect(result.current.matchup!.attackerLevel).toBeNull()
      expect(result.current.matchup!.damageCalcAvailable).toBe(false)
    })

    it('damageCalcAvailable is false when the opponent has no level', async () => {
      const params = makeParams({
        teamMembers: [
          makeTeamMember({
            name: 'manectric',
            level: 50,
            moves: ['thunderbolt'],
          }),
        ],
      })
      const { result } = renderHook(() => useMatchupMatrix(params))
      await waitFor(() => expect(result.current.matchup).not.toBe(null))

      expect(result.current.matchup!.defenderLevel).toBeNull()
      expect(result.current.matchup!.damageCalcAvailable).toBe(false)
    })

    it('is available and ranks moves with damage ranges when both levels are set', async () => {
      const params = makeParams({
        teamMembers: [
          makeTeamMember({
            name: 'manectric',
            level: 50,
            moves: ['thunderbolt', 'ice beam'],
          }),
        ],
        opponentLevel: 50,
      })
      const { result } = renderHook(() => useMatchupMatrix(params))
      await waitFor(() => expect(result.current.matchup).not.toBe(null))

      const matchup = result.current.matchup!
      expect(matchup.attackerLevel).toBe(50)
      expect(matchup.defenderLevel).toBe(50)
      expect(matchup.damageCalcAvailable).toBe(true)
      expect(matchup.moveRecommendations).toHaveLength(2)
      expect(matchup.moveRecommendations[0].damageRange).not.toBeNull()
    })

    it('moveRecommendations have null damage ranges when a level is missing', async () => {
      const params = makeParams({
        teamMembers: [
          makeTeamMember({ name: 'manectric', moves: ['thunderbolt'] }),
        ],
        opponentLevel: 50,
      })
      const { result } = renderHook(() => useMatchupMatrix(params))
      await waitFor(() => expect(result.current.matchup).not.toBe(null))

      const matchup = result.current.matchup!
      expect(matchup.moveRecommendations).toHaveLength(1)
      expect(matchup.moveRecommendations[0].damageRange).toBeNull()
    })
  })
})
