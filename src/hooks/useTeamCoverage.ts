import { useEffect, useState } from 'react'

import { getMoveDetail, getPokemon, RateLimitError } from '../services/pokeapi'
import type { MoveDetail, TypeRelations } from '../services/pokeapiClient'
import {
  analyzeTeamCoverage,
  type TeamCoverageMember,
  type TeamCoverageResult,
} from '../services/teamCoverage'
import type { TeamMemberConfig } from './useTeamConfiguration'

interface UseTeamCoverageParams {
  teamMembers: TeamMemberConfig[]
  generation: number
  // Generation-scoped type chart from getTypeMap; null until it's ready.
  typeMap: Map<string, TypeRelations> | null
  onError: (message: string | null) => void
}

/**
 * Resolve a team's offensive coverage and defensive gaps. Fetches each member's
 * Pokémon (stats/types) and move details — these reuse the same cache layer as
 * useMatchupMatrix, so opening the coverage panel costs no extra network calls if
 * the battle view already ran. Only runs when the type map is ready and at least
 * one member has a name.
 */
export function useTeamCoverage({
  teamMembers,
  generation,
  typeMap,
  onError,
}: UseTeamCoverageParams): {
  coverage: TeamCoverageResult | null
  loading: boolean
} {
  const [coverage, setCoverage] = useState<TeamCoverageResult | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const namedMembers = teamMembers.filter((member) => member.name.trim())
    if (!typeMap || namedMembers.length === 0) {
      setCoverage(null)
      setLoading(false)
      return
    }

    // typeMap is non-null here (guarded above); capture it so the async closure keeps the narrowing.
    const resolvedTypeMap = typeMap
    let cancelled = false

    async function run(): Promise<void> {
      setLoading(true)
      try {
        const members: TeamCoverageMember[] = await Promise.all(
          namedMembers.map(async (member) => {
            const [pokemon, moveResults] = await Promise.all([
              getPokemon(member.name, { generation }),
              Promise.allSettled(
                member.moves.map((moveName) => getMoveDetail(moveName)),
              ),
            ])
            const movesTypes = moveResults
              .filter(
                (result): result is PromiseFulfilledResult<MoveDetail> =>
                  result.status === 'fulfilled',
              )
              .map((result) => result.value.type)
            return { pokemon, movesTypes }
          }),
        )

        if (cancelled) return
        setCoverage(analyzeTeamCoverage(members, resolvedTypeMap))
        onError(null)
      } catch (err) {
        if (cancelled) return
        setCoverage(null)
        if (err instanceof RateLimitError) {
          onError('Rate limit reached. Please wait a moment and try again.')
        } else {
          onError('Could not load team coverage. Please try again.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void run()

    return () => {
      cancelled = true
    }
  }, [teamMembers, generation, typeMap, onError])

  return { coverage, loading }
}
