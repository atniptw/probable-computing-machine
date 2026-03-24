import { useEffect, useState } from 'react'

import { getPokemon, type Pokemon } from '../services/pokeapi'

interface UseTeamPreviewParams {
  generation: number
  teamNames: string[]
}

export function useTeamPreview({
  generation,
  teamNames,
}: UseTeamPreviewParams) {
  const [teamPreview, setTeamPreview] = useState<Pokemon[]>([])

  useEffect(() => {
    let cancelled = false

    async function loadTeamPreview(): Promise<void> {
      if (!teamNames.length) {
        setTeamPreview([])
        return
      }

      const results = await Promise.allSettled(
        teamNames.map((name) => getPokemon(name, { generation })),
      )
      if (cancelled) return

      const nextPreview = results
        .filter(
          (result): result is PromiseFulfilledResult<Pokemon> =>
            result.status === 'fulfilled',
        )
        .map((result) => result.value)

      setTeamPreview(nextPreview)
    }

    void loadTeamPreview()

    return () => {
      cancelled = true
    }
  }, [generation, teamNames])

  return { teamPreview }
}
