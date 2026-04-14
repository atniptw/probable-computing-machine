import { describe, expect, it } from 'vitest'

import { RED_GYMS } from '../data/gyms/red'
import { getGymById, getGymsForGame } from '../data/gyms'

describe('getGymsForGame (red)', () => {
  it('returns all 8 Red gym leaders for red', () => {
    expect(getGymsForGame('red')).toHaveLength(8)
  })

  it('returns the RED_GYMS constant for red', () => {
    expect(getGymsForGame('red')).toBe(RED_GYMS)
  })
})

describe('getGymById (red)', () => {
  it('returns the correct leader for a valid ID', () => {
    const brock = getGymById('red', 'brock')
    expect(brock).not.toBeNull()
    expect(brock?.name).toBe('Brock')
    expect(brock?.id).toBe('brock')
  })
})

describe('RED_GYMS roster shape', () => {
  it('has unique badge numbers 1 through 8', () => {
    const badges = RED_GYMS.map((g) => g.badge)
    expect(badges).toEqual([1, 2, 3, 4, 5, 6, 7, 8])
  })

  it('every leader has required non-empty string fields', () => {
    for (const leader of RED_GYMS) {
      expect(leader.id).toMatch(/\S+/)
      expect(leader.name).toMatch(/\S+/)
      expect(leader.badgeName).toMatch(/\S+/)
      expect(leader.city).toMatch(/\S+/)
      expect(leader.type).toMatch(/\S+/)
    }
  })

  it('every leader has at least one Pokémon on their team', () => {
    for (const leader of RED_GYMS) {
      expect(leader.team.length).toBeGreaterThanOrEqual(1)
    }
  })

  it('every team Pokémon has a non-empty lowercase name and positive level', () => {
    for (const leader of RED_GYMS) {
      for (const pokemon of leader.team) {
        expect(pokemon.name).toMatch(/^[a-z][a-z0-9-]*$/)
        expect(pokemon.level).toBeGreaterThan(0)
      }
    }
  })

  it.each(RED_GYMS.map((g) => [g.name, g] as const))(
    '%s has correct team size',
    (_name, leader) => {
      const expectedSizes: Record<string, number> = {
        brock: 2,
        misty: 2,
        'lt-surge': 3,
        erika: 3,
        koga: 4,
        sabrina: 4,
        blaine: 4,
        giovanni: 5,
      }
      expect(leader.team).toHaveLength(expectedSizes[leader.id])
    },
  )
})
