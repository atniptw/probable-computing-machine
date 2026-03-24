import { useCallback, useMemo } from 'react'

interface UsePokemonSuggestionsParams {
  maxSuggestions: number
  pokemonNameIndex: string[]
}

export function usePokemonSuggestions({
  maxSuggestions,
  pokemonNameIndex,
}: UsePokemonSuggestionsParams) {
  const defaultSuggestions = useMemo(
    () => pokemonNameIndex.slice(0, maxSuggestions),
    [maxSuggestions, pokemonNameIndex],
  )

  const getSuggestions = useCallback(
    (query: string): string[] => {
      if (!pokemonNameIndex.length) return []

      const normalizedQuery = query.trim().toLowerCase()
      if (!normalizedQuery) return defaultSuggestions

      const prefixMatches: string[] = []
      const containsMatches: string[] = []

      for (const name of pokemonNameIndex) {
        if (name.startsWith(normalizedQuery)) {
          prefixMatches.push(name)
          continue
        }
        if (name.includes(normalizedQuery)) containsMatches.push(name)
      }

      return [...prefixMatches, ...containsMatches].slice(0, maxSuggestions)
    },
    [defaultSuggestions, maxSuggestions, pokemonNameIndex],
  )

  return {
    getSuggestions,
  }
}
