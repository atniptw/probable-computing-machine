import { describe, expect, it } from 'vitest'

import { SCARLET_GYMS } from '../data/gyms/scarlet'
import { getGymById, getGymsForGame } from '../data/gyms'

describe('getGymsForGame (scarlet)', () => {
  it('returns all 8 Scarlet gym leaders for scarlet', () => {
    expect(getGymsForGame('scarlet')).toHaveLength(8)
  })

  it('returns the SCARLET_GYMS constant for scarlet', () => {
    expect(getGymsForGame('scarlet')).toBe(SCARLET_GYMS)
  })
})

describe('getGymById (scarlet)', () => {
  it('returns the correct leader for a valid ID', () => {
    const katy = getGymById('scarlet', 'katy')
    expect(katy).not.toBeNull()
    expect(katy?.name).toBe('Katy')
    expect(katy?.id).toBe('katy')
  })

  it('returns null for an unknown gym ID', () => {
    expect(getGymById('scarlet', 'unknown')).toBeNull()
  })

  it('returns null for an unsupported game version', () => {
    expect(getGymById('violet', 'katy')).toBeNull()
  })
})

describe('SCARLET_GYMS roster shape', () => {
  it('has unique badge numbers 1 through 8', () => {
    const badges = SCARLET_GYMS.map((g) => g.badge)
    expect(badges).toEqual([1, 2, 3, 4, 5, 6, 7, 8])
  })

  it('every leader has required non-empty string fields', () => {
    for (const leader of SCARLET_GYMS) {
      expect(leader.id).toMatch(/\S+/)
      expect(leader.name).toMatch(/\S+/)
      expect(leader.badgeName).toMatch(/\S+/)
      expect(leader.city).toMatch(/\S+/)
      expect(leader.type).toMatch(/\S+/)
    }
  })

  it('every leader has at least one Pokémon on their team', () => {
    for (const leader of SCARLET_GYMS) {
      expect(leader.team.length).toBeGreaterThanOrEqual(1)
    }
  })

  it('every team Pokémon has a non-empty lowercase name and positive level', () => {
    for (const leader of SCARLET_GYMS) {
      for (const pokemon of leader.team) {
        expect(pokemon.name).toMatch(/^[a-z][a-z0-9-]*$/)
        expect(pokemon.level).toBeGreaterThan(0)
      }
    }
  })

  it('every team Pokémon has at least one move in PokéAPI format', () => {
    for (const leader of SCARLET_GYMS) {
      for (const pokemon of leader.team) {
        expect(pokemon.moves.length).toBeGreaterThanOrEqual(1)
        for (const move of pokemon.moves) {
          expect(move).toMatch(/^[a-z][a-z0-9-]*$/)
        }
      }
    }
  })

  it.each(SCARLET_GYMS.map((g) => [g.name, g] as const))(
    '%s has correct team size',
    (_name, leader) => {
      const expectedSizes: Record<string, number> = {
        katy: 3,
        brassius: 3,
        iono: 4,
        kofu: 3,
        larry: 3,
        ryme: 4,
        tulip: 4,
        grusha: 4,
      }
      expect(leader.team).toHaveLength(expectedSizes[leader.id])
    },
  )
})
