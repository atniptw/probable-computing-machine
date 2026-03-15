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

describe('getPokemon', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.unstubAllGlobals()
  })

  it('deduplicates concurrent requests for the same pokemon', async () => {
    const storage = new MockStorage()
    vi.stubGlobal('localStorage', storage)

    const fetchMock = vi.fn(async () => {
      await new Promise<void>((resolve) => setTimeout(resolve, 5))
      return new Response(
        JSON.stringify({
          name: 'pikachu',
          types: [{ slot: 1, type: { name: 'electric' } }],
          sprites: { front_default: 'sprite.png' },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      )
    })

    vi.stubGlobal('fetch', fetchMock)

    const { getPokemon } = await import('../services/pokeapi')

    const [first, second] = await Promise.all([
      getPokemon('pikachu'),
      getPokemon('pikachu'),
    ])

    expect(first.name).toBe('pikachu')
    expect(second.name).toBe('pikachu')
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('returns generation-specific historical types when available', async () => {
    const storage = new MockStorage()
    vi.stubGlobal('localStorage', storage)

    const fetchMock = vi.fn(async () => {
      return new Response(
        JSON.stringify({
          name: 'clefairy',
          types: [{ slot: 1, type: { name: 'fairy' } }],
          past_types: [
            {
              generation: { name: 'generation-v' },
              types: [{ slot: 1, type: { name: 'normal' } }],
            },
          ],
          sprites: { front_default: 'sprite.png' },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      )
    })

    vi.stubGlobal('fetch', fetchMock)

    const { getPokemon } = await import('../services/pokeapi')

    const genFive = await getPokemon('clefairy', { generation: 5 })
    const genSix = await getPokemon('clefairy', { generation: 6 })

    expect(genFive.types).toEqual(['normal'])
    expect(genSix.types).toEqual(['fairy'])
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })
})
