/**
 * PokéAPI contract tests.
 *
 * Each test uses the documented API response shape from API_SPEC.md as its
 * fixture and asserts the parsed output matches the TypeScript interfaces in
 * pokeapi.ts. If PokéAPI renames a field (e.g. `double_damage_to` →
 * `damage_double_to`) or changes nesting, these tests break before the app
 * silently misreads the data.
 */
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

// ─── GET /pokemon/{name} ──────────────────────────────────────────────────────

describe('Contract: GET /pokemon/{name} → Pokemon', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.unstubAllGlobals()
    vi.stubGlobal('localStorage', new MockStorage())
  })

  it('maps name, type slot array, and sprite to Pokemon interface', async () => {
    // Exact fixture from API_SPEC.md
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        jsonResponse({
          name: 'pikachu',
          types: [{ slot: 1, type: { name: 'electric' } }],
          past_types: [],
          sprites: { front_default: 'https://example.com/pikachu.png' },
        }),
      ),
    )

    const { getPokemon } = await import('../services/pokeapi')
    const pokemon = await getPokemon('pikachu')

    expect(pokemon.name).toBe('pikachu')
    expect(pokemon.types).toEqual(['electric'])
    expect(pokemon.sprite).toBe('https://example.com/pikachu.png')
  })

  it('orders types by slot number, not by array position', async () => {
    // API may return slots out of order; service must sort by slot
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        jsonResponse({
          name: 'swampert',
          types: [
            { slot: 2, type: { name: 'ground' } },
            { slot: 1, type: { name: 'water' } },
          ],
          past_types: [],
          sprites: { front_default: null },
        }),
      ),
    )

    const { getPokemon } = await import('../services/pokeapi')
    const pokemon = await getPokemon('swampert')

    expect(pokemon.types).toEqual(['water', 'ground'])
  })

  it('applies past_types for the requested generation', async () => {
    // Verifies the past_types[] → generation.name → types[] nesting is parsed
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        jsonResponse({
          name: 'clefairy',
          types: [{ slot: 1, type: { name: 'fairy' } }],
          past_types: [
            {
              generation: { name: 'generation-v' },
              types: [{ slot: 1, type: { name: 'normal' } }],
            },
          ],
          sprites: { front_default: null },
        }),
      ),
    )

    const { getPokemon } = await import('../services/pokeapi')
    const genV = await getPokemon('clefairy', { generation: 5 })

    expect(genV.types).toEqual(['normal'])
  })
})

// ─── GET /pokemon?limit=1 + GET /pokemon?limit={count} ───────────────────────

describe('Contract: GET /pokemon?limit → string[]', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.unstubAllGlobals()
    vi.stubGlobal('localStorage', new MockStorage())
  })

  it('maps count field and results[].name to a lowercase string array', async () => {
    // Two-step shape from API_SPEC.md: first call returns count, second returns results
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        if ((url as string).endsWith('limit=1')) {
          return jsonResponse({
            count: 2,
            results: [{ name: 'bulbasaur', url: '' }],
          })
        }
        return jsonResponse({
          count: 2,
          results: [
            { name: 'Bulbasaur', url: 'https://pokeapi.co/api/v2/pokemon/1/' },
            { name: 'Ivysaur', url: 'https://pokeapi.co/api/v2/pokemon/2/' },
          ],
        })
      }),
    )

    const { getPokemonNameIndex } = await import('../services/pokeapi')
    const names = await getPokemonNameIndex()

    expect(names).toEqual(['bulbasaur', 'ivysaur'])
  })
})

// ─── GET /type?limit=100 + GET /type/{name} ───────────────────────────────────

describe('Contract: GET /type → TypeRelations', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.unstubAllGlobals()
    vi.stubGlobal('localStorage', new MockStorage())
  })

  it('maps snake_case damage_relations fields to camelCase TypeRelations', async () => {
    // Exact fixture from API_SPEC.md GET /type/{name}
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        if ((url as string).includes('type?limit')) {
          return jsonResponse({ results: [{ name: 'electric', url: '' }] })
        }
        if ((url as string).includes('/type/electric')) {
          return jsonResponse({
            name: 'electric',
            damage_relations: {
              double_damage_to: [{ name: 'water' }, { name: 'flying' }],
              half_damage_to: [
                { name: 'electric' },
                { name: 'grass' },
                { name: 'dragon' },
              ],
              no_damage_to: [{ name: 'ground' }],
            },
          })
        }
        return jsonResponse({}, 404)
      }),
    )

    const { getTypeMap } = await import('../services/pokeapi')
    const typeMap = await getTypeMap()
    const electric = typeMap.get('electric')

    expect(electric).toBeDefined()
    // Verifies double_damage_to → doubleDamageTo mapping
    expect(electric!.doubleDamageTo).toContain('water')
    expect(electric!.doubleDamageTo).toContain('flying')
    // Verifies half_damage_to → halfDamageTo mapping
    expect(electric!.halfDamageTo).toContain('electric')
    expect(electric!.halfDamageTo).toContain('grass')
    // Verifies no_damage_to → noDamageTo mapping
    expect(electric!.noDamageTo).toContain('ground')
  })

  it('excludes unknown and shadow pseudo-types from the type map', async () => {
    // API includes internal pseudo-types that must be filtered out
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        if ((url as string).includes('type?limit')) {
          return jsonResponse({
            results: [
              { name: 'normal', url: '' },
              { name: 'unknown', url: '' },
              { name: 'shadow', url: '' },
            ],
          })
        }
        return jsonResponse({
          name: 'normal',
          damage_relations: {
            double_damage_to: [],
            half_damage_to: [],
            no_damage_to: [{ name: 'ghost' }],
          },
        })
      }),
    )

    const { getTypeMap } = await import('../services/pokeapi')
    const typeMap = await getTypeMap()

    expect(typeMap.has('unknown')).toBe(false)
    expect(typeMap.has('shadow')).toBe(false)
    expect(typeMap.has('normal')).toBe(true)
  })
})

// ─── GET /move/{name} ────────────────────────────────────────────────────────

describe('Contract: GET /move/{name} → string', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.unstubAllGlobals()
  })

  it('maps type.name from move response to a plain string', async () => {
    // Fixture: minimal documented shape for move endpoint
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse({ type: { name: 'electric' } })),
    )

    const { getMoveType } = await import('../services/pokeapi')
    const typeName = await getMoveType('thunderbolt')

    expect(typeName).toBe('electric')
  })
})
