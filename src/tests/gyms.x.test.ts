import { describe, expect, it } from 'vitest'

import { X_GYMS } from '../data/gyms/x'
import { getGymById, getGymsForGame } from '../data/gyms'

describe('getGymsForGame (x)', () => {
  it('returns all 8 X gym leaders for x', () => {
    expect(getGymsForGame('x')).toHaveLength(8)
  })

  it('returns the X_GYMS constant for x', () => {
    expect(getGymsForGame('x')).toBe(X_GYMS)
  })
})

describe('getGymById (x)', () => {
  it('returns the correct leader for a valid ID', () => {
    const viola = getGymById('x', 'viola')
    expect(viola).not.toBeNull()
    expect(viola?.name).toBe('Viola')
    expect(viola?.id).toBe('viola')
  })

  it('returns null for an unknown gym ID', () => {
    expect(getGymById('x', 'unknown')).toBeNull()
  })
})

describe('X_GYMS roster shape', () => {
  it('has unique badge numbers 1 through 8', () => {
    const badges = X_GYMS.map((g) => g.badge)
    expect(badges).toEqual([1, 2, 3, 4, 5, 6, 7, 8])
  })

  it('every leader has required non-empty string fields', () => {
    for (const leader of X_GYMS) {
      expect(leader.id).toMatch(/\S+/)
      expect(leader.name).toMatch(/\S+/)
      expect(leader.badgeName).toMatch(/\S+/)
      expect(leader.city).toMatch(/\S+/)
      expect(leader.type).toMatch(/\S+/)
    }
  })

  it('every leader has at least one Pokémon on their team', () => {
    for (const leader of X_GYMS) {
      expect(leader.team.length).toBeGreaterThanOrEqual(1)
    }
  })

  it('every team Pokémon has a non-empty lowercase name and positive level', () => {
    for (const leader of X_GYMS) {
      for (const pokemon of leader.team) {
        expect(pokemon.name).toMatch(/^[a-z][a-z0-9-]*$/)
        expect(pokemon.level).toBeGreaterThan(0)
      }
    }
  })

  it('every move uses PokéAPI format (lowercase, hyphenated)', () => {
    for (const leader of X_GYMS) {
      for (const pokemon of leader.team) {
        for (const move of pokemon.moves) {
          expect(move).toMatch(/^[a-z][a-z0-9-]*$/)
        }
      }
    }
  })

  it.each(X_GYMS.map((g) => [g.name, g] as const))(
    '%s has correct team size',
    (_name, leader) => {
      const expectedSizes: Record<string, number> = {
        viola: 2,
        grant: 2,
        korrina: 3,
        ramos: 3,
        clemont: 3,
        valerie: 3,
        olympia: 3,
        wulfric: 3,
      }
      expect(leader.team).toHaveLength(expectedSizes[leader.id])
    },
  )
})
