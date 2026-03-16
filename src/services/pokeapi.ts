// --- Exported domain types ---

export interface Pokemon {
  name: string
  types: string[]
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
interface CachedPokemon {
  data: Pokemon
  expires: number
}

// --- Module-level cache ---

const typeMapCache = new Map<string, TypeRelations>()

const BASE_URL = 'https://pokeapi.co/api/v2'
const CACHE_PREFIX = 'pkm_v1_'
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000

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
  const key = CACHE_PREFIX + name.toLowerCase().trim()

  const cached = localStorage.getItem(key)
  if (cached) {
    const { data, expires } = JSON.parse(cached) as CachedPokemon
    if (Date.now() < expires) return data
    localStorage.removeItem(key)
  }

  const res = await fetchWithRetry(
    `${BASE_URL}/pokemon/${encodeURIComponent(name.toLowerCase().trim())}`,
  )

  if (res.status === 404) throw new PokemonNotFoundError(name)
  if (!res.ok) throw new NetworkError()

  const json = (await res.json()) as PokeApiPokemonResponse
  const data: Pokemon = {
    name: json.name,
    types: json.types.map((t) => t.type.name),
  }

  localStorage.setItem(key, JSON.stringify({ data, expires: Date.now() + CACHE_TTL_MS }))
  return data
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
