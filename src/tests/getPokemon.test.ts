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

  it('extracts all six stats from the pokemon response', async () => {
    const storage = new MockStorage()
    vi.stubGlobal('localStorage', storage)

    const fetchMock = vi.fn(async () => {
      return new Response(
        JSON.stringify({
          name: 'gengar',
          types: [{ slot: 1, type: { name: 'ghost' } }],
          sprites: { front_default: 'sprite.png' },
          stats: [
            { base_stat: 60, stat: { name: 'hp' } },
            { base_stat: 65, stat: { name: 'attack' } },
            { base_stat: 60, stat: { name: 'defense' } },
            { base_stat: 130, stat: { name: 'special-attack' } },
            { base_stat: 75, stat: { name: 'special-defense' } },
            { base_stat: 110, stat: { name: 'speed' } },
          ],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      )
    })
    vi.stubGlobal('fetch', fetchMock)

    const { getPokemon } = await import('../services/pokeapi')
    const gengar = await getPokemon('gengar')

    expect(gengar.stats).toEqual({
      hp: 60,
      attack: 65,
      defense: 60,
      specialAttack: 130,
      specialDefense: 75,
      speed: 110,
    })
  })
})

describe('normalizeStats', () => {
  it('maps PokéAPI stat names to camelCase and defaults missing stats to 0', async () => {
    const { normalizeStats } = await import('../services/pokeapi')
    expect(
      normalizeStats([
        { base_stat: 45, stat: { name: 'hp' } },
        { base_stat: 50, stat: { name: 'special-attack' } },
      ]),
    ).toEqual({
      hp: 45,
      attack: 0,
      defense: 0,
      specialAttack: 50,
      specialDefense: 0,
      speed: 0,
    })
  })
})
