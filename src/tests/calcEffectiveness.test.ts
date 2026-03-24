import { describe, it, expect } from 'vitest'
import { calcEffectiveness, type TypeRelations } from '../services/pokeapi'

function buildTypeMap(
  entries: [string, Partial<TypeRelations>][],
): Map<string, TypeRelations> {
  const map = new Map<string, TypeRelations>()
  for (const [type, relations] of entries) {
    map.set(type, {
      doubleDamageTo: relations.doubleDamageTo ?? [],
      halfDamageTo: relations.halfDamageTo ?? [],
      noDamageTo: relations.noDamageTo ?? [],
    })
  }
  return map
}

const typeMap = buildTypeMap([
  [
    'electric',
    {
      doubleDamageTo: ['water', 'flying'],
      halfDamageTo: ['electric', 'grass'],
      noDamageTo: ['ground'],
    },
  ],
  [
    'water',
    {
      doubleDamageTo: ['fire', 'ground', 'rock'],
      halfDamageTo: ['water', 'grass', 'dragon'],
      noDamageTo: [],
    },
  ],
  [
    'fire',
    {
      doubleDamageTo: ['grass', 'ice', 'bug', 'steel'],
      halfDamageTo: ['fire', 'water', 'rock', 'dragon'],
      noDamageTo: [],
    },
  ],
  [
    'grass',
    {
      doubleDamageTo: ['water', 'ground', 'rock'],
      halfDamageTo: [
        'fire',
        'grass',
        'poison',
        'flying',
        'bug',
        'dragon',
        'steel',
      ],
      noDamageTo: [],
    },
  ],
  [
    'normal',
    {
      doubleDamageTo: [],
      halfDamageTo: ['rock', 'steel'],
      noDamageTo: ['ghost'],
    },
  ],
  [
    'ground',
    {
      doubleDamageTo: ['fire', 'electric', 'poison', 'rock', 'steel'],
      halfDamageTo: ['grass', 'bug'],
      noDamageTo: ['flying'],
    },
  ],
])

describe('calcEffectiveness', () => {
  it('returns 2 when attacker type is super effective against single defender type', () => {
    expect(calcEffectiveness(['electric'], ['water'], typeMap)).toBe(2)
  })

  it('returns 0.5 when attacker type is not very effective', () => {
    expect(calcEffectiveness(['electric'], ['grass'], typeMap)).toBe(0.5)
  })

  it('returns 0 when attacker type has no effect (immune)', () => {
    expect(calcEffectiveness(['electric'], ['ground'], typeMap)).toBe(0)
  })

  it('returns 1 for a neutral matchup', () => {
    expect(calcEffectiveness(['water'], ['normal'], typeMap)).toBe(1)
  })

  it('stacks modifiers for dual-type attacker (2x * 2x = 4x)', () => {
    // fire+grass vs water: fire=0.5x, grass=2x → 1x
    expect(calcEffectiveness(['fire', 'grass'], ['water'], typeMap)).toBe(1)
  })

  it('stacks modifiers for dual-type defender', () => {
    // electric vs water/flying: water=2x, flying=2x → 4x
    expect(calcEffectiveness(['electric'], ['water', 'flying'], typeMap)).toBe(
      4,
    )
  })

  it('immunity overrides super effective (fire vs normal/ghost = 0)', () => {
    // normal has noDamageTo=[ghost], attacker fire vs ghost/normal
    expect(calcEffectiveness(['normal'], ['ghost'], typeMap)).toBe(0)
  })

  it('returns 1 when attacker type is unknown to the map', () => {
    expect(calcEffectiveness(['???'], ['water'], typeMap)).toBe(1)
  })

  it('returns 1 for empty attacker types', () => {
    expect(calcEffectiveness([], ['water'], typeMap)).toBe(1)
  })
})
