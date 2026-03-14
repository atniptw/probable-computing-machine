// --- Exported domain types ---

export interface Pokemon {
  name: string
  types: string[]
  sprite: string | null
}

export interface TypeRelations {
  doubleDamageTo: string[]
  halfDamageTo: string[]
  noDamageTo: string[]
}

export type Effectiveness = '2x' | '1x' | '0.5x' | '0x'

export interface MatchupEntry {
  yours: Pokemon
  theirs: Pokemon
  youVsThem: Effectiveness
  themVsYou: Effectiveness
}

export interface MatchupSummary {
  superEffective: number
  neutral: number
  notVeryEffective: number
}

export interface MatchupResult {
  yourTeam: Pokemon[]
  opponentTeam: Pokemon[]
  matrix: MatchupEntry[]
  summary: MatchupSummary
}

// --- Internal types ---

interface PokeApiTypeEntry {
  slot: number
  type: { name: string }
}
interface PokeApiPokemonResponse {
  name: string
  types: PokeApiTypeEntry[]
  sprites: {
    front_default: string | null
  }
}
interface PokeApiDamageRelations {
  double_damage_to: { name: string }[]
  half_damage_to: { name: string }[]
  no_damage_to: { name: string }[]
}
interface PokeApiTypeResponse {
  damage_relations: PokeApiDamageRelations
}
interface PokeApiTypeListResponse {
  results: { name: string; url: string }[]
}
interface PokeApiPokemonListResponse {
  count: number
  results: { name: string; url: string }[]
}
interface CachedPokemon {
  data: Pokemon
  expires: number
}
interface CachedPokemonNameIndex {
  names: string[]
  expires: number
}

// --- Module-level cache ---

const typeMapCache = new Map<string, TypeRelations>()

const BASE_URL = 'https://pokeapi.co/api/v2'
const CACHE_PREFIX = 'pkm_v1_'
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000
const NAME_INDEX_CACHE_KEY = 'pkm_names_v1'
const NAME_INDEX_LIMIT = 100000

let pokemonNameIndexCache: string[] | null = null
let pokemonNameIndexPromise: Promise<string[]> | null = null
const pokemonRequestCache = new Map<string, Promise<Pokemon>>()

// --- Error types ---

export class PokemonNotFoundError extends Error {
  pokemonName: string
  constructor(name: string) {
    super(`Pokémon not found: "${name}"`)
    this.name = 'PokemonNotFoundError'
    this.pokemonName = name
  }
}

export class RateLimitError extends Error {
  constructor() {
    super('Rate limit reached. Please try again shortly.')
    this.name = 'RateLimitError'
  }
}

export class NetworkError extends Error {
  constructor() {
    super('Network error. Please check your connection.')
    this.name = 'NetworkError'
  }
}

// --- Fetch helper with 429 retry ---

async function fetchWithRetry(url: string): Promise<Response> {
  let res: Response
  try {
    res = await fetch(url)
  } catch {
    throw new NetworkError()
  }

  if (res.status === 429) {
    await new Promise<void>((r) => setTimeout(r, 1000))
    try {
      res = await fetch(url)
    } catch {
      throw new NetworkError()
    }
    if (res.status === 429) throw new RateLimitError()
  }

  return res
}

// --- getPokemon ---

export async function getPokemon(name: string): Promise<Pokemon> {
  const normalizedName = name.toLowerCase().trim()
  const key = CACHE_PREFIX + normalizedName

  const cached = localStorage.getItem(key)
  if (cached) {
    const { data, expires } = JSON.parse(cached) as CachedPokemon
    if (Date.now() < expires) return data
    localStorage.removeItem(key)
  }

  const inFlight = pokemonRequestCache.get(key)
  if (inFlight) return inFlight

  const request = (async () => {
    const res = await fetchWithRetry(
      `${BASE_URL}/pokemon/${encodeURIComponent(normalizedName)}`,
    )

    if (res.status === 404) throw new PokemonNotFoundError(name)
    if (!res.ok) throw new NetworkError()

    const json = (await res.json()) as PokeApiPokemonResponse
    const data: Pokemon = {
      name: json.name,
      types: json.types.map((t) => t.type.name),
      sprite: json.sprites.front_default,
    }

    localStorage.setItem(key, JSON.stringify({ data, expires: Date.now() + CACHE_TTL_MS }))
    return data
  })()

  pokemonRequestCache.set(key, request)
  try {
    return await request
  } finally {
    pokemonRequestCache.delete(key)
  }
}

// --- getPokemonNameIndex ---

async function fetchPokemonNameIndexFromApi(): Promise<string[]> {
  const countRes = await fetchWithRetry(`${BASE_URL}/pokemon?limit=1`)
  if (!countRes.ok) throw new NetworkError()
  const countJson = (await countRes.json()) as PokeApiPokemonListResponse

  const safeLimit = Math.max(1, Math.min(countJson.count || 1, NAME_INDEX_LIMIT))

  const listRes = await fetchWithRetry(`${BASE_URL}/pokemon?limit=${safeLimit}`)
  if (!listRes.ok) throw new NetworkError()

  const listJson = (await listRes.json()) as PokeApiPokemonListResponse
  return listJson.results.map((entry) => entry.name.toLowerCase()).filter(Boolean)
}

