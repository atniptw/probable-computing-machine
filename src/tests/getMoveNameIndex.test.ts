import { beforeEach, describe, expect, it, vi } from 'vitest'

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

describe('getMoveNameIndex', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.unstubAllGlobals()
  })

  it('fetches and caches move names', async () => {
    const storage = new MockStorage()
    vi.stubGlobal('localStorage', storage)

    const fetchMock = vi.fn(async (url: string) => {
      if (url.endsWith('/move?limit=1')) {
        return new Response(JSON.stringify({ count: 2, results: [] }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      }

      return new Response(
        JSON.stringify({
          count: 2,
          results: [
            { name: 'thunderbolt', url: 'https://pokeapi.co/api/v2/move/85/' },
            { name: 'volt-tackle', url: 'https://pokeapi.co/api/v2/move/344/' },
          ],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      )
    })
    vi.stubGlobal('fetch', fetchMock)

    const { getMoveNameIndex } = await import('../services/pokeapi')
    const names = await getMoveNameIndex()

    expect(names).toEqual(['thunderbolt', 'volt tackle'])
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(storage.getItem('pkm_moves_v1_all')).toBeTruthy()
  })

  it('uses fresh cached move index without fetching', async () => {
    const storage = new MockStorage()
    const expires = Date.now() + 60_000
    storage.setItem(
      'pkm_moves_v1_all',
      JSON.stringify({ names: ['ice beam'], expires }),
    )
    vi.stubGlobal('localStorage', storage)

    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    const { getMoveNameIndex } = await import('../services/pokeapi')
    const names = await getMoveNameIndex()

    expect(names).toEqual(['ice beam'])
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('falls back to stale cached move index on network failure', async () => {
    const storage = new MockStorage()
    const expires = Date.now() - 60_000
    storage.setItem(
      'pkm_moves_v1_all',
      JSON.stringify({ names: ['surf'], expires }),
    )
    vi.stubGlobal('localStorage', storage)

    const fetchMock = vi.fn(async () => {
      throw new Error('network down')
    })
    vi.stubGlobal('fetch', fetchMock)

    const { getMoveNameIndex } = await import('../services/pokeapi')
    const names = await getMoveNameIndex()

    expect(names).toEqual(['surf'])
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('deduplicates concurrent move index requests', async () => {
    const storage = new MockStorage()
    vi.stubGlobal('localStorage', storage)

    const fetchMock = vi.fn(async (url: string) => {
      if (url.endsWith('/move?limit=1')) {
        return new Response(JSON.stringify({ count: 2, results: [] }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      }

      return new Response(
        JSON.stringify({
          count: 2,
          results: [
            { name: 'ice-beam', url: 'https://pokeapi.co/api/v2/move/58/' },
            { name: 'surf', url: 'https://pokeapi.co/api/v2/move/57/' },
          ],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      )
    })
    vi.stubGlobal('fetch', fetchMock)

    const { getMoveNameIndex } = await import('../services/pokeapi')
    const [first, second] = await Promise.all([
      getMoveNameIndex(),
      getMoveNameIndex(),
    ])

    expect(first).toEqual(['ice beam', 'surf'])
    expect(second).toEqual(['ice beam', 'surf'])
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })
})
