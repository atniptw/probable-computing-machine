import { useEffect, useState } from 'react'

import { getTypeMap } from '../services/pokeapi'
import type { TypeRelations } from '../services/pokeapiClient'

/**
 * Load the generation-scoped type chart for use outside the battle view (e.g. the
 * team coverage panel). `getTypeMap` is cached, so this shares the same map the
 * matchup hook already fetched. Returns null until ready.
 */
export function useTypeMap(
  generation: number,
): Map<string, TypeRelations> | null {
  const [typeMap, setTypeMap] = useState<Map<string, TypeRelations> | null>(
    null,
  )

  useEffect(() => {
    let cancelled = false

    async function run(): Promise<void> {
      try {
        const result = await getTypeMap({ generation })
        if (!cancelled) setTypeMap(result)
      } catch {
        if (!cancelled) setTypeMap(null)
      }
    }

    void run()

    return () => {
      cancelled = true
    }
  }, [generation])

  return typeMap
}
