import { renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useTeamPreview } from '../hooks/useTeamPreview'
import type { Pokemon } from '../services/pokeapi'

vi.mock('../services/pokeapi', () => ({
  getPokemon: vi.fn(),
}))

import { getPokemon } from '../services/pokeapi'
const mockGetPokemon = vi.mocked(getPokemon)

function makePokemon(name: string): Pokemon {
  return { name, types: ['water'], sprite: null }
}

describe('useTeamPreview', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns empty teamPreview when teamNames is empty', async () => {
    const { result } = renderHook(
      ({ names }) => useTeamPreview({ generation: 3, teamNames: names }),
      { initialProps: { names: [] as string[] } },
    )

    expect(result.current.teamPreview).toEqual([])
  })

  it('loads pokemon for each team member', async () => {
    mockGetPokemon.mockImplementation(async (name) => makePokemon(name))

    const { result } = renderHook(
      ({ names }) => useTeamPreview({ generation: 3, teamNames: names }),
      { initialProps: { names: ['swampert', 'gardevoir'] } },
    )

    await waitFor(() => {
      expect(result.current.teamPreview).toHaveLength(2)
    })

    expect(result.current.teamPreview[0].name).toBe('swampert')
    expect(result.current.teamPreview[1].name).toBe('gardevoir')
  })

  it('omits failed fetches and returns only successful results', async () => {
    mockGetPokemon.mockImplementation(async (name) => {
      if (name === 'invalid') return Promise.reject(new Error('not found'))
      return makePokemon(name)
    })

    const { result } = renderHook(
      ({ names }) => useTeamPreview({ generation: 3, teamNames: names }),
      { initialProps: { names: ['swampert', 'invalid', 'gardevoir'] } },
    )

    await waitFor(() => {
      expect(result.current.teamPreview).toHaveLength(2)
    })

    const names = result.current.teamPreview.map((p) => p.name)
    expect(names).toContain('swampert')
    expect(names).toContain('gardevoir')
    expect(names).not.toContain('invalid')
  })

  it('reloads when teamNames changes', async () => {
    mockGetPokemon.mockImplementation(async (name) => makePokemon(name))

    const { result, rerender } = renderHook(
      ({ names }) => useTeamPreview({ generation: 3, teamNames: names }),
      { initialProps: { names: ['swampert'] } },
    )

    await waitFor(() => {
      expect(result.current.teamPreview).toHaveLength(1)
    })

    rerender({ names: ['swampert', 'gardevoir'] })

    await waitFor(() => {
      expect(result.current.teamPreview).toHaveLength(2)
    })
  })

  it('clears preview when switching to empty team', async () => {
    mockGetPokemon.mockImplementation(async (name) => makePokemon(name))

    const { result, rerender } = renderHook(
      ({ names }) => useTeamPreview({ generation: 3, teamNames: names }),
      { initialProps: { names: ['swampert'] } },
    )

    await waitFor(() => {
      expect(result.current.teamPreview).toHaveLength(1)
    })

    rerender({ names: [] })

    await waitFor(() => {
      expect(result.current.teamPreview).toHaveLength(0)
    })
  })
})