export async function getPokemonNameIndex(): Promise<string[]> {
  if (pokemonNameIndexCache) return pokemonNameIndexCache
  if (pokemonNameIndexPromise) return pokemonNameIndexPromise

  const cachedRaw = localStorage.getItem(NAME_INDEX_CACHE_KEY)
  let cached: CachedPokemonNameIndex | null = null

  if (cachedRaw) {
    try {
      cached = JSON.parse(cachedRaw) as CachedPokemonNameIndex
      if (
        !Array.isArray(cached.names)
        || typeof cached.expires !== 'number'
      ) {
        cached = null
      }
    } catch {
      cached = null
    }
  }

  if (cached && Date.now() < cached.expires) {
    pokemonNameIndexCache = cached.names
    return cached.names
  }

  pokemonNameIndexPromise = (async () => {
    try {
      const names = await fetchPokemonNameIndexFromApi()

      const payload: CachedPokemonNameIndex = {
        names,
        expires: Date.now() + CACHE_TTL_MS,
      }

      localStorage.setItem(NAME_INDEX_CACHE_KEY, JSON.stringify(payload))
      pokemonNameIndexCache = names
      return names
    } catch (error) {
      if (cached && cached.names.length > 0) {
        pokemonNameIndexCache = cached.names
        return cached.names
      }
      throw error
    } finally {
      pokemonNameIndexPromise = null
    }
  })()

  return pokemonNameIndexPromise
}

// --- getTypeMap ---

export async function getTypeMap(): Promise<Map<string, TypeRelations>> {
  if (typeMapCache.size > 0) return typeMapCache

  const listRes = await fetchWithRetry(`${BASE_URL}/type?limit=100`)
  if (!listRes.ok) throw new NetworkError()
  const listJson = (await listRes.json()) as PokeApiTypeListResponse

  const typeNames = listJson.results
    .map((t) => t.name)
    .filter((n) => n !== 'unknown' && n !== 'shadow')

  await Promise.all(
    typeNames.map(async (typeName) => {
      const res = await fetchWithRetry(`${BASE_URL}/type/${typeName}`)
      if (!res.ok) return
      const json = (await res.json()) as PokeApiTypeResponse
      const dr = json.damage_relations
      typeMapCache.set(typeName, {
        doubleDamageTo: dr.double_damage_to.map((t) => t.name),
        halfDamageTo: dr.half_damage_to.map((t) => t.name),
        noDamageTo: dr.no_damage_to.map((t) => t.name),
      })
    }),
  )

  return typeMapCache
}

// --- calcEffectiveness (exported for unit tests) ---

export function calcEffectiveness(
  attackerTypes: string[],
  defenderTypes: string[],
  typeMap: Map<string, TypeRelations>,
): number {
  let modifier = 1
  for (const atkType of attackerTypes) {
    const relations = typeMap.get(atkType)
    if (!relations) continue
    for (const defType of defenderTypes) {
      if (relations.doubleDamageTo.includes(defType)) modifier *= 2
      else if (relations.halfDamageTo.includes(defType)) modifier *= 0.5
      else if (relations.noDamageTo.includes(defType)) modifier *= 0
    }
  }
  return modifier
}

function modifierLabel(modifier: number): Effectiveness {
  if (modifier >= 2) return '2x'
  if (modifier === 1) return '1x'
  if (modifier > 0) return '0.5x'
  return '0x'
}

// --- computeMatchups ---

export async function computeMatchups(
  yourTeam: string[],
  opponentTeam: string[],
): Promise<MatchupResult> {
  const [typeMap, yourPokemon, theirPokemon] = await Promise.all([
    getTypeMap(),
    Promise.all(yourTeam.map(getPokemon)),
    Promise.all(opponentTeam.map(getPokemon)),
  ])

  const matrix: MatchupEntry[] = []
  for (const yours of yourPokemon) {
    for (const theirs of theirPokemon) {
      const youVsThemMod = calcEffectiveness(yours.types, theirs.types, typeMap)
      const themVsYouMod = calcEffectiveness(theirs.types, yours.types, typeMap)
      matrix.push({
        yours,
        theirs,
        youVsThem: modifierLabel(youVsThemMod),
        themVsYou: modifierLabel(themVsYouMod),
      })
    }
  }

  const summary: MatchupSummary = {
    superEffective: matrix.filter((e) => e.youVsThem === '2x').length,
    neutral: matrix.filter((e) => e.youVsThem === '1x').length,
    notVeryEffective: matrix.filter((e) => e.youVsThem === '0.5x' || e.youVsThem === '0x').length,
  }

  return { yourTeam: yourPokemon, opponentTeam: theirPokemon, matrix, summary }
}
