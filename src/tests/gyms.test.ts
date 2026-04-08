import { describe, expect, it } from 'vitest'

import { EMERALD_GYMS, getGymById, getGymsForGame } from '../data/gyms/emerald'

describe('getGymsForGame', () => {
  it('returns all 8 Emerald gym leaders for emerald', () => {
    expect(getGymsForGame('emerald')).toHaveLength(8)
  })

  it('returns the EMERALD_GYMS constant for emerald', () => {
    expect(getGymsForGame('emerald')).toBe(EMERALD_GYMS)
  })

  it('returns an empty array for unsupported game versions', () => {
    expect(getGymsForGame('firered')).toEqual([])
    expect(getGymsForGame('')).toEqual([])
  })
})

describe('getGymById', () => {
  it('returns the correct leader for a valid ID', () => {
    const roxanne = getGymById('emerald', 'roxanne')
    expect(roxanne).not.toBeNull()
    expect(roxanne?.name).toBe('Roxanne')
    expect(roxanne?.id).toBe('roxanne')
  })

  it('returns null for an unknown gym ID', () => {
    expect(getGymById('emerald', 'unknown')).toBeNull()
  })

  it('returns null for an unsupported game version', () => {
    expect(getGymById('firered', 'roxanne')).toBeNull()
  })
})

describe('EMERALD_GYMS roster shape', () => {
  it('has unique badge numbers 1 through 8', () => {
    const badges = EMERALD_GYMS.map((g) => g.badge)
    expect(badges).toEqual([1, 2, 3, 4, 5, 6, 7, 8])
  })

  it('every leader has required non-empty string fields', () => {
    for (const leader of EMERALD_GYMS) {
      expect(leader.id).toMatch(/\S+/)
      expect(leader.name).toMatch(/\S+/)
      expect(leader.badgeName).toMatch(/\S+/)
      expect(leader.city).toMatch(/\S+/)
      expect(leader.type).toMatch(/\S+/)
    }
  })

  it('every leader has at least one Pokémon on their team', () => {
    for (const leader of EMERALD_GYMS) {
      expect(leader.team.length).toBeGreaterThanOrEqual(1)
    }
  })

  it('every team Pokémon has a non-empty lowercase name and positive level', () => {
    for (const leader of EMERALD_GYMS) {
      for (const pokemon of leader.team) {
        expect(pokemon.name).toMatch(/^[a-z][a-z0-9-]*$/)
        expect(pokemon.level).toBeGreaterThan(0)
      }
    }
  })

  it.each(EMERALD_GYMS.map((g) => [g.name, g] as const))(
    '%s has correct team size',
    (_name, leader) => {
      const expectedSizes: Record<string, number> = {
        roxanne: 3,
        brawly: 3,
        wattson: 4,
        flannery: 4,
        norman: 4,
        winona: 5,
        'tate-liza': 2,
        juan: 5,
      }
      expect(leader.team).toHaveLength(expectedSizes[leader.id])
    },
  )
})
