import { useEffect, useState } from 'react'

import { getMoveNameIndex } from '../services/pokeapi'

interface UseMoveNameIndexParams {
  onError: (message: string | null) => void
}

export function useMoveNameIndex({ onError }: UseMoveNameIndexParams) {
  const [moveNameIndex, setMoveNameIndex] = useState<string[]>([])
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false

    void getMoveNameIndex()
      .then((names) => {
        if (cancelled) return
        setMoveNameIndex(names)
        setReady(true)
      })
      .catch(() => {
        if (cancelled) return
        setMoveNameIndex([])
        setReady(true)
        onError(
          'Unable to load move autocomplete. You can still type moves manually.',
        )
      })

    return () => {
      cancelled = true
    }
  }, [onError])

  return {
    moveNameIndex,
    moveNameIndexReady: ready,
  }
}
