// --- Exported domain types ---

export interface Pokemon {
  name: string
  types: string[]
  sprite: string | null
}

export interface PokemonQueryOptions {
  generation?: number
}

export interface TypeMapOptions {
  generation?: number
}

export interface GameVersionContext {
  version: string
  versionGroup: string
  generation: number
  pokedex: string
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
  past_types: {
    generation: { name: string }
    types: PokeApiTypeEntry[]
  }[]
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
interface PokeApiVersionResponse {
  name: string
  version_group: { name: string }
}
interface PokeApiVersionGroupResponse {
  generation: { name: string }
  pokedexes: { name: string }[]
}
interface PokeApiPokedexResponse {
  pokemon_entries: {
    pokemon_species: { name: string }
  }[]
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

const typeMapCache = new Map<number, Map<string, TypeRelations>>()

const BASE_URL = 'https://pokeapi.co/api/v2'
const CACHE_PREFIX = 'pkm_v2_'
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000
const NAME_INDEX_CACHE_KEY = 'pkm_names_v2_all'
const NAME_INDEX_LIMIT = 100000

const pokemonNameIndexCache = new Map<string, string[]>()
const pokemonNameIndexPromise = new Map<string, Promise<string[]>>()
const pokemonRequestCache = new Map<string, Promise<Pokemon>>()
const gameContextCache = new Map<string, GameVersionContext>()
const gameContextPromise = new Map<string, Promise<GameVersionContext>>()

const generationNameMap: Record<string, number> = {
  'generation-i': 1,
  'generation-ii': 2,
  'generation-iii': 3,
  'generation-iv': 4,
  'generation-v': 5,
  'generation-vi': 6,
  'generation-vii': 7,
  'generation-viii': 8,
  'generation-ix': 9,
}

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

function normalizePokemonTypes(entries: PokeApiTypeEntry[]): string[] {
  return [...entries]
    .sort((left, right) => left.slot - right.slot)
    .map((entry) => entry.type.name)
}

function generationFromName(name: string): number | null {
  return generationNameMap[name] ?? null
}

function resolveTypesForGeneration(
  json: PokeApiPokemonResponse,
  generation?: number,
): string[] {
  if (!generation || !json.past_types.length) {
    return normalizePokemonTypes(json.types)
  }

  const candidate = json.past_types
    .map((entry) => ({
      generation: generationFromName(entry.generation.name),
      types: entry.types,
    }))
    .filter(
      (entry): entry is { generation: number; types: PokeApiTypeEntry[] } =>
        entry.generation !== null,
    )
    .filter((entry) => generation <= entry.generation)
    .sort((left, right) => left.generation - right.generation)[0]

  if (!candidate) return normalizePokemonTypes(json.types)
  return normalizePokemonTypes(candidate.types)
}

export async function getPokemon(
  name: string,
  options?: PokemonQueryOptions,
): Promise<Pokemon> {
  const normalizedName = name.toLowerCase().trim()
  const generationKey = options?.generation ?? 0
  const key = `${CACHE_PREFIX}${normalizedName}_g${generationKey}`

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
      types: resolveTypesForGeneration(json, options?.generation),
      sprite: json.sprites.front_default,
    }

