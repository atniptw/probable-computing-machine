import { describe, expect, it } from 'vitest'

import { calcDamageRange, getGenerationGroup } from '../services/damageCalc'
import type { MoveDetail, PokemonStats } from '../services/pokeapiClient'

function stats(overrides: Partial<PokemonStats> = {}): PokemonStats {
  return {
    hp: 100,
    attack: 100,
    defense: 100,
    specialAttack: 100,
    specialDefense: 100,
    speed: 100,
    ...overrides,
  }
}

function move(overrides: Partial<MoveDetail> = {}): MoveDetail {
  return {
    name: 'test-move',
    type: 'normal',
    basePower: 100,
    damageClass: 'physical',
    ...overrides,
  }
}

// Controlled base case: L50, BP100, A100, D100 → baseDamage = 46.
//   floor(2*50/5 + 2) = 22 ; floor(22*100*100/100) = 2200 ; floor(2200/50) = 44 ; +2 = 46

describe('getGenerationGroup', () => {
  it('maps generation numbers to the correct group', () => {
    expect(getGenerationGroup(1)).toBe('gen1')
    expect(getGenerationGroup(2)).toBe('gen2to5')
    expect(getGenerationGroup(5)).toBe('gen2to5')
    expect(getGenerationGroup(6)).toBe('gen6plus')
    expect(getGenerationGroup(9)).toBe('gen6plus')
  })
})

describe('calcDamageRange — null gates', () => {
  it('returns null for a status move', () => {
    expect(
      calcDamageRange(
        move({ damageClass: 'status', basePower: null }),
        stats(),
        'a',
        50,
        stats(),
        'd',
        50,
        1,
        6,
      ),
    ).toBeNull()
  })

  it('returns null when basePower is null (variable-power move)', () => {
    expect(
      calcDamageRange(
        move({ damageClass: 'special', basePower: null }),
        stats(),
        'a',
        50,
        stats(),
        'd',
        50,
        1,
        6,
      ),
    ).toBeNull()
  })

  it('returns null when attacker or defender level is null', () => {
    const args = [move(), stats(), 'a'] as const
    expect(calcDamageRange(...args, null, stats(), 'd', 50, 1, 6)).toBeNull()
    expect(calcDamageRange(...args, 50, stats(), 'd', null, 1, 6)).toBeNull()
  })
})

describe('calcDamageRange — per-generation formula', () => {
  it('Gen 6+: 1.5x crit and 85–100/100 roll', () => {
    expect(
      calcDamageRange(move(), stats(), 'a', 50, stats(), 'd', 50, 1, 6),
    ).toEqual({ min: 39, max: 46, critMin: 58, critMax: 69 })
  })

  it('Gen 1: 2x crit and 217–255/255 roll', () => {
    expect(
      calcDamageRange(move(), stats(), 'a', 50, stats(), 'd', 50, 1, 1),
    ).toEqual({ min: 39, max: 46, critMin: 78, critMax: 92 })
  })

  it('Gen 2–5: 2x crit and 217–255/255 roll', () => {
    expect(
      calcDamageRange(move(), stats(), 'a', 50, stats(), 'd', 50, 1, 3),
    ).toEqual({ min: 39, max: 46, critMin: 78, critMax: 92 })
  })
})

describe('calcDamageRange — effectiveness scaling', () => {
  it('0x effectiveness produces all zeros', () => {
    expect(
      calcDamageRange(move(), stats(), 'a', 50, stats(), 'd', 50, 0, 6),
    ).toEqual({ min: 0, max: 0, critMin: 0, critMax: 0 })
  })

  it('2x effectiveness (Gen 6+) doubles the base range', () => {
    expect(
      calcDamageRange(move(), stats(), 'a', 50, stats(), 'd', 50, 2, 6),
    ).toEqual({ min: 78, max: 92, critMin: 117, critMax: 138 })
  })
})

describe('calcDamageRange — stat selection', () => {
  it('physical moves use attack/defense; special moves use the special split', () => {
    const mixed = stats({ attack: 120, specialAttack: 50 })
    const physical = calcDamageRange(
      move({ damageClass: 'physical' }),
      mixed,
      'a',
      50,
      stats(),
      'd',
      50,
      1,
      3,
    )
    const special = calcDamageRange(
      move({ damageClass: 'special' }),
      mixed,
      'a',
      50,
      stats(),
      'd',
      50,
      1,
      3,
    )
    // attack 120 → bigger floor; specialAttack 50 → smaller floor.
    expect(physical?.min).toBe(45)
    expect(special?.min).toBe(20)
  })

  it('Gen 1 special moves apply the Gen 1 Special override (gengar = 100, not 130)', () => {
    const gengar = stats({ specialAttack: 130 })
    expect(
      calcDamageRange(
        move({ damageClass: 'special' }),
        gengar,
        'gengar',
        50,
        stats(),
        'starmie',
        50,
        1,
        1,
      ),
    ).toEqual({ min: 39, max: 46, critMin: 78, critMax: 92 })
  })
})
