import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { usePokemonNameIndex } from '../hooks/usePokemonNameIndex'
import { getPokemonNameIndex, getTypeMap } from '../services/pokeapi'

vi.mock('../services/pokeapi', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../services/pokeapi')>()
  return {
    ...actual,
    getPokemonNameIndex: vi.fn(),
    getTypeMap: vi.fn(),
  }
})

type Params = Parameters<typeof usePokemonNameIndex>[0]

// IMPORTANT: never call makeParams() inside the renderHook callback.
// onError is a useEffect dependency; a new vi.fn() on every render causes
// the effect to fire in an infinite loop that outlives the test.
function makeParams(overrides: Partial<Params> = {}): Params {
  return {
    generation: 1,
    label: 'Red',
    version: 'red',
    onError: vi.fn(),
    ...overrides,
  }
}

describe('usePokemonNameIndex', () => {
  beforeEach(() => {
    vi.mocked(getTypeMap).mockImplementation(() => Promise.resolve(new Map()))
    vi.mocked(getPokemonNameIndex).mockResolvedValue([])
  })

  it('starts with nameIndexReady=false and an empty index before the fetch settles', () => {
    const onError = vi.fn()
    vi.mocked(getPokemonNameIndex).mockReturnValue(new Promise(() => {})) // never resolves
    const params = makeParams({ onError })
    const { result } = renderHook(() => usePokemonNameIndex(params))
    expect(result.current.nameIndexReady).toBe(false)
    expect(result.current.pokemonNameIndex).toEqual([])
  })

  it('sets nameIndexReady=true and exposes names after a successful fetch', async () => {
    const onError = vi.fn()
    vi.mocked(getPokemonNameIndex).mockResolvedValue(['bulbasaur', 'ivysaur'])
    const params = makeParams({ onError })
    const { result } = renderHook(() => usePokemonNameIndex(params))
    await waitFor(() => expect(result.current.nameIndexReady).toBe(true))
    expect(result.current.pokemonNameIndex).toEqual(['bulbasaur', 'ivysaur'])
  })

  it('keeps the index empty and sets nameIndexReady=false while a new version is loading', async () => {
    let resolveFirst!: (names: string[]) => void
    vi.mocked(getPokemonNameIndex)
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveFirst = resolve
          }),
      )
      .mockResolvedValueOnce(['squirtle'])

    const onError = vi.fn()
    const { result, rerender } = renderHook(
      (p: { version: string }) =>
        usePokemonNameIndex({ ...p, generation: 1, label: 'Test', onError }),
      { initialProps: { version: 'red' } },
    )

    // Resolve the first version
    resolveFirst(['pikachu'])
    await waitFor(() => expect(result.current.nameIndexReady).toBe(true))
    expect(result.current.pokemonNameIndex).toEqual(['pikachu'])

    // Switch to a different version – should immediately be not-ready with empty index
    rerender({ version: 'blue' })
    expect(result.current.nameIndexReady).toBe(false)
    expect(result.current.pokemonNameIndex).toEqual([])

    // After the new version loads, ready again
    await waitFor(() => expect(result.current.nameIndexReady).toBe(true))
    expect(result.current.pokemonNameIndex).toEqual(['squirtle'])
  })

  it('calls onError with a descriptive message when the fetch fails', async () => {
    vi.mocked(getPokemonNameIndex).mockRejectedValue(new Error('network down'))
    const onError = vi.fn()
    const params = makeParams({ onError, label: 'Red' })
    renderHook(() => usePokemonNameIndex(params))
    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith(
        'Unable to load Red Pokédex index. Please try again.',
      )
    })
  })

  it('leaves the index empty after a failed fetch', async () => {
    vi.mocked(getPokemonNameIndex).mockRejectedValue(new Error('network down'))
    const onError = vi.fn()
    const params = makeParams({ onError })
    const { result } = renderHook(() => usePokemonNameIndex(params))
    // Wait for the error side-effect (setLoadedVersion is called even on error)
    await waitFor(() => expect(result.current.nameIndexReady).toBe(true))
    expect(result.current.pokemonNameIndex).toEqual([])
  })
})
