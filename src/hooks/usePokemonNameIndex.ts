import { useEffect, useState } from 'react'

import { getPokemonNameIndex, getTypeMap } from '../services/pokeapi'

interface UsePokemonNameIndexParams {
  generation: number
  label: string
  version: string
  onError: (message: string | null) => void
}

export function usePokemonNameIndex({
  generation,
  label,
  version,
  onError,
}: UsePokemonNameIndexParams) {
  const [pokemonNameIndex, setPokemonNameIndex] = useState<string[]>([])
  const [loadedVersion, setLoadedVersion] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    void getTypeMap({ generation }).catch(() => {
      // Warm generation-specific cache to keep matchup updates snappy.
    })

    void getPokemonNameIndex(version)
      .then((names) => {
        if (cancelled) return
        setPokemonNameIndex(names)
        setLoadedVersion(version)
      })
      .catch(() => {
        if (cancelled) return
        setPokemonNameIndex([])
        setLoadedVersion(version)
        onError(`Unable to load ${label} Pokédex index. Please try again.`)
      })

    return () => {
      cancelled = true
    }
  }, [generation, label, onError, version])

  const nameIndexReady = loadedVersion === version
  const currentNameIndex = nameIndexReady ? pokemonNameIndex : []

  return {
    nameIndexReady,
    pokemonNameIndex: currentNameIndex,
  }
}
