import {
  calcEffectiveness,
  type Effectiveness,
  type Pokemon,
  type TypeRelations,
} from './pokeapi'

export interface RankedTeamEntry {
  pokemon: Pokemon
  attackMod: number
  defenseMod: number
  attackLabel: Effectiveness
  defenseLabel: Effectiveness
  reason: string
  priority: number
}

export interface RankedTeamBuckets {
  best: RankedTeamEntry[]
  good: RankedTeamEntry[]
  neutral: RankedTeamEntry[]
  risky: RankedTeamEntry[]
}

const typeEmojiMap: Record<string, string> = {
  normal: '⚪',
  fire: '🔥',
  water: '💧',
  electric: '⚡',
  grass: '🌿',
  ice: '❄️',
  fighting: '🥊',
  poison: '☠️',
  ground: '⛰️',
  flying: '🪽',
  psychic: '🧠',
  bug: '🪲',
  rock: '🪨',
  ghost: '👻',
  dragon: '🐉',
  dark: '🌑',
  steel: '⚙️',
  fairy: '✨',
}

function modifierLabel(modifier: number): Effectiveness {
  if (modifier >= 2) return '2x'
  if (modifier === 1) return '1x'
  if (modifier > 0) return '0.5x'
  return '0x'
}

function typePriority(defenseMod: number): number {
  if (defenseMod === 0) return 3
  if (defenseMod < 1) return 2
  if (defenseMod === 1) return 1
  return 0
}

function formatTypeName(typeName: string): string {
  return typeName.charAt(0).toUpperCase() + typeName.slice(1)
}

function typeBadge(typeName: string): string {
  return typeEmojiMap[typeName] ?? ''
}

export function getEffectivenessReason(
  defenseMod: number,
  attackerType: string,
): string {
  const formattedType = formatTypeName(attackerType)
  const emoji = typeBadge(attackerType)
  const typeToken = emoji ? `${formattedType} ${emoji}` : formattedType

  if (defenseMod === 0) return `Immune to ${typeToken}`
  if (defenseMod < 1) return `Resists ${typeToken}`
  if (defenseMod > 1) return `Weak to ${typeToken}`
  return `Neutral vs ${typeToken}`
}

export function rankTeamAgainstOpponent(
  team: Pokemon[],
  opponent: Pokemon,
  typeMap: Map<string, TypeRelations>,
): RankedTeamBuckets {
  const rankedEntries = team
    .map((pokemon): RankedTeamEntry => {
      const attackMod = calcEffectiveness(
        pokemon.types,
        opponent.types,
        typeMap,
      )
      const defenseMod = calcEffectiveness(
        opponent.types,
        pokemon.types,
        typeMap,
      )
      const priority = typePriority(defenseMod)
      return {
        pokemon,
        attackMod,
        defenseMod,
        attackLabel: modifierLabel(attackMod),
        defenseLabel: modifierLabel(defenseMod),
        reason: getEffectivenessReason(
          defenseMod,
          opponent.types[0] ?? 'normal',
        ),
        priority,
      }
    })
    .sort((left, right) => {
      if (right.priority !== left.priority)
        return right.priority - left.priority
      if (right.attackMod !== left.attackMod)
        return right.attackMod - left.attackMod
      if (left.defenseMod !== right.defenseMod)
        return left.defenseMod - right.defenseMod
      return left.pokemon.name.localeCompare(right.pokemon.name)
    })

  const buckets: RankedTeamBuckets = {
    best: [],
    good: [],
    neutral: [],
    risky: [],
  }

  if (!rankedEntries.length) return buckets

  buckets.best.push(rankedEntries[0])
  for (const entry of rankedEntries.slice(1)) {
    if (entry.priority >= 2) {
      buckets.good.push(entry)
      continue
    }
    if (entry.priority === 1) {
      buckets.neutral.push(entry)
      continue
    }
    buckets.risky.push(entry)
  }

  return buckets
}
