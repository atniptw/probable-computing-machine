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

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

// Minimal pokemon response with a moves array
function pokemonResponse(moves: unknown[]) {
  return jsonResponse({
    name: 'caterpie',
    types: [{ slot: 1, type: { name: 'bug' } }],
    past_types: [],
    sprites: { front_default: null },
    moves,
  })
}

// Version chain responses for 'red' → 'red-blue' → generation-i
function versionChainFetch(pokemonBody: unknown[]) {
  return vi.fn(async (url: string) => {
    if ((url as string).includes('/version/red')) {
      return jsonResponse({ version_group: { name: 'red-blue' } })
    }
    if ((url as string).includes('/version-group/red-blue')) {
      return jsonResponse({
        generation: { name: 'generation-i' },
        pokedexes: [{ name: 'kanto' }],
      })
    }
    return pokemonResponse(pokemonBody)
  })
}

describe('getWildMoveset', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.unstubAllGlobals()
    vi.stubGlobal('localStorage', new MockStorage())
  })

  it('returns up to 4 level-up moves at or below level, sorted descending by level', async () => {
    vi.stubGlobal(
      'fetch',
      versionChainFetch([
        {
          move: { name: 'tackle' },
          version_group_details: [
            {
              level_learned_at: 1,
              move_learn_method: { name: 'level-up' },
              version_group: { name: 'red-blue' },
            },
          ],
        },
        {
          move: { name: 'string-shot' },
          version_group_details: [
            {
              level_learned_at: 10,
              move_learn_method: { name: 'level-up' },
              version_group: { name: 'red-blue' },
            },
          ],
        },
        {
          move: { name: 'bug-bite' },
          version_group_details: [
            {
              level_learned_at: 20,
              move_learn_method: { name: 'level-up' },
              version_group: { name: 'red-blue' },
            },
          ],
        },
        {
          move: { name: 'electroweb' },
          version_group_details: [
            {
              level_learned_at: 30,
              move_learn_method: { name: 'level-up' },
              version_group: { name: 'red-blue' },
            },
          ],
        },
        {
          move: { name: 'solar-beam' },
          version_group_details: [
            {
              level_learned_at: 40,
              move_learn_method: { name: 'level-up' },
              version_group: { name: 'red-blue' },
            },
          ],
        },
      ]),
    )

    const { getWildMoveset } = await import('../services/pokeapi')
    const moves = await getWildMoveset('caterpie', 'red', 25)

    // tackle(1), string-shot(10), bug-bite(20) qualify; electroweb(30) and solar-beam(40) do not
    // sorted descending: bug-bite, string-shot, tackle
    expect(moves).toEqual(['bug-bite', 'string-shot', 'tackle'])
  })

  it('returns all level-up moves for the game when no level given, capped at 4 descending', async () => {
    vi.stubGlobal(
      'fetch',
      versionChainFetch([
        {
          move: { name: 'tackle' },
          version_group_details: [
            {
              level_learned_at: 1,
              move_learn_method: { name: 'level-up' },
              version_group: { name: 'red-blue' },
            },
          ],
        },
        {
          move: { name: 'string-shot' },
          version_group_details: [
            {
              level_learned_at: 10,
              move_learn_method: { name: 'level-up' },
              version_group: { name: 'red-blue' },
            },
          ],
        },
        {
          move: { name: 'bug-bite' },
          version_group_details: [
            {
              level_learned_at: 20,
              move_learn_method: { name: 'level-up' },
              version_group: { name: 'red-blue' },
            },
          ],
        },
        {
          move: { name: 'electroweb' },
          version_group_details: [
            {
              level_learned_at: 30,
              move_learn_method: { name: 'level-up' },
              version_group: { name: 'red-blue' },
            },
          ],
        },
        {
          move: { name: 'solar-beam' },
          version_group_details: [
            {
              level_learned_at: 40,
              move_learn_method: { name: 'level-up' },
              version_group: { name: 'red-blue' },
            },
          ],
        },
      ]),
    )

    const { getWildMoveset } = await import('../services/pokeapi')
    const moves = await getWildMoveset('caterpie', 'red')

    // Top 4 descending by level: solar-beam(40), electroweb(30), bug-bite(20), string-shot(10)
    expect(moves).toEqual([
      'solar-beam',
      'electroweb',
      'bug-bite',
      'string-shot',
    ])
  })

  it('falls back to all level-up moves sorted ascending when level cap filters all out', async () => {
    vi.stubGlobal(
      'fetch',
      versionChainFetch([
        {
          move: { name: 'tackle' },
          version_group_details: [
            {
              level_learned_at: 10,
              move_learn_method: { name: 'level-up' },
              version_group: { name: 'red-blue' },
            },
          ],
        },
        {
          move: { name: 'string-shot' },
          version_group_details: [
            {
              level_learned_at: 20,
              move_learn_method: { name: 'level-up' },
              version_group: { name: 'red-blue' },
            },
          ],
        },
      ]),
    )

    const { getWildMoveset } = await import('../services/pokeapi')
    // Level 5 — no moves qualify (both at 10+), falls back to all, sorted ascending
    const moves = await getWildMoveset('caterpie', 'red', 5)

    expect(moves).toEqual(['tackle', 'string-shot'])
  })

  it('returns [] when Pokémon has no level-up moves for the version group', async () => {
    vi.stubGlobal(
      'fetch',
      versionChainFetch([
        {
          move: { name: 'tackle' },
          version_group_details: [
            {
              level_learned_at: 1,
              move_learn_method: { name: 'tm' }, // not level-up
              version_group: { name: 'red-blue' },
            },
          ],
        },
      ]),
    )

    const { getWildMoveset } = await import('../services/pokeapi')
    const moves = await getWildMoveset('caterpie', 'red')

    expect(moves).toEqual([])
  })

  it('returns [] when the version group has no matching entries for the Pokémon', async () => {
    vi.stubGlobal(
      'fetch',
      versionChainFetch([
        {
          move: { name: 'tackle' },
          version_group_details: [
            {
              level_learned_at: 1,
              move_learn_method: { name: 'level-up' },
              version_group: { name: 'gold-silver' }, // different version group
            },
          ],
        },
      ]),
    )

    const { getWildMoveset } = await import('../services/pokeapi')
    const moves = await getWildMoveset('caterpie', 'red')

    expect(moves).toEqual([])
  })

  it('returns [] when version lookup fails (network error)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        if ((url as string).includes('/version/')) {
          return new Response('', { status: 500 })
        }
        return pokemonResponse([])
      }),
    )

    const { getWildMoveset } = await import('../services/pokeapi')
    const moves = await getWildMoveset('caterpie', 'red')

    expect(moves).toEqual([])
  })

  it('deduplicates concurrent requests for the same Pokémon learnset', async () => {
    let fetchCount = 0
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        if ((url as string).includes('/version/red')) {
          return jsonResponse({ version_group: { name: 'red-blue' } })
        }
        if ((url as string).includes('/version-group/')) {
          return jsonResponse({
            generation: { name: 'generation-i' },
            pokedexes: [{ name: 'kanto' }],
          })
        }
        // pokemon endpoint
        fetchCount++
        await new Promise<void>((resolve) => setTimeout(resolve, 5))
        return pokemonResponse([
          {
            move: { name: 'tackle' },
            version_group_details: [
              {
                level_learned_at: 1,
                move_learn_method: { name: 'level-up' },
                version_group: { name: 'red-blue' },
              },
            ],
          },
        ])
      }),
    )

    const { getWildMoveset } = await import('../services/pokeapi')
    const [a, b] = await Promise.all([
      getWildMoveset('caterpie', 'red'),
      getWildMoveset('caterpie', 'red'),
    ])

    expect(a).toEqual(['tackle'])
    expect(b).toEqual(['tackle'])
    expect(fetchCount).toBe(1)
  })

  it('caches result in localStorage; second call does not re-fetch pokemon endpoint', async () => {
    let pokemonFetchCount = 0
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        if ((url as string).includes('/version/red')) {
          return jsonResponse({ version_group: { name: 'red-blue' } })
        }
        if ((url as string).includes('/version-group/')) {
          return jsonResponse({
            generation: { name: 'generation-i' },
            pokedexes: [{ name: 'kanto' }],
          })
        }
        pokemonFetchCount++
        return pokemonResponse([
          {
            move: { name: 'tackle' },
            version_group_details: [
              {
                level_learned_at: 1,
                move_learn_method: { name: 'level-up' },
                version_group: { name: 'red-blue' },
              },
            ],
          },
        ])
      }),
    )

    const { getWildMoveset } = await import('../services/pokeapi')
    await getWildMoveset('caterpie', 'red')
    await getWildMoveset('caterpie', 'red')

    expect(pokemonFetchCount).toBe(1)
  })
})
