import { describe, expect, it } from 'vitest'

import { CRYSTAL_GYMS } from '../data/gyms/crystal'
import { EMERALD_GYMS, getGymById, getGymsForGame } from '../data/gyms/emerald'
import { PLATINUM_GYMS } from '../data/gyms/platinum'
import { RED_GYMS } from '../data/gyms/red'

describe('getGymsForGame', () => {
  it('returns all 8 Emerald gym leaders for emerald', () => {
    expect(getGymsForGame('emerald')).toHaveLength(8)
  })

  it('returns the EMERALD_GYMS constant for emerald', () => {
    expect(getGymsForGame('emerald')).toBe(EMERALD_GYMS)
  })

  it('returns all 8 Crystal gym leaders for crystal', () => {
    expect(getGymsForGame('crystal')).toHaveLength(8)
  })

  it('returns the CRYSTAL_GYMS constant for crystal', () => {
    expect(getGymsForGame('crystal')).toBe(CRYSTAL_GYMS)
  })

  it('returns all 8 Red gym leaders for red', () => {
    expect(getGymsForGame('red')).toHaveLength(8)
  })

  it('returns the RED_GYMS constant for red', () => {
    expect(getGymsForGame('red')).toBe(RED_GYMS)
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

  it('returns the correct Crystal leader for a valid ID', () => {
    const falkner = getGymById('crystal', 'falkner')
    expect(falkner).not.toBeNull()
    expect(falkner?.name).toBe('Falkner')
    expect(falkner?.id).toBe('falkner')
  })

  it('returns the correct Red leader for a valid ID', () => {
    const brock = getGymById('red', 'brock')
    expect(brock).not.toBeNull()
    expect(brock?.name).toBe('Brock')
    expect(brock?.id).toBe('brock')
  })

  it('returns null for an unknown gym ID', () => {
    expect(getGymById('emerald', 'unknown')).toBeNull()
  })

  it('returns null for an unsupported game version', () => {
    expect(getGymById('firered', 'roxanne')).toBeNull()
  })
})

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
