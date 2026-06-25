import { describe, expect, it } from 'vitest'

import { rankMoves } from '../services/damageCalc'
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

function move(name: string, overrides: Partial<MoveDetail> = {}): MoveDetail {
  return {
    name,
    type: 'normal',
    basePower: 100,
    damageClass: 'physical',
    ...overrides,
  }
}

const A = stats()
const D = stats()

function rank(
  moves: MoveDetail[],
  multipliers: number[],
  opts?: { atkLvl?: number | null; defLvl?: number | null },
) {
  return rankMoves(
    moves,
    A,
    'attacker',
    opts?.atkLvl === undefined ? 50 : opts.atkLvl,
    D,
    'defender',
    opts?.defLvl === undefined ? 50 : opts.defLvl,
    multipliers,
    6,
  )
}

describe('rankMoves', () => {
  it('ranks higher base power ahead of lower base power', () => {
    const result = rank(
      [move('weak', { basePower: 40 }), move('strong', { basePower: 120 })],
      [1, 1],
    )
    expect(result.map((r) => r.moveName)).toEqual(['strong', 'weak'])
  })

  it('ranks super-effective ahead of neutral at equal base power', () => {
    const result = rank([move('neutral'), move('superEffective')], [1, 2])
    expect(result[0].moveName).toBe('superEffective')
  })

  it('ranks status moves last', () => {
    const result = rank(
      [
        move('growl', { damageClass: 'status', basePower: null }),
        move('tackle'),
      ],
      [1, 1],
    )
    expect(result[result.length - 1].moveName).toBe('growl')
  })

  it('ranks variable-power moves above status but below known damage', () => {
    const result = rank(
      [
        move('hiddenPower', { damageClass: 'special', basePower: null }),
        move('growl', { damageClass: 'status', basePower: null }),
        move('knownHit', { basePower: 80 }),
      ],
      [1, 1, 1],
    )
    expect(result.map((r) => r.moveName)).toEqual([
      'knownHit',
      'hiddenPower',
      'growl',
    ])
  })

  it('breaks an exact tie alphabetically by move name', () => {
    const result = rank([move('zebra'), move('alpha')], [1, 1])
    expect(result.map((r) => r.moveName)).toEqual(['alpha', 'zebra'])
  })

  it('returns null damage ranges and sorts by effectiveness when attacker level is null', () => {
    const result = rank([move('low'), move('high')], [1, 2], { atkLvl: null })
    expect(result.every((r) => r.damageRange === null)).toBe(true)
    expect(result[0].moveName).toBe('high')
  })

  it('returns null damage ranges when defender level is null', () => {
    const result = rank([move('a'), move('b')], [1, 1], { defLvl: null })
    expect(result.every((r) => r.damageRange === null)).toBe(true)
  })

  it('sorts unknown-damage moves by effectiveness then name', () => {
    const result = rank(
      [move('mid'), move('best'), move('worst')],
      [1, 4, 0.5],
      {
        atkLvl: null,
      },
    )
    expect(result.map((r) => r.moveName)).toEqual(['best', 'mid', 'worst'])
  })

  it('returns an empty array for no moves', () => {
    expect(rank([], [])).toEqual([])
  })

  it('produces the full MoveRecommendation shape', () => {
    const [rec] = rank(
      [move('surf', { type: 'water', basePower: 90, damageClass: 'special' })],
      [2],
    )
    expect(rec.moveName).toBe('surf')
    expect(rec.moveType).toBe('water')
    expect(rec.basePower).toBe(90)
    expect(rec.damageClass).toBe('special')
    expect(rec.effectiveness).toBe(2)
    expect(rec.damageRange).toMatchObject({
      min: expect.any(Number),
      max: expect.any(Number),
      critMin: expect.any(Number),
      critMax: expect.any(Number),
    })
  })
})