    localStorage.setItem(
      key,
      JSON.stringify({ data, expires: Date.now() + CACHE_TTL_MS }),
    )
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

async function getGameVersionContext(
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

    const generation = generationFromName(versionGroupJson.generation.name)
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

// --- getTypeMap ---

function cloneTypeMap(
  source: Map<string, TypeRelations>,
): Map<string, TypeRelations> {
  return new Map(
    [...source.entries()].map(([typeName, relations]) => [
      typeName,
      {
        doubleDamageTo: [...relations.doubleDamageTo],
        halfDamageTo: [...relations.halfDamageTo],
        noDamageTo: [...relations.noDamageTo],
      },
    ]),
  )
}

function removeType(map: Map<string, TypeRelations>, typeName: string): void {
  map.delete(typeName)
  for (const relations of map.values()) {
    relations.doubleDamageTo = relations.doubleDamageTo.filter(
      (name) => name !== typeName,
    )
    relations.halfDamageTo = relations.halfDamageTo.filter(
      (name) => name !== typeName,
    )
    relations.noDamageTo = relations.noDamageTo.filter(
      (name) => name !== typeName,
    )
  }
}

function ensureHalfDamageTo(
  map: Map<string, TypeRelations>,
  attackerType: string,
  defenderType: string,
): void {
  const relations = map.get(attackerType)
  if (!relations) return
  if (!relations.halfDamageTo.includes(defenderType)) {
    relations.halfDamageTo.push(defenderType)
  }
  relations.doubleDamageTo = relations.doubleDamageTo.filter(
    (name) => name !== defenderType,
  )
  relations.noDamageTo = relations.noDamageTo.filter(
    (name) => name !== defenderType,
  )
}

function ensureNoDamageTo(
  map: Map<string, TypeRelations>,
  attackerType: string,
  defenderType: string,
): void {
  const relations = map.get(attackerType)
  if (!relations) return
  if (!relations.noDamageTo.includes(defenderType)) {
    relations.noDamageTo.push(defenderType)
  }
  relations.doubleDamageTo = relations.doubleDamageTo.filter(
    (name) => name !== defenderType,
  )
  relations.halfDamageTo = relations.halfDamageTo.filter(
    (name) => name !== defenderType,
  )
}

function applyGenerationTypeRules(
  map: Map<string, TypeRelations>,
  generation: number,
): void {
  if (generation < 6) {
    removeType(map, 'fairy')
    ensureHalfDamageTo(map, 'ghost', 'steel')
    ensureHalfDamageTo(map, 'dark', 'steel')
  }

  if (generation < 2) {
    removeType(map, 'dark')
    removeType(map, 'steel')
    ensureNoDamageTo(map, 'ghost', 'psychic')

    const iceRelations = map.get('ice')
    if (iceRelations) {
      iceRelations.halfDamageTo = iceRelations.halfDamageTo.filter(
        (type) => type !== 'fire',
      )
    }
  }
}

async function buildBaseTypeMap(): Promise<Map<string, TypeRelations>> {
  const listRes = await fetchWithRetry(`${BASE_URL}/type?limit=100`)
  if (!listRes.ok) throw new NetworkError()
  const listJson = (await listRes.json()) as PokeApiTypeListResponse

  const typeNames = listJson.results
    .map((t) => t.name)
    .filter((n) => n !== 'unknown' && n !== 'shadow')

  const baseMap = new Map<string, TypeRelations>()

  await Promise.all(
    typeNames.map(async (typeName) => {
      const res = await fetchWithRetry(`${BASE_URL}/type/${typeName}`)
      if (!res.ok) return
      const json = (await res.json()) as PokeApiTypeResponse
      const dr = json.damage_relations
      baseMap.set(typeName, {
        doubleDamageTo: dr.double_damage_to.map((t) => t.name),
        halfDamageTo: dr.half_damage_to.map((t) => t.name),
        noDamageTo: dr.no_damage_to.map((t) => t.name),
      })
    }),
  )

  return baseMap
}

export async function getTypeMap(
  options?: TypeMapOptions,
): Promise<Map<string, TypeRelations>> {
  const generation = options?.generation ?? 9

  const cached = typeMapCache.get(generation)
  if (cached) return cached

  const baseTypeMap = typeMapCache.get(9) ?? (await buildBaseTypeMap())
  if (!typeMapCache.has(9)) {
    typeMapCache.set(9, baseTypeMap)
  }

  const generationTypeMap = cloneTypeMap(baseTypeMap)
  applyGenerationTypeRules(generationTypeMap, generation)
  typeMapCache.set(generation, generationTypeMap)

  return generationTypeMap
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
  options?: PokemonQueryOptions,
): Promise<MatchupResult> {
  const [typeMap, yourPokemon, theirPokemon] = await Promise.all([
    getTypeMap({ generation: options?.generation }),
    Promise.all(yourTeam.map((name) => getPokemon(name, options))),
    Promise.all(opponentTeam.map((name) => getPokemon(name, options))),
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
    notVeryEffective: matrix.filter(
      (e) => e.youVsThem === '0.5x' || e.youVsThem === '0x',
    ).length,
  }

  return { yourTeam: yourPokemon, opponentTeam: theirPokemon, matrix, summary }
}
