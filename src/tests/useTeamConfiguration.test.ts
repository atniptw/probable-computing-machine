import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useTeamConfiguration } from '../hooks/useTeamConfiguration'

class MockStorage {
  private store = new Map<string, string>()

  getItem(key: string): string | null {
    return this.store.has(key) ? (this.store.get(key) ?? null) : null
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value)
  }

  removeItem(key: string): void {
    this.store.delete(key)
  }

  clear(): void {
    this.store.clear()
  }
}

const TEAM_KEY = 'pmh_team_v1'

type Params = Parameters<typeof useTeamConfiguration>[0]

function makeParams(overrides: Partial<Params> = {}): Params {
  return {
    defaultTeam: ['pikachu'],
    gameLabel: 'Red/Blue',
    nameIndexReady: true,
    onError: vi.fn(),
    pokemonNameSet: new Set(['pikachu', 'bulbasaur', 'charmander']),
    teamSize: 3,
    ...overrides,
  }
}

describe('useTeamConfiguration', () => {
  let storage: MockStorage

  beforeEach(() => {
    storage = new MockStorage()
    vi.stubGlobal('localStorage', storage)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('initialisation', () => {
    it('reads saved team from localStorage on init', () => {
      storage.setItem(TEAM_KEY, JSON.stringify(['charmander']))
      const { result } = renderHook(() => useTeamConfiguration(makeParams()))
      expect(result.current.teamNames).toEqual(['charmander'])
    })

    it('falls back to defaultTeam when localStorage is empty', () => {
      const { result } = renderHook(() => useTeamConfiguration(makeParams()))
      expect(result.current.teamNames).toEqual(['pikachu'])
    })

    it('falls back to defaultTeam when localStorage contains invalid JSON', () => {
      storage.setItem(TEAM_KEY, 'not-json{')
      const { result } = renderHook(() => useTeamConfiguration(makeParams()))
      expect(result.current.teamNames).toEqual(['pikachu'])
    })

    it('falls back to defaultTeam when localStorage contains a non-array', () => {
      storage.setItem(TEAM_KEY, JSON.stringify({ name: 'pikachu' }))
      const { result } = renderHook(() => useTeamConfiguration(makeParams()))
      expect(result.current.teamNames).toEqual(['pikachu'])
    })

    it('initialises teamDraft as padded slots from saved team', () => {
      storage.setItem(TEAM_KEY, JSON.stringify(['charmander']))
      const { result } = renderHook(() => useTeamConfiguration(makeParams()))
      expect(result.current.teamDraft).toEqual(['charmander', '', ''])
    })
  })

  describe('saveTeam', () => {
    it('calls onError and returns false when nameIndexReady is false', () => {
      const onError = vi.fn()
      const { result } = renderHook(() =>
        useTeamConfiguration(makeParams({ nameIndexReady: false, onError })),
      )
      let saved: boolean | undefined
      act(() => {
        saved = result.current.saveTeam()
      })
      expect(saved).toBe(false)
      expect(onError).toHaveBeenCalledWith(
        'Pokédex index is still loading. Please wait a moment and try again.',
      )
    })

    it('sets slot errors and calls onError when team contains invalid names', () => {
      const onError = vi.fn()
      const { result } = renderHook(() =>
        useTeamConfiguration(makeParams({ defaultTeam: [], onError })),
      )
      act(() => {
        result.current.updateTeamSlot(0, 'missingno')
      })
      act(() => {
        result.current.saveTeam()
      })
      expect(result.current.teamSlotErrors[0]).toBe(
        'Not available in Red/Blue.',
      )
      expect(onError).toHaveBeenCalledWith(
        'Fix invalid team entries before continuing.',
      )
    })

    it('calls onError and returns false when all slots are empty', () => {
      const onError = vi.fn()
      const { result } = renderHook(() =>
        useTeamConfiguration(makeParams({ defaultTeam: [], onError })),
      )
      let saved: boolean | undefined
      act(() => {
        saved = result.current.saveTeam()
      })
      expect(saved).toBe(false)
      expect(onError).toHaveBeenCalledWith(
        'Enter at least one valid Pokémon for your team.',
      )
    })

    it('writes localStorage, updates teamNames, and returns true on success', () => {
      const onError = vi.fn()
      const { result } = renderHook(() =>
        useTeamConfiguration(makeParams({ defaultTeam: [], onError })),
      )
      act(() => {
        result.current.updateTeamSlot(0, 'Pikachu') // normalised to 'pikachu'
      })
      let saved: boolean | undefined
      act(() => {
        saved = result.current.saveTeam()
      })
      expect(saved).toBe(true)
      expect(result.current.teamNames).toEqual(['pikachu'])
      expect(storage.getItem(TEAM_KEY)).toBe(JSON.stringify(['pikachu']))
      expect(onError).toHaveBeenLastCalledWith(null)
    })

    it('strips leading/trailing whitespace and lowercases names on save', () => {
      const { result } = renderHook(() =>
        useTeamConfiguration(makeParams({ defaultTeam: [] })),
      )
      act(() => {
        result.current.updateTeamSlot(0, '  BULBASAUR  ')
      })
      act(() => {
        result.current.saveTeam()
      })
      expect(result.current.teamNames).toEqual(['bulbasaur'])
    })
  })

  describe('updateTeamSlot', () => {
    it('clears the prior error for the updated slot', () => {
      const onError = vi.fn()
      const { result } = renderHook(() =>
        useTeamConfiguration(makeParams({ defaultTeam: [], onError })),
      )
      act(() => {
        result.current.updateTeamSlot(0, 'missingno')
      })
      act(() => {
        result.current.saveTeam()
      })
      expect(result.current.teamSlotErrors[0]).not.toBeNull()

      act(() => {
        result.current.updateTeamSlot(0, 'pikachu')
      })
      expect(result.current.teamSlotErrors[0]).toBeNull()
    })

    it('does not clear errors for other slots', () => {
      const onError = vi.fn()
      const { result } = renderHook(() =>
        useTeamConfiguration(
          makeParams({
            defaultTeam: [],
            onError,
            pokemonNameSet: new Set(['bulbasaur']),
          }),
        ),
      )
      act(() => {
        result.current.updateTeamSlot(0, 'missingno')
        result.current.updateTeamSlot(1, 'also-missing')
      })
      act(() => {
        result.current.saveTeam()
      })
      expect(result.current.teamSlotErrors[0]).not.toBeNull()
      expect(result.current.teamSlotErrors[1]).not.toBeNull()

      act(() => {
        result.current.updateTeamSlot(0, 'bulbasaur')
      })
      expect(result.current.teamSlotErrors[0]).toBeNull()
      expect(result.current.teamSlotErrors[1]).not.toBeNull()
    })
  })

  describe('prepareTeamEditor', () => {
    it('resets teamDraft to current teamNames and clears all slot errors', () => {
      const onError = vi.fn()
      const { result } = renderHook(() =>
        useTeamConfiguration(makeParams({ onError })),
      )
      // Put draft into a dirty state and trigger an error
      act(() => {
        result.current.updateTeamSlot(0, 'missingno')
      })
      act(() => {
        result.current.saveTeam()
      })
      expect(result.current.teamSlotErrors.some(Boolean)).toBe(true)

      act(() => {
        result.current.prepareTeamEditor()
      })
      expect(result.current.teamSlotErrors).toEqual([null, null, null])
      expect(onError).toHaveBeenLastCalledWith(null)
      // Draft should mirror the unchanged teamNames
      expect(result.current.teamDraft).toEqual(['pikachu', '', ''])
    })
  })
})
