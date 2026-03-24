import { useEffect, useState } from 'react'

import {
  getPokemon,
  getTypeMap,
  PokemonNotFoundError,
  RateLimitError,
  type Pokemon,
} from '../services/pokeapi'
import {
  rankTeamAgainstOpponent,
  type RankedTeamBuckets,
} from '../services/ranking'

interface UseMatchupResultsParams {
  exactMatchFound: boolean
  gameLabel: string
  generation: number
  nameIndexReady: boolean
  normalizedOpponent: string
  onError: (message: string | null) => void
  pokemonNameSet: Set<string>
  screen: 'battle' | 'team'
  teamNames: string[]
}

function createEmptyRankedBuckets(): RankedTeamBuckets {
  return {
    best: [],
    good: [],
    neutral: [],
    risky: [],
  }
}

export function useMatchupResults({
  exactMatchFound,
  gameLabel,
  generation,
  nameIndexReady,
  normalizedOpponent,
  onError,
  pokemonNameSet,
  screen,
  teamNames,
}: UseMatchupResultsParams) {
  const [opponent, setOpponent] = useState<Pokemon | null>(null)
  const [rankedBuckets, setRankedBuckets] = useState<RankedTeamBuckets>(() =>
    createEmptyRankedBuckets(),
  )
  const [showOtherOptions, setShowOtherOptions] = useState(false)
  const [loading, setLoading] = useState(false)

  function resetResults(): void {
    setOpponent(null)
    setRankedBuckets(createEmptyRankedBuckets())
  }

  useEffect(() => {
    if (!pokemonNameSet.size || !teamNames.length) return

    const teamStillValid = teamNames.every((name) => pokemonNameSet.has(name))
    if (!teamStillValid) {
      resetResults()
      onError(
        `Your saved team has Pokémon outside the ${gameLabel} Pokédex. Tap Edit Team to fix it.`,
      )
    }
  }, [gameLabel, onError, pokemonNameSet, teamNames])

  useEffect(() => {
    if (screen !== 'battle') {
      setLoading(false)
      return
    }

    if (!normalizedOpponent) {
      resetResults()
      onError(null)
      return
    }

    if (!nameIndexReady) return

    if (!exactMatchFound) {
      resetResults()
      onError(null)
      return
    }

    if (!teamNames.length) {
      resetResults()
      onError(null)
      return
    }

    const invalidSavedTeam = teamNames.some((name) => !pokemonNameSet.has(name))
    if (invalidSavedTeam) {
      resetResults()
      onError(`Your saved team has Pokémon outside the ${gameLabel} Pokédex.`)
      return
    }

    let cancelled = false

    async function run(): Promise<void> {
      setLoading(true)
      onError(null)
      try {
        const [typeMap, opponentPokemon, teamPokemon] = await Promise.all([
          getTypeMap({ generation }),
          getPokemon(normalizedOpponent, { generation }),
          Promise.all(
            teamNames.map((name) => getPokemon(name, { generation })),
          ),
        ])

        if (cancelled) return

        const nextRanked = rankTeamAgainstOpponent(
          teamPokemon,
          opponentPokemon,
          typeMap,
        )

        setOpponent(opponentPokemon)
        setRankedBuckets(nextRanked)
        setShowOtherOptions(false)
      } catch (err) {
        if (cancelled) return
        if (err instanceof PokemonNotFoundError) {
          onError('Pokémon not found. Please select a valid name.')
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
    pokemonNameSet,
    screen,
    teamNames,
  ])

  return {
    loading,
    opponent,
    rankedBuckets,
    resetResults,
    setShowOtherOptions,
    showOtherOptions,
  }
}
