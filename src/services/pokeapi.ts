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
  type PokeApiPokemonMoveEntry,
  type PokeApiPokemonResponse,
  type PokeApiTypeEntry,
  type Pokemon,
  type PokemonQueryOptions,
} from './pokeapiClient'

import {
  CACHE_PREFIX,
  CACHE_TTL_MS,
  getGameVersionContext,
} from './pokemonCache'

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

// --- getPokemonLearnset (internal) ---

const learnsetMemCache = new Map<string, PokeApiPokemonMoveEntry[]>()
const learnsetPromiseCache = new Map<
  string,
  Promise<PokeApiPokemonMoveEntry[]>
>()

interface CachedLearnset {
  moves: PokeApiPokemonMoveEntry[]
  expires: number
}

async function getPokemonLearnset(
  pokemonName: string,
): Promise<PokeApiPokemonMoveEntry[]> {
  const normalizedName = pokemonName.toLowerCase().trim()
  const cacheKey = `pkm_learnset_v1_${normalizedName}`

  if (learnsetMemCache.has(cacheKey)) return learnsetMemCache.get(cacheKey)!
  if (learnsetPromiseCache.has(cacheKey))
    return learnsetPromiseCache.get(cacheKey)!

  const cachedRaw = localStorage.getItem(cacheKey)
  if (cachedRaw) {
    try {
      const parsed = JSON.parse(cachedRaw) as CachedLearnset
      if (
        Array.isArray(parsed.moves) &&
        typeof parsed.expires === 'number' &&
        Date.now() < parsed.expires
      ) {
        learnsetMemCache.set(cacheKey, parsed.moves)
        return parsed.moves
      }
    } catch {
      /* ignore corrupt cache */
    }
  }

  // The learnset lives in the same /pokemon/{name} endpoint as types/sprites.
  // The browser HTTP cache typically serves this from memory on a second call.
  const request = (async () => {
    const res = await fetchWithRetry(
      `${BASE_URL}/pokemon/${encodeURIComponent(normalizedName)}`,
    )
    if (res.status === 404) throw new PokemonNotFoundError(pokemonName)
    if (!res.ok) throw new NetworkError()

    const json = (await res.json()) as PokeApiPokemonResponse
    const moves = json.moves ?? []

    const payload: CachedLearnset = {
      moves,
      expires: Date.now() + CACHE_TTL_MS,
    }
    localStorage.setItem(cacheKey, JSON.stringify(payload))
    learnsetMemCache.set(cacheKey, moves)
    return moves
  })()

  learnsetPromiseCache.set(cacheKey, request)
  try {
    return await request
  } finally {
    learnsetPromiseCache.delete(cacheKey)
  }
}

// --- getWildMoveset ---

export async function getWildMoveset(
  pokemonName: string,
  gameVersion: string,
  level?: number,
): Promise<string[]> {
  let versionGroup: string
  let moveEntries: PokeApiPokemonMoveEntry[]

  try {
    const [context, learnset] = await Promise.all([
      getGameVersionContext(gameVersion),
      getPokemonLearnset(pokemonName),
    ])
    versionGroup = context.versionGroup
    moveEntries = learnset
  } catch {
    return []
  }

  // Collect level-up moves for this version group with their highest level_learned_at
  const levelUpMoves: Array<{ name: string; levelAt: number }> = []
  for (const entry of moveEntries) {
    const vgLevelUpDetails = entry.version_group_details.filter(
      (d) =>
        d.move_learn_method.name === 'level-up' &&
        d.version_group.name === versionGroup,
    )
    if (vgLevelUpDetails.length === 0) continue
    const maxLevel = Math.max(
      ...vgLevelUpDetails.map((d) => d.level_learned_at),
    )
    levelUpMoves.push({ name: entry.move.name, levelAt: maxLevel })
  }

  if (levelUpMoves.length === 0) return []

  // Apply optional level cap
  const candidates =
    level != null
      ? levelUpMoves.filter((m) => m.levelAt <= level)
      : levelUpMoves

  if (candidates.length === 0) {
    // Fallback: level cap filtered everything — return all level-up moves sorted ascending
    return levelUpMoves
      .sort((a, b) => a.levelAt - b.levelAt)
      .slice(0, 4)
      .map((m) => m.name)
  }

  // Sort by level descending (most recently learned = active moveset), take up to 4
  return candidates
    .sort((a, b) => b.levelAt - a.levelAt)
    .slice(0, 4)
    .map((m) => m.name)
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
