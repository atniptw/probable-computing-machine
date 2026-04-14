import { describe, expect, it } from 'vitest'

import { CRYSTAL_GYMS } from '../data/gyms/crystal'
import { getGymById, getGymsForGame } from '../data/gyms'

describe('getGymsForGame (crystal)', () => {
  it('returns all 8 Crystal gym leaders for crystal', () => {
    expect(getGymsForGame('crystal')).toHaveLength(8)
  })

  it('returns the CRYSTAL_GYMS constant for crystal', () => {
    expect(getGymsForGame('crystal')).toBe(CRYSTAL_GYMS)
  })
})

describe('getGymById (crystal)', () => {
  it('returns the correct Crystal leader for a valid ID', () => {
    const falkner = getGymById('crystal', 'falkner')
    expect(falkner).not.toBeNull()
    expect(falkner?.name).toBe('Falkner')
    expect(falkner?.id).toBe('falkner')
  })
})

describe('CRYSTAL_GYMS roster shape', () => {
  it('has unique badge numbers 1 through 8', () => {
    const badges = CRYSTAL_GYMS.map((g) => g.badge)
    expect(badges).toEqual([1, 2, 3, 4, 5, 6, 7, 8])
  })

  it('every leader has required non-empty string fields', () => {
    for (const leader of CRYSTAL_GYMS) {
      expect(leader.id).toMatch(/\S+/)
      expect(leader.name).toMatch(/\S+/)
      expect(leader.badgeName).toMatch(/\S+/)
      expect(leader.city).toMatch(/\S+/)
      expect(leader.type).toMatch(/\S+/)
    }
  })

  it('every leader has at least one Pokémon on their team', () => {
    for (const leader of CRYSTAL_GYMS) {
      expect(leader.team.length).toBeGreaterThanOrEqual(1)
    }
  })

  it('every team Pokémon has a non-empty lowercase name and positive level', () => {
    for (const leader of CRYSTAL_GYMS) {
      for (const pokemon of leader.team) {
        expect(pokemon.name).toMatch(/^[a-z][a-z0-9-]*$/)
        expect(pokemon.level).toBeGreaterThan(0)
      }
    }
  })

  it('every team Pokémon has at least one move in PokéAPI format', () => {
    for (const leader of CRYSTAL_GYMS) {
      for (const pokemon of leader.team) {
        expect(pokemon.moves.length).toBeGreaterThanOrEqual(1)
        for (const move of pokemon.moves) {
          expect(move).toMatch(/^[a-z][a-z0-9-]*$/)
        }
      }
    }
  })

  it.each(CRYSTAL_GYMS.map((g) => [g.name, g] as const))(
    '%s has correct team size',
    (_name, leader) => {
      const expectedSizes: Record<string, number> = {
        falkner: 2,
        bugsy: 3,
        whitney: 2,
        morty: 4,
        chuck: 2,
        jasmine: 3,
        pryce: 3,
        clair: 4,
      }
      expect(leader.team).toHaveLength(expectedSizes[leader.id])
    },
  )
})
