import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

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

// Each test uses vi.resetModules() to flush the module-level caches in pokeapi.ts.

describe('getPokemon error and cache paths', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.unstubAllGlobals()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('throws PokemonNotFoundError when the API returns 404', async () => {
    const storage = new MockStorage()
    vi.stubGlobal('localStorage', storage)
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response('', { status: 404 })),
    )

    const { getPokemon, PokemonNotFoundError } =
      await import('../services/pokeapi')
    await expect(getPokemon('missingmon')).rejects.toBeInstanceOf(
      PokemonNotFoundError,
    )
  })

  it('thrown PokemonNotFoundError carries the pokemon name', async () => {
    const storage = new MockStorage()
    vi.stubGlobal('localStorage', storage)
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response('', { status: 404 })),
    )

    const { getPokemon, PokemonNotFoundError } =
      await import('../services/pokeapi')
    const error = await getPokemon('missingmon').catch((e: unknown) => e)
    expect(error).toBeInstanceOf(PokemonNotFoundError)
    expect(
      (error as InstanceType<typeof PokemonNotFoundError>).pokemonName,
    ).toBe('missingmon')
  })

  it('throws RateLimitError when 429 persists after one retry', async () => {
    vi.useFakeTimers()
    const storage = new MockStorage()
    vi.stubGlobal('localStorage', storage)
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response('', { status: 429 })),
    )

    const { getPokemon, RateLimitError } = await import('../services/pokeapi')

    // Attach .catch immediately so the rejection is never unhandled while
    // fake timers are advanced (there is no async gap between creation and handler).
    let capturedError: unknown
    const done = getPokemon('pikachu').catch((e: unknown) => {
      capturedError = e
    })
    // fetchWithRetry waits 1 000 ms before the second attempt; advance past it
    await vi.advanceTimersByTimeAsync(1100)
    await done
    expect(capturedError).toBeInstanceOf(RateLimitError)
  })

  it('returns cached data without making a network request when the cache is fresh', async () => {
    const storage = new MockStorage()
    const cachedPokemon = {
      name: 'bulbasaur',
      types: ['grass', 'poison'],
      sprite: null,
    }
    // Cache key format: `pkm_v2_${name}_g${generation}` — no generation option → g0
    storage.setItem(
      'pkm_v2_bulbasaur_g0',
      JSON.stringify({ data: cachedPokemon, expires: Date.now() + 600_000 }),
    )
    vi.stubGlobal('localStorage', storage)

    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    const { getPokemon } = await import('../services/pokeapi')
    const result = await getPokemon('bulbasaur')

    expect(result).toEqual(cachedPokemon)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('fetches fresh data and removes the stale cache entry when the cache is expired', async () => {
    const storage = new MockStorage()
    // Stale cache has only ['grass'] — no 'poison'
    const stalePokemon = { name: 'bulbasaur', types: ['grass'], sprite: null }
    storage.setItem(
      'pkm_v2_bulbasaur_g0',
      JSON.stringify({ data: stalePokemon, expires: Date.now() - 60_000 }),
    )
    vi.stubGlobal('localStorage', storage)

    // Fresh API response adds 'poison'
    const freshPokemonResponse = {
      name: 'bulbasaur',
      types: [
        { slot: 1, type: { name: 'grass' } },
        { slot: 2, type: { name: 'poison' } },
      ],
      past_types: [],
      sprites: { front_default: 'sprite.png' },
    }
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(freshPokemonResponse), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const { getPokemon } = await import('../services/pokeapi')
    const result = await getPokemon('bulbasaur')

    // Fresh data includes 'poison'; stale data did not → confirms stale cache was not used
    expect(result.types).toContain('poison')
    // A network request was made to refresh the stale entry
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('deduplicates concurrent in-flight requests for the same Pokémon', async () => {
    const storage = new MockStorage()
    vi.stubGlobal('localStorage', storage)

    const fetchMock = vi.fn(async () => {
      await new Promise<void>((resolve) => setTimeout(resolve, 5))
      return new Response(
        JSON.stringify({
          name: 'eevee',
          types: [{ slot: 1, type: { name: 'normal' } }],
          past_types: [],
          sprites: { front_default: null },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      )
    })
    vi.stubGlobal('fetch', fetchMock)

    const { getPokemon } = await import('../services/pokeapi')

    const [first, second] = await Promise.all([
      getPokemon('eevee'),
      getPokemon('eevee'),
    ])

    expect(first.name).toBe('eevee')
    expect(second.name).toBe('eevee')
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})
