import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'

import { useMoveNameIndex } from '../hooks/useMoveNameIndex'
import { getMoveNameIndex } from '../services/pokeapi'

vi.mock('../services/pokeapi', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../services/pokeapi')>()
  return {
    ...actual,
    getMoveNameIndex: vi.fn(),
  }
})

type Params = Parameters<typeof useMoveNameIndex>[0]

function makeParams(overrides: Partial<Params> = {}): Params {
  return {
    onError: vi.fn(),
    ...overrides,
  }
}

describe('useMoveNameIndex', () => {
  beforeEach(() => {
    vi.mocked(getMoveNameIndex).mockResolvedValue([])
  })

  it('starts as not ready with an empty move index before the fetch settles', () => {
    const onError = vi.fn()
    vi.mocked(getMoveNameIndex).mockReturnValue(new Promise(() => {}))

    const { result } = renderHook(() =>
      useMoveNameIndex(makeParams({ onError })),
    )

    expect(result.current.moveNameIndexReady).toBe(false)
    expect(result.current.moveNameIndex).toEqual([])
  })

  it('exposes move names and marks ready after a successful fetch', async () => {
    const onError = vi.fn()
    vi.mocked(getMoveNameIndex).mockResolvedValue(['ice beam', 'surf'])

    const { result } = renderHook(() =>
      useMoveNameIndex(makeParams({ onError })),
    )

    await waitFor(() => expect(result.current.moveNameIndexReady).toBe(true))
    expect(result.current.moveNameIndex).toEqual(['ice beam', 'surf'])
  })

  it('reports a descriptive error and stays usable when move loading fails', async () => {
    const onError = vi.fn()
    vi.mocked(getMoveNameIndex).mockRejectedValue(new Error('network down'))

    const { result } = renderHook(() =>
      useMoveNameIndex(makeParams({ onError })),
    )

    await waitFor(() => expect(result.current.moveNameIndexReady).toBe(true))
    expect(result.current.moveNameIndex).toEqual([])
    expect(onError).toHaveBeenCalledWith(
      'Unable to load move autocomplete. You can still type moves manually.',
    )
  })
})
