import type { Pokemon, TypeRelations } from './pokeapiClient'
import { calcEffectiveness } from './typechart'

// Pure TypeScript. No React, no DOM, no localStorage — part of the V3 engine core.

export interface TeamCoverageMember {
  pokemon: Pokemon
  movesTypes: string[] // type of each configured move; empty → fall back to pokemon.types
}

export interface TeamCoverageResult {
  offensiveCoverage: string[] // defending types at least one member hits ≥2×
  defensiveGaps: string[] // attacking types no member resists (all take ≥1×)
}

/**
 * Analyze a team's offensive coverage and defensive gaps against a generation's
 * type chart.
 *
 * The `typeMap` is already generation-scoped (built by `getTypeMap`), so the set
 * of types considered (`typeMap.keys()`) is automatically gen-correct — Fairy and
 * Steel simply don't exist in a Gen 1 map.
 */
export function analyzeTeamCoverage(
  team: TeamCoverageMember[],
  typeMap: Map<string, TypeRelations>,
): TeamCoverageResult {
  const allTypes = Array.from(typeMap.keys())

  // Offensive: a defending type is covered when some member's attacking type hits it ≥2×.
  const offensive = new Set<string>()
  for (const member of team) {
    const attackingTypes =
      member.movesTypes.length > 0 ? member.movesTypes : member.pokemon.types
    for (const atkType of attackingTypes) {
      for (const defType of allTypes) {
        if (calcEffectiveness([atkType], [defType], typeMap) >= 2) {
          offensive.add(defType)
        }
      }
    }
  }

  // Defensive gaps: attacking types that no member resists (every member takes ≥1×).
  const defensiveGaps: string[] = []
  if (team.length > 0) {
    for (const atkType of allTypes) {
      const resistedBySomeone = team.some(
        (member) =>
          calcEffectiveness([atkType], member.pokemon.types, typeMap) < 1,
      )
      if (!resistedBySomeone) defensiveGaps.push(atkType)
    }
  }

  return {
    offensiveCoverage: Array.from(offensive).sort(),
    defensiveGaps: defensiveGaps.sort(),
  }
}
