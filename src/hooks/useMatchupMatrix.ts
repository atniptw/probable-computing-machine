import { useEffect, useMemo, useState } from 'react'

import {
  calcEffectiveness,
  getPokemon,
  getMoveType,
  getTypeMap,
  PokemonNotFoundError,
  RateLimitError,
  type Pokemon,
} from '../services/pokeapi'
import type { TeamMemberConfig } from './useTeamConfiguration'

interface MatchupMove {
  name: string
  multiplier: number
}

interface OffenseGroup {
  superEffective: MatchupMove[]
  neutral: MatchupMove[]
  notEffective: MatchupMove[]
}

interface DefenseGroup {
  dangerous: MatchupMove[]
  neutral: MatchupMove[]
  resisted: MatchupMove[]
}

interface MatchupSummary {
  offenseRating: number
  defenseRating: number
}

export interface MatchupViewModel {
  opponent: Pokemon
  player: Pokemon
  offense: OffenseGroup
  defense: DefenseGroup
  summary: MatchupSummary
}

interface UseMatchupMatrixParams {
  exactMatchFound: boolean
  gameLabel: string
  generation: number
  nameIndexReady: boolean
  normalizedOpponent: string
  onError: (message: string | null) => void
  opponentMoves?: string[]
  pokemonNameSet: Set<string>
  selectedTeamIndex: number
  teamMembers: TeamMemberConfig[]
  teamNames: string[]
}

interface MoveTemplate {
  name: string
  type: string
}

const OFFENSE_MOVES_BY_TYPE: Record<string, MoveTemplate[]> = {
  electric: [
    { name: 'Thunderbolt', type: 'electric' },
    { name: 'Spark', type: 'electric' },
  ],
  water: [
    { name: 'Surf', type: 'water' },
    { name: 'Hydro Pump', type: 'water' },
  ],
  fire: [
    { name: 'Flamethrower', type: 'fire' },
    { name: 'Fire Blast', type: 'fire' },
  ],
  grass: [
    { name: 'Giga Drain', type: 'grass' },
    { name: 'Leaf Blade', type: 'grass' },
  ],
  psychic: [
    { name: 'Psychic', type: 'psychic' },
    { name: 'Psybeam', type: 'psychic' },
  ],
  dragon: [
    { name: 'Dragon Claw', type: 'dragon' },
    { name: 'Twister', type: 'dragon' },
  ],
  ground: [
    { name: 'Earthquake', type: 'ground' },
    { name: 'Earth Power', type: 'ground' },
  ],
  flying: [
    { name: 'Aerial Ace', type: 'flying' },
    { name: 'Air Slash', type: 'flying' },
  ],
  fighting: [
    { name: 'Brick Break', type: 'fighting' },
    { name: 'Close Combat', type: 'fighting' },
  ],
  bug: [
    { name: 'X-Scissor', type: 'bug' },
    { name: 'Signal Beam', type: 'bug' },
  ],
  rock: [
    { name: 'Rock Slide', type: 'rock' },
    { name: 'Stone Edge', type: 'rock' },
  ],
  ice: [
    { name: 'Ice Beam', type: 'ice' },
    { name: 'Ice Punch', type: 'ice' },
  ],
  dark: [
    { name: 'Crunch', type: 'dark' },
    { name: 'Bite', type: 'dark' },
  ],
  steel: [
    { name: 'Iron Head', type: 'steel' },
    { name: 'Flash Cannon', type: 'steel' },
  ],
  ghost: [
    { name: 'Shadow Ball', type: 'ghost' },
    { name: 'Shadow Claw', type: 'ghost' },
  ],
  normal: [
    { name: 'Return', type: 'normal' },
    { name: 'Quick Attack', type: 'normal' },
  ],
  poison: [
    { name: 'Sludge Bomb', type: 'poison' },
    { name: 'Poison Jab', type: 'poison' },
  ],
  fairy: [
    { name: 'Moonblast', type: 'fairy' },
    { name: 'Dazzling Gleam', type: 'fairy' },
  ],
}

const COMMON_COVERAGE_THREATS: MoveTemplate[] = [
  { name: 'Earthquake', type: 'ground' },
  { name: 'Ice Beam', type: 'ice' },
]

function clampIndex(index: number, size: number): number {
  if (size <= 0) return 0
  if (index < 0) return 0
  if (index >= size) return size - 1
  return index
}

function buildOffenseMoves(
  types: string[],
  configuredMoves: MoveTemplate[],
): MoveTemplate[] {
  if (configuredMoves.length > 0) {
    return configuredMoves
  }

  const baseMoves = types.flatMap(
    (typeName) => OFFENSE_MOVES_BY_TYPE[typeName] ?? [],
  )
  if (!baseMoves.length) {
    return OFFENSE_MOVES_BY_TYPE.normal
  }
  return [...baseMoves, { name: 'Quick Attack', type: 'normal' }]
}

function formatMoveName(value: string): string {
  return value
    .trim()
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((segment) => segment[0].toUpperCase() + segment.slice(1).toLowerCase())
    .join(' ')
}

async function resolveConfiguredMoves(
  moveNames: string[],
): Promise<MoveTemplate[]> {
  const moveResults = await Promise.allSettled(
    moveNames.map(async (moveName) => ({
      name: formatMoveName(moveName),
      type: await getMoveType(moveName),
    })),
  )

  return moveResults
    .filter(
      (result): result is PromiseFulfilledResult<MoveTemplate> =>
        result.status === 'fulfilled',
    )
    .map((result) => result.value)
}

