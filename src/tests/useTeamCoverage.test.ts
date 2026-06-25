import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'

import { useTeamCoverage } from '../hooks/useTeamCoverage'
import { getMoveDetail, getPokemon } from '../services/pokeapi'
import type {
  MoveDetail,
  Pokemon,
  TypeRelations,
} from '../services/pokeapiClient'

vi.mock('../services/pokeapi', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../services/pokeapi')>()
  return { ...actual, getPokemon: vi.fn(), getMoveDetail: vi.fn() }
})

function rel(
  doubleDamageTo: string[] = [],
  halfDamageTo: string[] = [],
  noDamageTo: string[] = [],
): TypeRelations {
  return { doubleDamageTo, halfDamageTo, noDamageTo }
}

function makeTypeMap(): Map<string, TypeRelations> {
  return new Map([
    ['grass', rel(['water', 'ground', 'rock'])],
    ['water', rel()],
    ['ground', rel()],
    ['rock', rel()],
  ])
}

function makePokemon(types: string[]): Pokemon {
  return {
    name: 'mon',
    types,
    sprite: null,
    stats: {
      hp: 0,
      attack: 0,
      defense: 0,
      specialAttack: 0,
      specialDefense: 0,
      speed: 0,
    },
  }
}

function makeMoveDetail(type: string): MoveDetail {
  return { name: 'move', type, basePower: 50, damageClass: 'physical' }
}

type Params = Parameters<typeof useTeamCoverage>[0]

function makeParams(overrides: Partial<Params> = {}): Params {
  return {
    teamMembers: [{ name: 'venusaur', moves: ['razor-leaf'] }],
    generation: 9,
    typeMap: makeTypeMap(),
    onError: vi.fn(),
    ...overrides,
  }
}

describe('useTeamCoverage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('does not run until the type map is ready', () => {
    const params = makeParams({ typeMap: null })
    const { result } = renderHook(() => useTeamCoverage(params))
    expect(result.current.coverage).toBeNull()
    expect(getPokemon).not.toHaveBeenCalled()
  })

  it('does not run when no member has a name', () => {
    const params = makeParams({ teamMembers: [{ name: '', moves: [] }] })
    const { result } = renderHook(() => useTeamCoverage(params))
    expect(result.current.coverage).toBeNull()
    expect(getPokemon).not.toHaveBeenCalled()
  })

  it('returns null coverage while loading', async () => {
    vi.mocked(getPokemon).mockReturnValue(new Promise<Pokemon>(() => {}))
    vi.mocked(getMoveDetail).mockResolvedValue(makeMoveDetail('grass'))
    const params = makeParams()
    const { result } = renderHook(() => useTeamCoverage(params))
    await waitFor(() => expect(result.current.loading).toBe(true))
    expect(result.current.coverage).toBeNull()
  })

  it('resolves offensive coverage once the data loads', async () => {
    vi.mocked(getPokemon).mockResolvedValue(makePokemon(['grass']))
    vi.mocked(getMoveDetail).mockResolvedValue(makeMoveDetail('grass'))
    const params = makeParams()
    const { result } = renderHook(() => useTeamCoverage(params))
    await waitFor(() => expect(result.current.coverage).not.toBeNull())
    expect(result.current.coverage?.offensiveCoverage).toEqual([
      'ground',
      'rock',
      'water',
    ])
    expect(result.current.loading).toBe(false)
  })

  it('fetches each named member exactly once', async () => {
    vi.mocked(getPokemon).mockResolvedValue(makePokemon(['grass']))
    vi.mocked(getMoveDetail).mockResolvedValue(makeMoveDetail('grass'))
    const params = makeParams({
      teamMembers: [
        { name: 'venusaur', moves: ['razor-leaf'] },
        { name: 'sceptile', moves: ['leaf-blade'] },
      ],
    })
    const { result } = renderHook(() => useTeamCoverage(params))
    await waitFor(() => expect(result.current.coverage).not.toBeNull())
    expect(getPokemon).toHaveBeenCalledTimes(2)
  })
})
