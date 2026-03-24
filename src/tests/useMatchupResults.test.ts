import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useMatchupResults } from '../hooks/useMatchupResults'
import {
  getPokemon,
  getTypeMap,
  PokemonNotFoundError,
  RateLimitError,
} from '../services/pokeapi'

// Keep real error classes so instanceof checks inside the hook work correctly.
vi.mock('../services/pokeapi', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../services/pokeapi')>()
  return {
    ...actual,
    getPokemon: vi.fn(),
    getTypeMap: vi.fn(),
  }
})

vi.mock('../services/ranking', () => ({
  rankTeamAgainstOpponent: vi.fn(() => ({
    best: [],
    good: [],
    neutral: [],
    risky: [],
  })),
}))

// Stable module-level fixtures.  Passing new Set()/[] inside the renderHook
// callback on every render changes dependency references and causes the hook's
// useEffect to re-run and resetResults() to loop indefinitely.
const DEFAULT_POKEMON_NAME_SET = new Set(['bulbasaur', 'pikachu'])
const DEFAULT_TEAM_NAMES = ['bulbasaur']

interface MatchupParams {
  exactMatchFound: boolean
  gameLabel: string
  generation: number
  nameIndexReady: boolean
  normalizedOpponent: string
  pokemonNameSet: Set<string>
  screen: 'battle' | 'team'
  teamNames: string[]
}

const VALID_PARAMS: MatchupParams = {
  exactMatchFound: true,
  gameLabel: 'Red/Blue',
  generation: 1,
  nameIndexReady: true,
  normalizedOpponent: 'pikachu',
  pokemonNameSet: DEFAULT_POKEMON_NAME_SET,
  screen: 'battle',
  teamNames: DEFAULT_TEAM_NAMES,
}

type HookParams = MatchupParams & { onError: (m: string | null) => void }

function makeParams(overrides: Partial<HookParams> = {}) {
  return { ...VALID_PARAMS, onError: vi.fn(), ...overrides }
}

describe('useMatchupResults', () => {
  beforeEach(() => {
    vi.mocked(getTypeMap).mockResolvedValue(new Map())
    vi.mocked(getPokemon).mockResolvedValue({
      name: 'dummy',
      types: ['normal'],
      sprite: null,
    })
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('team invalidation effect', () => {
    it('fires an error when a team member is not in pokemonNameSet', async () => {
      const onError = vi.fn()
      // Create stable references outside the render callback.  New objects
      // inside the callback look like dependency changes on every re-render.
      const pokemonNameSet = new Set(['pikachu']) // 'bulbasaur' is absent
      const teamNames = ['bulbasaur']

      renderHook(() =>
        useMatchupResults(
          makeParams({
            screen: 'team', // prevent fetch effect from running
            pokemonNameSet,
            teamNames,
            onError,
          }),
        ),
      )
      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(
          'Your saved team has Pokémon outside the Red/Blue Pokédex. Tap Edit Team to fix it.',
        )
      })
    })

    it('does not fire a validation error when all team members are valid', async () => {
      const onError = vi.fn()
      const pokemonNameSet = new Set(['bulbasaur'])
      const teamNames = ['bulbasaur']

      renderHook(() =>
        useMatchupResults(
          makeParams({
            screen: 'team',
            pokemonNameSet,
            teamNames,
            onError,
          }),
        ),
      )
      await new Promise<void>((r) => setTimeout(r, 20))
      const validationCalls = onError.mock.calls.filter(
        ([msg]) => typeof msg === 'string' && msg.includes('Pokédex'),
      )
      expect(validationCalls).toHaveLength(0)
    })
  })

  describe('matchup reset conditions', () => {
    it('resets results and clears error when normalizedOpponent is empty', async () => {
      const onError = vi.fn()
      renderHook(() =>
        useMatchupResults(
          makeParams({
            screen: 'battle',
            normalizedOpponent: '',
            exactMatchFound: false,
            onError,
          }),
        ),
      )
      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(null)
      })
      expect(getPokemon).not.toHaveBeenCalled()
    })

    it('resets without fetching when exactMatchFound is false', async () => {
      const onError = vi.fn()
      renderHook(() =>
        useMatchupResults(
          makeParams({
            screen: 'battle',
            normalizedOpponent: 'unknownmon',
            exactMatchFound: false,
            onError,
          }),
        ),
      )
      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(null)
      })
      expect(getPokemon).not.toHaveBeenCalled()
    })

    it('sets loading=false when screen changes from battle to team', async () => {
      // Never-resolving fetch keeps loading=true while on the battle screen
      vi.mocked(getPokemon).mockImplementation(() => new Promise(() => {}))

      const params = makeParams()
      const { result, rerender } = renderHook(
        (p: ReturnType<typeof makeParams>) => useMatchupResults(p),
        { initialProps: params },
      )

      await waitFor(() => expect(result.current.loading).toBe(true))

      rerender({ ...params, screen: 'team' })

      await waitFor(() => expect(result.current.loading).toBe(false))
    })
  })

  describe('API error handling', () => {
    it('calls onError with "not found" message for PokemonNotFoundError', async () => {
      const onError = vi.fn()
      vi.mocked(getPokemon).mockRejectedValue(
        new PokemonNotFoundError('pikachu'),
      )
      renderHook(() => useMatchupResults(makeParams({ onError })))
      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(
          'Pokémon not found. Please select a valid name.',
        )
      })
    })

    it('calls onError with "rate limit" message for RateLimitError', async () => {
      const onError = vi.fn()
      vi.mocked(getPokemon).mockRejectedValue(new RateLimitError())
      renderHook(() => useMatchupResults(makeParams({ onError })))
      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(
          'Rate limit reached. Please wait a moment and try again.',
        )
      })
    })

    it('calls onError with network message for unrecognised errors', async () => {
      const onError = vi.fn()
      vi.mocked(getPokemon).mockRejectedValue(new Error('connection refused'))
      renderHook(() => useMatchupResults(makeParams({ onError })))
      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(
          'Network error. Please check your connection and try again.',
        )
      })
    })
  })
})
