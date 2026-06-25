import { GEN1_SPECIAL_OVERRIDES } from '../data/gen1SpecialOverrides'
import type { DamageClass, MoveDetail, PokemonStats } from './pokeapiClient'

// Pure TypeScript. No React, no DOM, no localStorage — this is the V3 engine core.

export type GenerationGroup = 'gen1' | 'gen2to5' | 'gen6plus'

export interface DamageRange {
  min: number
  max: number
  critMin: number
  critMax: number
}

export interface MoveRecommendation {
  moveName: string
  moveType: string
  basePower: number | null
  damageClass: DamageClass
  effectiveness: number
  damageRange: DamageRange | null
}

export function getGenerationGroup(generation: number): GenerationGroup {
  if (generation <= 1) return 'gen1'
  if (generation <= 5) return 'gen2to5'
  return 'gen6plus'
}

interface RollSpec {
  minRoll: number
  maxRoll: number
  critMultiplier: number
}

function rollSpecFor(group: GenerationGroup): RollSpec {
  // Gen 6+ uses an 85–100/100 roll and a 1.5× crit; earlier gens use 217–255/255 and 2×.
  if (group === 'gen6plus') {
    return { minRoll: 85 / 100, maxRoll: 1, critMultiplier: 1.5 }
  }
  return { minRoll: 217 / 255, maxRoll: 1, critMultiplier: 2 }
}

// Gen 1 had a single Special stat. PokéAPI returns the modern split, so we use
// special-attack as the proxy, with gen1SpecialOverrides for confirmed exceptions.
function gen1Special(stats: PokemonStats, name: string): number {
  return GEN1_SPECIAL_OVERRIDES[name.toLowerCase()] ?? stats.specialAttack
}

/**
 * Compute the min/max (and crit) damage range for a single move.
 *
 * Returns null when the move can't produce a damage number:
 * - status move, or move.basePower is null (variable-power moves)
 * - attackerLevel or defenderLevel is null (level not set / opponent unknown)
 *
 * `effectiveness` is the type multiplier (0, 0.25, 0.5, 1, 2, 4) computed by
 * calcEffectiveness and passed in — damageCalc never re-derives the type chart.
 */
export function calcDamageRange(
  move: MoveDetail,
  attackerStats: PokemonStats,
  attackerName: string,
  attackerLevel: number | null,
  defenderStats: PokemonStats,
  defenderName: string,
  defenderLevel: number | null,
  effectiveness: number,
  generation: number,
): DamageRange | null {
  if (move.damageClass === 'status') return null
  if (move.basePower === null) return null
  if (attackerLevel === null || defenderLevel === null) return null

  const group = getGenerationGroup(generation)
  const isPhysical = move.damageClass === 'physical'

  let attack: number
  let defense: number
  if (isPhysical) {
    attack = attackerStats.attack
    defense = defenderStats.defense
  } else if (group === 'gen1') {
    // Gen 1 special moves use the single Special stat for both sides.
    attack = gen1Special(attackerStats, attackerName)
    defense = gen1Special(defenderStats, defenderName)
  } else {
    attack = attackerStats.specialAttack
    defense = defenderStats.specialDefense
  }

  const level = attackerLevel
  const basePower = move.basePower
  const safeDefense = defense > 0 ? defense : 1

  const baseDamage =
    Math.floor(
      Math.floor(
        (Math.floor((2 * level) / 5 + 2) * basePower * attack) / safeDefense,
      ) / 50,
    ) + 2

  const { minRoll, maxRoll, critMultiplier } = rollSpecFor(group)
  const min = Math.floor(baseDamage * effectiveness * minRoll)
  const max = Math.floor(baseDamage * effectiveness * maxRoll)

  return {
    min,
    max,
    critMin: Math.floor(min * critMultiplier),
    critMax: Math.floor(max * critMultiplier),
  }
}

// Lower tier sorts first. Known-damage moves beat variable/unknown-damage moves,
// which beat status moves.
function moveTier(rec: MoveRecommendation): number {
  if (rec.damageClass === 'status') return 2
  return rec.damageRange ? 0 : 1
}

/**
 * Rank an attacker's moves against a defender.
 *
 * Order: known damage floor desc → effectiveness desc → move name asc. Moves with
 * no computable damage (variable power, or levels missing) rank below known-damage
 * moves but above status moves; when levels are missing every damaging move falls
 * back to the effectiveness ordering.
 *
 * `typeMultipliers[i]` is the pre-computed effectiveness for `moves[i]`.
 */
export function rankMoves(
  moves: MoveDetail[],
  attackerStats: PokemonStats,
  attackerName: string,
  attackerLevel: number | null,
  defenderStats: PokemonStats,
  defenderName: string,
  defenderLevel: number | null,
  typeMultipliers: number[],
  generation: number,
): MoveRecommendation[] {
  const recommendations: MoveRecommendation[] = moves.map((move, index) => {
    const effectiveness = typeMultipliers[index] ?? 1
    return {
      moveName: move.name,
      moveType: move.type,
      basePower: move.basePower,
      damageClass: move.damageClass,
      effectiveness,
      damageRange: calcDamageRange(
        move,
        attackerStats,
        attackerName,
        attackerLevel,
        defenderStats,
        defenderName,
        defenderLevel,
        effectiveness,
        generation,
      ),
    }
  })

  return recommendations.sort((a, b) => {
    const tierDiff = moveTier(a) - moveTier(b)
    if (tierDiff !== 0) return tierDiff

    if (
      a.damageRange &&
      b.damageRange &&
      a.damageRange.min !== b.damageRange.min
    ) {
      return b.damageRange.min - a.damageRange.min
    }
    if (a.effectiveness !== b.effectiveness) {
      return b.effectiveness - a.effectiveness
    }
    return a.moveName.localeCompare(b.moveName)
  })
}
