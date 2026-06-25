import { useEffect, useState } from 'react'

import { getMoveDetail } from '../services/pokeapi'
import type { MoveDetail } from '../services/pokeapiClient'

/**
 * Fetch the detail (type, base power, damage class) for a single move. Reuses the
 * shared `getMoveDetail` cache, so repeated lookups for the same move are free.
 * Returns `{ detail: null, loading: false }` for a blank move name.
 */
export function useMoveDetail(moveName: string): {
  detail: MoveDetail | null
  loading: boolean
} {
  const [detail, setDetail] = useState<MoveDetail | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!moveName.trim()) {
      setDetail(null)
      setLoading(false)
      return
    }

    let cancelled = false

    async function run(): Promise<void> {
      setLoading(true)
      try {
        const result = await getMoveDetail(moveName)
        if (cancelled) return
        setDetail(result)
      } catch {
        if (cancelled) return
        setDetail(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void run()

    return () => {
      cancelled = true
    }
  }, [moveName])

  return { detail, loading }
}
