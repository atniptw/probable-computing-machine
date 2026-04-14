import { describe, expect, it } from 'vitest'

import { ULTRA_SUN_GYMS } from '../data/gyms/ultra-sun'
import { getGymById, getGymsForGame } from '../data/gyms'

describe('getGymsForGame (ultra-sun)', () => {
  it('returns all 8 captains/kahunas for ultra-sun', () => {
    expect(getGymsForGame('ultra-sun')).toHaveLength(8)
  })

  it('returns the ULTRA_SUN_GYMS constant for ultra-sun', () => {
    expect(getGymsForGame('ultra-sun')).toBe(ULTRA_SUN_GYMS)
  })
})

describe('getGymById (ultra-sun)', () => {
  it('returns the correct leader for a valid ID', () => {
    const ilima = getGymById('ultra-sun', 'ilima')
    expect(ilima).not.toBeNull()
    expect(ilima?.name).toBe('Ilima')
    expect(ilima?.id).toBe('ilima')
  })

  it('returns null for an unknown ID', () => {
    expect(getGymById('ultra-sun', 'unknown')).toBeNull()
  })
})

describe('ULTRA_SUN_GYMS roster shape', () => {
  it('has unique badge numbers 1 through 8', () => {
    const badges = ULTRA_SUN_GYMS.map((g) => g.badge)
    expect(badges).toEqual([1, 2, 3, 4, 5, 6, 7, 8])
  })

  it('every captain/kahuna has required non-empty string fields', () => {
    for (const leader of ULTRA_SUN_GYMS) {
      expect(leader.id).toMatch(/\S+/)
      expect(leader.name).toMatch(/\S+/)
      expect(leader.badgeName).toMatch(/\S+/)
      expect(leader.city).toMatch(/\S+/)
      expect(leader.type).toMatch(/\S+/)
    }
  })

  it('every captain/kahuna has at least one Pokémon on their team', () => {
    for (const leader of ULTRA_SUN_GYMS) {
      expect(leader.team.length).toBeGreaterThanOrEqual(1)
    }
  })

  it('every team Pokémon has a non-empty lowercase name and positive level', () => {
    for (const leader of ULTRA_SUN_GYMS) {
      for (const pokemon of leader.team) {
        expect(pokemon.name).toMatch(/^[a-z][a-z0-9-]*$/)
        expect(pokemon.level).toBeGreaterThan(0)
      }
    }
  })

  it.each(ULTRA_SUN_GYMS.map((g) => [g.name, g] as const))(
    '%s has correct team size',
    (_name, leader) => {
      const expectedSizes: Record<string, number> = {
        ilima: 1,
        lana: 1,
        kiawe: 1,
        mallow: 1,
        sophocles: 1,
        acerola: 1,
        nanu: 3,
        hapu: 4,
      }
      expect(leader.team).toHaveLength(expectedSizes[leader.id])
    },
  )

  it('Z-Crystal badge names are used', () => {
    const badgeNames = ULTRA_SUN_GYMS.map((g) => g.badgeName)
    for (const name of badgeNames) {
      expect(name).toMatch(/Z$/)
    }
  })

  it('island names are used as city field', () => {
    const islands = [
      'Melemele Island',
      'Akala Island',
      "Ula'ula Island",
      'Poni Island',
    ]
    for (const leader of ULTRA_SUN_GYMS) {
      expect(islands).toContain(leader.city)
    }
  })
})
