import { describe, expect, it } from 'vitest'

import type { Pokemon, TypeRelations } from '../services/pokeapiClient'
import {
  analyzeTeamCoverage,
  type TeamCoverageMember,
} from '../services/teamCoverage'

function rel(
  doubleDamageTo: string[] = [],
  halfDamageTo: string[] = [],
  noDamageTo: string[] = [],
): TypeRelations {
  return { doubleDamageTo, halfDamageTo, noDamageTo }
}

function typeMap(
  entries: Record<string, TypeRelations>,
): Map<string, TypeRelations> {
  return new Map(Object.entries(entries))
}

function poke(types: string[]): Pokemon {
  return {
    name: 'mon',
    types,
    sprite: null,
    stats: {
      hp: 0,
      attack: 0,
      defense: 0,
      specialAttack: 0,
      specialDefense: 0,
      speed: 0,
    },
  }
}

function member(types: string[], movesTypes: string[]): TeamCoverageMember {
  return { pokemon: poke(types), movesTypes }
}

describe('analyzeTeamCoverage — offensive', () => {
  it('a grass move covers water, ground, and rock', () => {
    const map = typeMap({
      grass: rel(['water', 'ground', 'rock']),
      water: rel(),
      ground: rel(),
      rock: rel(),
    })
    const result = analyzeTeamCoverage([member(['grass'], ['grass'])], map)
    expect(result.offensiveCoverage).toEqual(['ground', 'rock', 'water'])
  })

  it('falls back to the Pokémon’s own types when no moves are configured', () => {
    const map = typeMap({ grass: rel(['water']), water: rel() })
    const result = analyzeTeamCoverage([member(['grass'], [])], map)
    expect(result.offensiveCoverage).toContain('water')
  })

  it('deduplicates a type covered by multiple members', () => {
    const map = typeMap({ grass: rel(['water']), water: rel() })
    const result = analyzeTeamCoverage(
      [member(['grass'], ['grass']), member(['grass'], ['grass'])],
      map,
    )
    expect(result.offensiveCoverage.filter((t) => t === 'water')).toHaveLength(
      1,
    )
  })

  it('Gen 1: Fairy and Steel are absent from coverage (not in the type map)', () => {
    const map = typeMap({ grass: rel(['water']), water: rel() })
    const result = analyzeTeamCoverage([member(['grass'], ['grass'])], map)
    expect(result.offensiveCoverage).not.toContain('fairy')
    expect(result.offensiveCoverage).not.toContain('steel')
  })

  it('Gen 6+: a Steel move covers Fairy', () => {
    const map = typeMap({
      steel: rel(['fairy', 'ice', 'rock']),
      fairy: rel(),
      ice: rel(),
      rock: rel(),
    })
    const result = analyzeTeamCoverage([member(['steel'], ['steel'])], map)
    expect(result.offensiveCoverage).toContain('fairy')
  })
})

describe('analyzeTeamCoverage — defensive', () => {
  it('flags a type that no member resists as a gap', () => {
    const map = typeMap({
      dragon: rel([], ['steel']), // only Steel resists Dragon
      fire: rel(),
      water: rel(),
      steel: rel(),
    })
    // Team has no Steel/Dragon/Fairy member → nobody resists Dragon.
    const result = analyzeTeamCoverage(
      [member(['fire'], ['fire']), member(['water'], ['water'])],
      map,
    )
    expect(result.defensiveGaps).toContain('dragon')
  })

  it('does not flag a type that a member resists', () => {
    const map = typeMap({
      dragon: rel([], ['steel']),
      steel: rel(),
    })
    const result = analyzeTeamCoverage([member(['steel'], ['steel'])], map)
    expect(result.defensiveGaps).not.toContain('dragon')
  })

  it('returns empty results for an empty team', () => {
    const map = typeMap({ dragon: rel(), steel: rel() })
    expect(analyzeTeamCoverage([], map)).toEqual({
      offensiveCoverage: [],
      defensiveGaps: [],
    })
  })
})
