import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

class MockStorage {
  private store = new Map<string, string>()

  getItem(key: string): string | null {
    return this.store.has(key) ? (this.store.get(key) ?? null) : null
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value)
  }

  removeItem(key: string): void {
    this.store.delete(key)
  }

  clear(): void {
    this.store.clear()
  }
}

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response
}

// Each test uses vi.resetModules() to flush the module-level move caches.
describe('getMoveDetail', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.unstubAllGlobals()
    vi.stubGlobal('localStorage', new MockStorage())
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('maps a physical move to its base power and damage class', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        jsonResponse({
          type: { name: 'normal' },
          power: 40,
          damage_class: { name: 'physical' },
        }),
      ),
    )
    const { getMoveDetail } = await import('../services/pokeapi')
    const detail = await getMoveDetail('tackle')
    expect(detail).toEqual({
      name: 'tackle',
      type: 'normal',
      basePower: 40,
      damageClass: 'physical',
    })
  })

  it('returns basePower null and damageClass status for a status move', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        jsonResponse({
          type: { name: 'normal' },
          power: null,
          damage_class: { name: 'status' },
        }),
      ),
    )
    const { getMoveDetail } = await import('../services/pokeapi')
    const detail = await getMoveDetail('growl')
    expect(detail.basePower).toBeNull()
    expect(detail.damageClass).toBe('status')
  })

  it('returns basePower null but keeps the damage class for a variable-power move', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        jsonResponse({
          type: { name: 'normal' },
          power: null,
          damage_class: { name: 'special' },
        }),
      ),
    )
    const { getMoveDetail } = await import('../services/pokeapi')
    const detail = await getMoveDetail('hidden-power')
    expect(detail.basePower).toBeNull()
    expect(detail.damageClass).toBe('special')
  })

  it('persists to localStorage and serves cache hits without a second fetch', async () => {
    const storage = new MockStorage()
    vi.stubGlobal('localStorage', storage)
    const fetchMock = vi.fn(async () =>
      jsonResponse({
        type: { name: 'water' },
        power: 90,
        damage_class: { name: 'special' },
      }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const { getMoveDetail } = await import('../services/pokeapi')
    await getMoveDetail('surf')
    expect(storage.getItem('move_v1_surf')).not.toBeNull()

    // Re-import to clear the in-memory map and prove the localStorage hit serves.
    vi.resetModules()
    vi.stubGlobal('localStorage', storage)
    vi.stubGlobal('fetch', fetchMock)
    const { getMoveDetail: getAgain } = await import('../services/pokeapi')
    const cached = await getAgain('surf')
    expect(cached.type).toBe('water')
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('re-fetches when the cached entry has expired', async () => {
    const storage = new MockStorage()
    storage.setItem(
      'move_v1_ember',
      JSON.stringify({
        data: {
          name: 'ember',
          type: 'fire',
          basePower: 40,
          damageClass: 'special',
        },
        expires: Date.now() - 1000,
      }),
    )
    vi.stubGlobal('localStorage', storage)
    const fetchMock = vi.fn(async () =>
      jsonResponse({
        type: { name: 'fire' },
        power: 40,
        damage_class: { name: 'special' },
      }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const { getMoveDetail } = await import('../services/pokeapi')
    await getMoveDetail('ember')
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})
