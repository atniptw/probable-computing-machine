import { describe, expect, it } from 'vitest'

import { SWORD_GYMS } from '../data/gyms/sword'
import { getGymsForGame } from '../data/gyms'

describe('getGymsForGame (sword)', () => {
  it('returns all 8 Sword gym leaders for sword', () => {
    expect(getGymsForGame('sword')).toHaveLength(8)
  })

  it('returns the SWORD_GYMS constant for sword', () => {
    expect(getGymsForGame('sword')).toBe(SWORD_GYMS)
  })
})

describe('SWORD_GYMS roster shape', () => {
  it('has unique badge numbers 1 through 8', () => {
    const badges = SWORD_GYMS.map((g) => g.badge)
    expect(badges).toEqual([1, 2, 3, 4, 5, 6, 7, 8])
  })

  it('every leader has required non-empty string fields', () => {
    for (const leader of SWORD_GYMS) {
      expect(leader.id).toMatch(/\S+/)
      expect(leader.name).toMatch(/\S+/)
      expect(leader.badgeName).toMatch(/\S+/)
      expect(leader.city).toMatch(/\S+/)
      expect(leader.type).toMatch(/\S+/)
    }
  })

  it('every leader has at least one Pokémon on their team', () => {
    for (const leader of SWORD_GYMS) {
      expect(leader.team.length).toBeGreaterThanOrEqual(1)
    }
  })

  it('every team Pokémon has a non-empty lowercase hyphenated name and positive level', () => {
    for (const leader of SWORD_GYMS) {
      for (const pokemon of leader.team) {
        expect(pokemon.name).toMatch(/^[a-z][a-z0-9-]*$/)
        expect(pokemon.level).toBeGreaterThan(0)
      }
    }
  })

  it('every team Pokémon has at least one move in lowercase hyphenated format', () => {
    for (const leader of SWORD_GYMS) {
      for (const pokemon of leader.team) {
        expect(pokemon.moves.length).toBeGreaterThanOrEqual(1)
        for (const move of pokemon.moves) {
          expect(move).toMatch(/^[a-z][a-z0-9-]*$/)
        }
      }
    }
  })

  it.each(SWORD_GYMS.map((g) => [g.name, g] as const))(
    '%s has correct team size',
    (_name, leader) => {
      const expectedSizes: Record<string, number> = {
        milo: 2,
        nessa: 3,
        kabu: 3,
        bea: 3,
        opal: 4,
        gordie: 4,
        piers: 4,
        raihan: 4,
      }
      expect(leader.team).toHaveLength(expectedSizes[leader.id])
    },
  )
})
