import { beforeEach, describe, expect, it, vi } from 'vitest'

class MockStorage {
  private store = new Map<string, string>()

  getItem(key: string): string | null {
    return this.store.has(key) ? this.store.get(key) ?? null : null
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

describe('getPokemonNameIndex', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.unstubAllGlobals()
  })

  it('fetches and caches Pokemon names', async () => {
    const storage = new MockStorage()
    vi.stubGlobal('localStorage', storage)

    const fetchMock = vi.fn(async () => {
      return new Response(
        JSON.stringify({
          count: 2,
          results: [
            { name: 'Pikachu', url: 'https://pokeapi.co/api/v2/pokemon/25/' },
            { name: 'Eevee', url: 'https://pokeapi.co/api/v2/pokemon/133/' },
          ],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      )
    })
    vi.stubGlobal('fetch', fetchMock)

    const { getPokemonNameIndex } = await import('../services/pokeapi')
    const names = await getPokemonNameIndex()

    expect(names).toEqual(['pikachu', 'eevee'])
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(storage.getItem('pkm_names_v1')).toBeTruthy()
  })

  it('uses fresh cached index without fetching', async () => {
    const storage = new MockStorage()
    const expires = Date.now() + 60_000
    storage.setItem('pkm_names_v1', JSON.stringify({ names: ['bulbasaur'], expires }))
    vi.stubGlobal('localStorage', storage)

    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    const { getPokemonNameIndex } = await import('../services/pokeapi')
    const names = await getPokemonNameIndex()

    expect(names).toEqual(['bulbasaur'])
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('falls back to stale cache on network failure', async () => {
    const storage = new MockStorage()
    const expires = Date.now() - 60_000
    storage.setItem('pkm_names_v1', JSON.stringify({ names: ['chikorita'], expires }))
    vi.stubGlobal('localStorage', storage)

    const fetchMock = vi.fn(async () => {
      throw new Error('network down')
    })
    vi.stubGlobal('fetch', fetchMock)

    const { getPokemonNameIndex } = await import('../services/pokeapi')
    const names = await getPokemonNameIndex()

    expect(names).toEqual(['chikorita'])
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})