function buildDefenseMoves(opponentTypes: string[]): MoveTemplate[] {
  const typeMoves = opponentTypes.flatMap(
    (typeName) => OFFENSE_MOVES_BY_TYPE[typeName] ?? [],
  )

  const allMoves = [...typeMoves, ...COMMON_COVERAGE_THREATS]
  const seen = new Set<string>()

  return allMoves.filter((move) => {
    if (seen.has(move.name)) return false
    seen.add(move.name)
    return true
  })
}

function toGroupedOffense(moves: MatchupMove[]): OffenseGroup {
  return {
    superEffective: moves.filter((move) => move.multiplier >= 2),
    neutral: moves.filter((move) => move.multiplier === 1),
    notEffective: moves.filter((move) => move.multiplier < 1),
  }
}

function toGroupedDefense(threats: MatchupMove[]): DefenseGroup {
  return {
    dangerous: threats.filter((move) => move.multiplier > 1),
    neutral: threats.filter((move) => move.multiplier === 1),
    resisted: threats.filter((move) => move.multiplier < 1),
  }
}

function sortMovesByMultiplier(moves: MatchupMove[]): MatchupMove[] {
  return [...moves].sort((left, right) => {
    if (right.multiplier !== left.multiplier) {
      return right.multiplier - left.multiplier
    }
    return left.name.localeCompare(right.name)
  })
}

function offenseRating(offense: OffenseGroup): number {
  if (offense.superEffective.some((move) => move.multiplier >= 4)) return 4
  if (offense.superEffective.length >= 2) return 3
  if (offense.superEffective.length === 1) return 2
  return 1
}

function defenseRating(defense: DefenseGroup): number {
  if (defense.dangerous.length === 0 && defense.resisted.length >= 2) return 4
  if (defense.dangerous.length === 0) return 3
  if (defense.dangerous.length === 1) return 2
  return 1
}

export function useMatchupMatrix({
  exactMatchFound,
  gameLabel,
  generation,
  nameIndexReady,
  normalizedOpponent,
  onError,
  opponentMoves,
  pokemonNameSet,
  selectedTeamIndex,
  teamMembers,
  teamNames,
}: UseMatchupMatrixParams) {
  const [loading, setLoading] = useState(false)
  const [matchup, setMatchup] = useState<MatchupViewModel | null>(null)

  const selectedTeamMember = useMemo(() => {
    const nextIndex = clampIndex(selectedTeamIndex, teamNames.length)
    return teamMembers[nextIndex] ?? null
  }, [selectedTeamIndex, teamMembers, teamNames.length])

  const selectedTeamName = selectedTeamMember?.name ?? null

  useEffect(() => {
    if (!teamNames.length || !pokemonNameSet.size) {
      setMatchup(null)
      setLoading(false)
      return
    }

    const teamStillValid = teamMembers.every((member) =>
      pokemonNameSet.has(member.name),
    )
    if (!teamStillValid) {
      setMatchup(null)
      setLoading(false)
      onError(
        `Your saved team has Pokemon outside the ${gameLabel} Pokedex. Tap Edit Team to fix it.`,
      )
      return
    }

    if (!normalizedOpponent) {
      setMatchup(null)
      setLoading(false)
      onError(null)
      return
    }

    if (!nameIndexReady || !exactMatchFound || !selectedTeamName) {
      setMatchup(null)
      setLoading(false)
      onError(null)
      return
    }

    let cancelled = false

    async function run(): Promise<void> {
      setLoading(true)
      onError(null)

      try {
        const [typeMap, opponentPokemon, playerPokemon] = await Promise.all([
          getTypeMap({ generation }),
          getPokemon(normalizedOpponent, { generation }),
          getPokemon(selectedTeamName, { generation }),
        ])

        const [configuredMoves, resolvedOpponentMoves] = await Promise.all([
          selectedTeamMember
            ? resolveConfiguredMoves(selectedTeamMember.moves)
            : Promise.resolve([]),
          opponentMoves && opponentMoves.length > 0
            ? resolveConfiguredMoves(opponentMoves)
            : Promise.resolve([]),
        ])

        if (cancelled) return

        const defenseSourceMoves =
          resolvedOpponentMoves.length > 0
            ? resolvedOpponentMoves
            : buildDefenseMoves(opponentPokemon.types)

        const offenseMoves = sortMovesByMultiplier(
          buildOffenseMoves(playerPokemon.types, configuredMoves).map(
            (move) => ({
              name: move.name,
              multiplier: calcEffectiveness(
                [move.type],
                opponentPokemon.types,
                typeMap,
              ),
            }),
          ),
        )

        const defenseMoves = sortMovesByMultiplier(
          defenseSourceMoves.map((move) => ({
            name: move.name,
            multiplier: calcEffectiveness(
              [move.type],
              playerPokemon.types,
              typeMap,
            ),
          })),
        )

        const offense = toGroupedOffense(offenseMoves)
        const defense = toGroupedDefense(defenseMoves)

        setMatchup({
          opponent: opponentPokemon,
          player: playerPokemon,
          offense,
          defense,
          summary: {
            offenseRating: offenseRating(offense),
            defenseRating: defenseRating(defense),
          },
        })
      } catch (err) {
        if (cancelled) return

        setMatchup(null)

        if (err instanceof PokemonNotFoundError) {
          onError('Pokemon not found. Please select a valid name.')
        } else if (err instanceof RateLimitError) {
          onError('Rate limit reached. Please wait a moment and try again.')
        } else {
          onError('Network error. Please check your connection and try again.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void run()

    return () => {
      cancelled = true
    }
  }, [
    exactMatchFound,
    gameLabel,
    generation,
    nameIndexReady,
    normalizedOpponent,
    onError,
    opponentMoves,
    pokemonNameSet,
    selectedTeamMember,
    selectedTeamName,
    teamMembers,
    teamNames,
  ])

  return {
    loading,
    matchup,
  }
}
