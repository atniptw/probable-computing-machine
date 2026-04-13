// Re-export public API surface

export type {
  Pokemon,
  PokemonQueryOptions,
  TypeMapOptions,
  GameVersionContext,
  TypeRelations,
  Effectiveness,
  MatchupEntry,
  MatchupSummary,
  MatchupResult,
} from './pokeapiClient'

export {
  PokemonNotFoundError,
  RateLimitError,
  NetworkError,
} from './pokeapiClient'

export { getPokemonNameIndex, getMoveNameIndex } from './pokemonCache'

export { getTypeMap, calcEffectiveness } from './typechart'

// --- Imports for local implementation ---

import {
  BASE_URL,
  fetchWithRetry,
  generationNameMap,
  NetworkError,
  PokemonNotFoundError,
  type MatchupEntry,
  type MatchupResult,
  type MatchupSummary,
  type PokeApiMoveResponse,
  type PokeApiPokemonResponse,
  type PokeApiTypeEntry,
  type Pokemon,
  type PokemonQueryOptions,
} from './pokeapiClient'

import { CACHE_PREFIX, CACHE_TTL_MS } from './pokemonCache'

import { calcEffectiveness, getTypeMap, modifierLabel } from './typechart'

// --- Module-level caches for Pokemon and move-type requests ---

const pokemonRequestCache = new Map<string, Promise<Pokemon>>()
const moveTypeCache = new Map<string, string>()
const moveTypePromise = new Map<string, Promise<string>>()

// --- Internal cache type ---

interface CachedPokemon {
  data: Pokemon
  expires: number
}

// --- Pokemon normalization ---

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

// --- getPokemon ---

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

// --- getMoveType ---

function normalizeMoveName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, '-')
}

export async function getMoveType(moveName: string): Promise<string> {
  const normalizedName = normalizeMoveName(moveName)
  if (!normalizedName) throw new NetworkError()

  if (moveTypeCache.has(normalizedName)) {
    return moveTypeCache.get(normalizedName) as string
  }

  const inFlight = moveTypePromise.get(normalizedName)
  if (inFlight) return inFlight

  const request = (async () => {
    const res = await fetchWithRetry(
      `${BASE_URL}/move/${encodeURIComponent(normalizedName)}`,
    )

    if (!res.ok) throw new NetworkError()

    const json = (await res.json()) as PokeApiMoveResponse
    const typeName = json.type.name
    moveTypeCache.set(normalizedName, typeName)
    return typeName
  })()

  moveTypePromise.set(normalizedName, request)
  try {
    return await request
  } finally {
    moveTypePromise.delete(normalizedName)
  }
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
