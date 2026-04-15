import {
  BASE_URL,
  fetchWithRetry,
  generationNameMap,
  NetworkError,
  type GameVersionContext,
  type PokeApiMoveListResponse,
  type PokeApiPokedexResponse,
  type PokeApiPokemonListResponse,
  type PokeApiVersionGroupResponse,
  type PokeApiVersionResponse,
} from './pokeapiClient'

export const CACHE_PREFIX = 'pkm_v2_'
export const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000
export const NAME_INDEX_CACHE_KEY = 'pkm_names_v2_all'
export const MOVE_INDEX_CACHE_KEY = 'pkm_moves_v1_all'
const NAME_INDEX_LIMIT = 100000
const MOVE_INDEX_LIMIT = 100000

interface CachedPokemonNameIndex {
  names: string[]
  expires: number
}

const pokemonNameIndexCache = new Map<string, string[]>()
const pokemonNameIndexPromise = new Map<string, Promise<string[]>>()
const moveNameIndexCache = new Map<string, string[]>()
const moveNameIndexPromise = new Map<string, Promise<string[]>>()
const gameContextCache = new Map<string, GameVersionContext>()
const gameContextPromise = new Map<string, Promise<GameVersionContext>>()

async function fetchPokemonNameIndexFromApi(): Promise<string[]> {
  const countRes = await fetchWithRetry(`${BASE_URL}/pokemon?limit=1`)
  if (!countRes.ok) throw new NetworkError()
  const countJson = (await countRes.json()) as PokeApiPokemonListResponse

  const safeLimit = Math.max(
    1,
    Math.min(countJson.count || 1, NAME_INDEX_LIMIT),
  )

  const listRes = await fetchWithRetry(`${BASE_URL}/pokemon?limit=${safeLimit}`)
  if (!listRes.ok) throw new NetworkError()

  const listJson = (await listRes.json()) as PokeApiPokemonListResponse
  return listJson.results
    .map((entry) => entry.name.toLowerCase())
    .filter(Boolean)
}

async function fetchMoveNameIndexFromApi(): Promise<string[]> {
  const countRes = await fetchWithRetry(`${BASE_URL}/move?limit=1`)
  if (!countRes.ok) throw new NetworkError()
  const countJson = (await countRes.json()) as PokeApiMoveListResponse

  const safeLimit = Math.max(
    1,
    Math.min(countJson.count || 1, MOVE_INDEX_LIMIT),
  )

  const listRes = await fetchWithRetry(`${BASE_URL}/move?limit=${safeLimit}`)
  if (!listRes.ok) throw new NetworkError()

  const listJson = (await listRes.json()) as PokeApiMoveListResponse
  return listJson.results
    .map((entry) => entry.name.toLowerCase().replace(/-/g, ' '))
    .filter(Boolean)
}

export async function getGameVersionContext(
  version: string,
): Promise<GameVersionContext> {
  if (gameContextCache.has(version)) {
    return gameContextCache.get(version) as GameVersionContext
  }

  const inFlight = gameContextPromise.get(version)
  if (inFlight) return inFlight

  const request = (async () => {
    const versionRes = await fetchWithRetry(
      `${BASE_URL}/version/${encodeURIComponent(version)}`,
    )
    if (!versionRes.ok) throw new NetworkError()
    const versionJson = (await versionRes.json()) as PokeApiVersionResponse

    const versionGroupRes = await fetchWithRetry(
      `${BASE_URL}/version-group/${versionJson.version_group.name}`,
    )
    if (!versionGroupRes.ok) throw new NetworkError()
    const versionGroupJson =
      (await versionGroupRes.json()) as PokeApiVersionGroupResponse

    const generation =
      generationNameMap[versionGroupJson.generation.name] ?? null
    const pokedex = versionGroupJson.pokedexes[0]?.name

    if (!generation || !pokedex) {
      throw new NetworkError()
    }

    const context: GameVersionContext = {
      version,
      versionGroup: versionJson.version_group.name,
      generation,
      pokedex,
    }

    gameContextCache.set(version, context)
    return context
  })()

  gameContextPromise.set(version, request)
  try {
    return await request
  } finally {
    gameContextPromise.delete(version)
  }
}

