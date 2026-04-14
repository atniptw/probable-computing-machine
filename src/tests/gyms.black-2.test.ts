import { describe, expect, it } from 'vitest'

import { BLACK2_GYMS } from '../data/gyms/black-2'
import { getGymsForGame } from '../data/gyms'

describe('getGymsForGame (black-2)', () => {
  it('returns all 8 Black 2 gym leaders for black-2', () => {
    expect(getGymsForGame('black-2')).toHaveLength(8)
  })

  it('returns the BLACK2_GYMS constant for black-2', () => {
    expect(getGymsForGame('black-2')).toBe(BLACK2_GYMS)
  })
})

describe('BLACK2_GYMS roster shape', () => {
  it('has unique badge numbers 1 through 8', () => {
    const badges = BLACK2_GYMS.map((g) => g.badge)
    expect(badges).toEqual([1, 2, 3, 4, 5, 6, 7, 8])
  })

  it('every leader has required non-empty string fields', () => {
    for (const leader of BLACK2_GYMS) {
      expect(leader.id).toMatch(/\S+/)
      expect(leader.name).toMatch(/\S+/)
      expect(leader.badgeName).toMatch(/\S+/)
      expect(leader.city).toMatch(/\S+/)
      expect(leader.type).toMatch(/\S+/)
    }
  })

  it('every leader has at least one Pokémon on their team', () => {
    for (const leader of BLACK2_GYMS) {
      expect(leader.team.length).toBeGreaterThanOrEqual(1)
    }
  })

  it('every team Pokémon has a non-empty lowercase name and positive level', () => {
    for (const leader of BLACK2_GYMS) {
      for (const pokemon of leader.team) {
        expect(pokemon.name).toMatch(/^[a-z][a-z0-9-]*$/)
        expect(pokemon.level).toBeGreaterThan(0)
      }
    }
  })

  it.each(BLACK2_GYMS.map((g) => [g.name, g] as const))(
    '%s has correct team size',
    (_name, leader) => {
      const expectedSizes: Record<string, number> = {
        cheren: 2,
        roxie: 2,
        burgh: 3,
        elesa: 4,
        clay: 3,
        skyla: 3,
        drayden: 3,
        marlon: 3,
      }
      expect(leader.team).toHaveLength(expectedSizes[leader.id])
    },
  )
})
