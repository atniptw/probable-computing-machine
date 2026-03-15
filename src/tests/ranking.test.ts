import { describe, expect, it } from 'vitest'
import { getEffectivenessReason, rankTeamAgainstOpponent } from '../services/ranking'
import type { Pokemon, TypeRelations } from '../services/pokeapi'

function buildTypeMap(entries: [string, Partial<TypeRelations>][]): Map<string, TypeRelations> {
  const map = new Map<string, TypeRelations>()
  for (const [typeName, relations] of entries) {
    map.set(typeName, {
      doubleDamageTo: relations.doubleDamageTo ?? [],
      halfDamageTo: relations.halfDamageTo ?? [],
      noDamageTo: relations.noDamageTo ?? [],
    })
  }
  return map
}

function pokemon(name: string, types: string[]): Pokemon {
  return {
    name,
    types,
    sprite: null,
  }
}

const typeMap = buildTypeMap([
  ['electric', { doubleDamageTo: ['water', 'flying'], halfDamageTo: ['electric', 'grass', 'dragon'], noDamageTo: ['ground'] }],
  ['ground', { doubleDamageTo: ['electric'], halfDamageTo: ['grass'], noDamageTo: ['flying'] }],
  ['grass', { doubleDamageTo: ['water', 'ground'], halfDamageTo: ['fire', 'grass'], noDamageTo: [] }],
  ['water', { doubleDamageTo: ['ground', 'fire'], halfDamageTo: ['water', 'grass'], noDamageTo: [] }],
])

describe('getEffectivenessReason', () => {
  it('returns immunity reason', () => {
    expect(getEffectivenessReason(0, 'electric')).toBe('Immune to Electric ⚡')
  })

  it('returns resist reason', () => {
    expect(getEffectivenessReason(0.5, 'electric')).toBe('Resists Electric ⚡')
  })

  it('returns weakness reason', () => {
    expect(getEffectivenessReason(2, 'water')).toBe('Weak to Water 💧')
  })

  it('returns neutral reason', () => {
    expect(getEffectivenessReason(1, 'grass')).toBe('Neutral vs Grass 🌿')
  })
})

describe('rankTeamAgainstOpponent', () => {
  it('promotes exactly one best recommendation and buckets the rest', () => {
    const team = [
      pokemon('swampert', ['water', 'ground']),
      pokemon('manectric', ['electric']),
      pokemon('charizard', ['fire']),
      pokemon('lanturn', ['water']),
    ]

    const opponent = pokemon('pikachu', ['electric'])

    const ranked = rankTeamAgainstOpponent(team, opponent, typeMap)

    expect(ranked.best).toHaveLength(1)
    expect(ranked.best[0]?.pokemon.name).toBe('swampert')
    expect(ranked.good.map((entry) => entry.pokemon.name)).toEqual(['manectric'])
    expect(ranked.neutral.map((entry) => entry.pokemon.name)).toEqual(['charizard'])
    expect(ranked.risky.map((entry) => entry.pokemon.name)).toEqual(['lanturn'])
  })

  it('uses defense risk as tie-breaker when priority and attack match', () => {
    const team = [
      pokemon('manectric', ['electric']),
      pokemon('ampharos', ['electric', 'dragon']),
    ]

    const opponent = pokemon('raichu', ['electric'])

    const ranked = rankTeamAgainstOpponent(team, opponent, typeMap)

    expect(ranked.best[0]?.pokemon.name).toBe('ampharos')
    expect(ranked.good[0]?.pokemon.name).toBe('manectric')
  })
})