async function fetchPokemonNameIndexForVersion(
  version: string,
): Promise<string[]> {
  const context = await getGameVersionContext(version)
  const pokedexRes = await fetchWithRetry(
    `${BASE_URL}/pokedex/${context.pokedex}`,
  )
  if (!pokedexRes.ok) throw new NetworkError()

  const pokedexJson = (await pokedexRes.json()) as PokeApiPokedexResponse
  return pokedexJson.pokemon_entries
    .map((entry) => entry.pokemon_species.name.toLowerCase())
    .filter(Boolean)
}

export async function getPokemonNameIndex(version?: string): Promise<string[]> {
  const cacheKey = version ? `pkm_names_v2_${version}` : NAME_INDEX_CACHE_KEY

  if (pokemonNameIndexCache.has(cacheKey)) {
    return pokemonNameIndexCache.get(cacheKey) as string[]
  }
  if (pokemonNameIndexPromise.has(cacheKey)) {
    return pokemonNameIndexPromise.get(cacheKey) as Promise<string[]>
  }

  const cachedRaw = localStorage.getItem(cacheKey)
  let cached: CachedPokemonNameIndex | null = null

  if (cachedRaw) {
    try {
      cached = JSON.parse(cachedRaw) as CachedPokemonNameIndex
      if (!Array.isArray(cached.names) || typeof cached.expires !== 'number') {
        cached = null
      }
    } catch {
      cached = null
    }
  }

  if (cached && Date.now() < cached.expires) {
    pokemonNameIndexCache.set(cacheKey, cached.names)
    return cached.names
  }

  const request = (async () => {
    try {
      const names = version
        ? await fetchPokemonNameIndexForVersion(version)
        : await fetchPokemonNameIndexFromApi()

      const payload: CachedPokemonNameIndex = {
        names,
        expires: Date.now() + CACHE_TTL_MS,
      }

      localStorage.setItem(cacheKey, JSON.stringify(payload))
      pokemonNameIndexCache.set(cacheKey, names)
      return names
    } catch (error) {
      if (cached && cached.names.length > 0) {
        pokemonNameIndexCache.set(cacheKey, cached.names)
        return cached.names
      }
      throw error
    }
  })()

  pokemonNameIndexPromise.set(cacheKey, request)
  try {
    return await request
  } finally {
    pokemonNameIndexPromise.delete(cacheKey)
  }
}

export async function getMoveNameIndex(): Promise<string[]> {
  if (moveNameIndexCache.has(MOVE_INDEX_CACHE_KEY)) {
    return moveNameIndexCache.get(MOVE_INDEX_CACHE_KEY) as string[]
  }

  if (moveNameIndexPromise.has(MOVE_INDEX_CACHE_KEY)) {
    return moveNameIndexPromise.get(MOVE_INDEX_CACHE_KEY) as Promise<string[]>
  }

  const cachedRaw = localStorage.getItem(MOVE_INDEX_CACHE_KEY)
  let cached: CachedPokemonNameIndex | null = null

  if (cachedRaw) {
    try {
      cached = JSON.parse(cachedRaw) as CachedPokemonNameIndex
      if (!Array.isArray(cached.names) || typeof cached.expires !== 'number') {
        cached = null
      }
    } catch {
      cached = null
    }
  }

  if (cached && Date.now() < cached.expires) {
    moveNameIndexCache.set(MOVE_INDEX_CACHE_KEY, cached.names)
    return cached.names
  }

  const request = (async () => {
    try {
      const names = await fetchMoveNameIndexFromApi()
      const payload: CachedPokemonNameIndex = {
        names,
        expires: Date.now() + CACHE_TTL_MS,
      }

      localStorage.setItem(MOVE_INDEX_CACHE_KEY, JSON.stringify(payload))
      moveNameIndexCache.set(MOVE_INDEX_CACHE_KEY, names)
      return names
    } catch (error) {
      if (cached && cached.names.length > 0) {
        moveNameIndexCache.set(MOVE_INDEX_CACHE_KEY, cached.names)
        return cached.names
      }
      throw error
    }
  })()

  moveNameIndexPromise.set(MOVE_INDEX_CACHE_KEY, request)
  try {
    return await request
  } finally {
    moveNameIndexPromise.delete(MOVE_INDEX_CACHE_KEY)
  }
}
