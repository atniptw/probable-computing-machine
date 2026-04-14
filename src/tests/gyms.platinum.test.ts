import { describe, expect, it } from 'vitest'

import { PLATINUM_GYMS } from '../data/gyms/platinum'
import { getGymById, getGymsForGame } from '../data/gyms'

describe('getGymsForGame (platinum)', () => {
  it('returns all 8 Platinum gym leaders for platinum', () => {
    expect(getGymsForGame('platinum')).toHaveLength(8)
  })

  it('returns the PLATINUM_GYMS constant for platinum', () => {
    expect(getGymsForGame('platinum')).toBe(PLATINUM_GYMS)
  })
})

describe('getGymById (platinum)', () => {
  it('returns the correct leader for a valid ID', () => {
    const roark = getGymById('platinum', 'roark')
    expect(roark).not.toBeNull()
    expect(roark?.name).toBe('Roark')
    expect(roark?.id).toBe('roark')
  })

  it('returns the correct leader for crasher-wake', () => {
    const wake = getGymById('platinum', 'crasher-wake')
    expect(wake).not.toBeNull()
    expect(wake?.name).toBe('Crasher Wake')
  })

  it('returns null for an unknown gym ID', () => {
    expect(getGymById('platinum', 'unknown')).toBeNull()
  })
})

describe('PLATINUM_GYMS roster shape', () => {
  it('has unique badge numbers 1 through 8', () => {
    const badges = PLATINUM_GYMS.map((g) => g.badge)
    expect(badges).toEqual([1, 2, 3, 4, 5, 6, 7, 8])
  })

  it('every leader has required non-empty string fields', () => {
    for (const leader of PLATINUM_GYMS) {
      expect(leader.id).toMatch(/\S+/)
      expect(leader.name).toMatch(/\S+/)
      expect(leader.badgeName).toMatch(/\S+/)
      expect(leader.city).toMatch(/\S+/)
      expect(leader.type).toMatch(/\S+/)
    }
  })

  it('every leader has at least one Pokémon on their team', () => {
    for (const leader of PLATINUM_GYMS) {
      expect(leader.team.length).toBeGreaterThanOrEqual(1)
    }
  })

  it('every team Pokémon has a non-empty lowercase name and positive level', () => {
    for (const leader of PLATINUM_GYMS) {
      for (const pokemon of leader.team) {
        expect(pokemon.name).toMatch(/^[a-z][a-z0-9-]*$/)
        expect(pokemon.level).toBeGreaterThan(0)
      }
    }
  })

  it('every move name uses PokéAPI format (lowercase, hyphenated)', () => {
    for (const leader of PLATINUM_GYMS) {
      for (const pokemon of leader.team) {
        for (const move of pokemon.moves) {
          expect(move).toMatch(/^[a-z][a-z0-9-]*$/)
        }
      }
    }
  })

  it.each(PLATINUM_GYMS.map((g) => [g.name, g] as const))(
    '%s has correct team size',
    (_name, leader) => {
      const expectedSizes: Record<string, number> = {
        roark: 3,
        gardenia: 3,
        maylene: 3,
        'crasher-wake': 3,
        fantina: 3,
        byron: 3,
        candice: 4,
        volkner: 4,
      }
      expect(leader.team).toHaveLength(expectedSizes[leader.id])
    },
  )
})
