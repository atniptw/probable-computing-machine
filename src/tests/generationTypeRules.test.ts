/**
 * Generation-aware type chart tests.
 *
 * These are the highest-value regression tests in the codebase. Each test
 * drives `getTypeMap` with a stubbed fetch fixture that matches the real
 * PokéAPI shape, then asserts `calcEffectiveness` produces the correct result
 * for the specific generation. A silent bug in `applyGenerationTypeRules`
 * would immediately break one of these.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

// ─── Fixtures ──────────────────────────────────────────────────────────────────

// Minimal set of types that exercises all generation-specific rules.
// Values match Gen 9 (current) PokéAPI damage_relations for each type.
const TYPE_LIST = [
  'ghost',
  'dark',
  'steel',
  'fairy',
  'psychic',
  'ice',
  'dragon',
  'fire',
]

const TYPE_RELATIONS: Record<
  string,
  {
    double_damage_to: { name: string }[]
    half_damage_to: { name: string }[]
    no_damage_to: { name: string }[]
  }
> = {
  ghost: {
    double_damage_to: [{ name: 'ghost' }, { name: 'psychic' }],
    half_damage_to: [{ name: 'dark' }],
    no_damage_to: [{ name: 'normal' }],
  },
  dark: {
    double_damage_to: [{ name: 'ghost' }, { name: 'psychic' }],
    half_damage_to: [{ name: 'dark' }, { name: 'fighting' }, { name: 'fairy' }],
    no_damage_to: [],
  },
  steel: {
    double_damage_to: [{ name: 'rock' }, { name: 'ice' }, { name: 'fairy' }],
    half_damage_to: [{ name: 'steel' }, { name: 'fire' }, { name: 'water' }],
    no_damage_to: [{ name: 'poison' }],
  },
  fairy: {
    double_damage_to: [
      { name: 'fighting' },
      { name: 'dragon' },
      { name: 'dark' },
    ],
    half_damage_to: [{ name: 'fire' }, { name: 'poison' }, { name: 'steel' }],
    no_damage_to: [],
  },
  psychic: {
    double_damage_to: [{ name: 'fighting' }, { name: 'poison' }],
    half_damage_to: [{ name: 'psychic' }, { name: 'steel' }],
    no_damage_to: [{ name: 'dark' }],
  },
  ice: {
    double_damage_to: [
      { name: 'grass' },
      { name: 'ground' },
      { name: 'flying' },
      { name: 'dragon' },
    ],
    // fire resistance exists in Gen 2+; removed in Gen 1 by applyGenerationTypeRules
    half_damage_to: [{ name: 'water' }, { name: 'ice' }, { name: 'fire' }],
    no_damage_to: [],
  },
  dragon: {
    double_damage_to: [{ name: 'dragon' }],
    half_damage_to: [{ name: 'steel' }],
    no_damage_to: [],
  },
  fire: {
    double_damage_to: [
      { name: 'grass' },
      { name: 'ice' },
      { name: 'bug' },
      { name: 'steel' },
    ],
    half_damage_to: [
      { name: 'fire' },
      { name: 'water' },
      { name: 'rock' },
      { name: 'dragon' },
    ],
    no_damage_to: [],
  },
}

const BASE_URL = 'https://pokeapi.co/api/v2'

function typeFixtureFetch() {
  return vi.fn(async (url: string) => {
    if (url === `${BASE_URL}/type?limit=100`) {
      return new Response(
        JSON.stringify({
          results: TYPE_LIST.map((name) => ({ name, url: '' })),
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      )
    }
    for (const name of TYPE_LIST) {
      if (url === `${BASE_URL}/type/${name}`) {
        return new Response(
          JSON.stringify({ damage_relations: TYPE_RELATIONS[name] }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        )
      }
    }
    throw new Error(`Unexpected fetch URL: ${url}`)
  })
}

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

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Generation-aware type rules', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.unstubAllGlobals()
    vi.stubGlobal('localStorage', new MockStorage())
    vi.stubGlobal('fetch', typeFixtureFetch())
  })

  // --- AC1: Gen 1 Ghost / Psychic immunity bug ---

  it('Gen 1: Ghost has no effect on Psychic (Gen 1 immunity bug)', async () => {
    const { getTypeMap, calcEffectiveness } =
      await import('../services/pokeapi')
    const map = await getTypeMap({ generation: 1 })
    expect(calcEffectiveness(['ghost'], ['psychic'], map)).toBe(0)
  })

  it('Gen 2+: Ghost is super effective against Psychic', async () => {
    const { getTypeMap, calcEffectiveness } =
      await import('../services/pokeapi')
    const map = await getTypeMap({ generation: 2 })
    expect(calcEffectiveness(['ghost'], ['psychic'], map)).toBe(2)
  })

  // --- AC2: Fairy type existence vs non-existence ---

  it('Gen 5: Fairy type does not exist in the type map', async () => {
    const { getTypeMap } = await import('../services/pokeapi')
    const map = await getTypeMap({ generation: 5 })
    expect(map.has('fairy')).toBe(false)
  })

  it('Gen 6: Fairy type exists and is super effective against Dragon', async () => {
    const { getTypeMap, calcEffectiveness } =
      await import('../services/pokeapi')
    const map = await getTypeMap({ generation: 6 })
    expect(map.has('fairy')).toBe(true)
    expect(calcEffectiveness(['fairy'], ['dragon'], map)).toBe(2)
  })

  // --- AC3a: Dark and Steel types absent in Gen 1 ---

  it('Gen 1: Dark and Steel types do not exist', async () => {
    const { getTypeMap } = await import('../services/pokeapi')
    const map = await getTypeMap({ generation: 1 })
    expect(map.has('dark')).toBe(false)
    expect(map.has('steel')).toBe(false)
  })

  // --- AC3b: Ghost halved by Steel in Gen 2–5, neutral in Gen 6+ ---

  it('Gen 3: Ghost does 0.5x against Steel (Steel resists Ghost pre-Gen 6)', async () => {
    const { getTypeMap, calcEffectiveness } =
      await import('../services/pokeapi')
    const map = await getTypeMap({ generation: 3 })
    expect(calcEffectiveness(['ghost'], ['steel'], map)).toBe(0.5)
  })

  it('Gen 6+: Ghost does neutral damage against Steel', async () => {
    const { getTypeMap, calcEffectiveness } =
      await import('../services/pokeapi')
    const map = await getTypeMap({ generation: 6 })
    expect(calcEffectiveness(['ghost'], ['steel'], map)).toBe(1)
  })

  // --- AC3c: Ice / Fire resistance removed in Gen 1 ---

  it('Gen 1: Ice does neutral damage against Fire (no Fire resistance)', async () => {
    const { getTypeMap, calcEffectiveness } =
      await import('../services/pokeapi')
    const map = await getTypeMap({ generation: 1 })
    expect(calcEffectiveness(['ice'], ['fire'], map)).toBe(1)
  })

  it('Gen 2+: Ice does 0.5x against Fire', async () => {
    const { getTypeMap, calcEffectiveness } =
      await import('../services/pokeapi')
    const map = await getTypeMap({ generation: 2 })
    expect(calcEffectiveness(['ice'], ['fire'], map)).toBe(0.5)
  })
})
