/** @type {Map<string, object>} Module-level type effectiveness cache (session lifetime) */
const typeMapCache = new Map()

const BASE_URL = 'https://pokeapi.co/api/v2'
const CACHE_PREFIX = 'pkm_v1_'
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

// --- Error types ---

export class PokemonNotFoundError extends Error {
  constructor(name) {
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

async function fetchWithRetry(url) {
  let res
  try {
    res = await fetch(url)
  } catch {
    throw new NetworkError()
  }

  if (res.status === 429) {
    await new Promise((r) => setTimeout(r, 1000))
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

/**
 * Fetch a Pokémon's name and types.
 * Checks localStorage first (7-day TTL), then falls back to PokéAPI.
 * @param {string} name
 * @returns {Promise<{name: string, types: string[]}>}
 */
export async function getPokemon(name) {
  const key = CACHE_PREFIX + name.toLowerCase().trim()

  const cached = localStorage.getItem(key)
  if (cached) {
    const { data, expires } = JSON.parse(cached)
    if (Date.now() < expires) return data
    localStorage.removeItem(key)
  }

  const res = await fetchWithRetry(`${BASE_URL}/pokemon/${encodeURIComponent(name.toLowerCase().trim())}`)

  if (res.status === 404) throw new PokemonNotFoundError(name)
  if (!res.ok) throw new NetworkError()

  const json = await res.json()
  const data = {
    name: json.name,
    types: json.types.map((t) => t.type.name),
  }

  localStorage.setItem(key, JSON.stringify({ data, expires: Date.now() + CACHE_TTL_MS }))
  return data
}

// --- getTypeMap ---

/**
 * Fetch and cache the full type effectiveness map for the session.
 * @returns {Promise<Map<string, {doubleDamageTo: string[], halfDamageTo: string[], noDamageTo: string[]}>>}
 */
export async function getTypeMap() {
  if (typeMapCache.size > 0) return typeMapCache

  const listRes = await fetchWithRetry(`${BASE_URL}/type?limit=100`)
  if (!listRes.ok) throw new NetworkError()
  const listJson = await listRes.json()

  const typeNames = listJson.results
    .map((t) => t.name)
    .filter((n) => n !== 'unknown' && n !== 'shadow')

  await Promise.all(
    typeNames.map(async (typeName) => {
      const res = await fetchWithRetry(`${BASE_URL}/type/${typeName}`)
      if (!res.ok) return
      const json = await res.json()
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

/**
 * Compute attack effectiveness modifier for an attacker's types vs a defender's types.
 * @param {string[]} attackerTypes
 * @param {string[]} defenderTypes
 * @param {Map} typeMap
 * @returns {number} modifier (0, 0.25, 0.5, 1, 2, 4)
 */
export function calcEffectiveness(attackerTypes, defenderTypes, typeMap) {
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

function modifierLabel(modifier) {
  if (modifier >= 2) return '2x'
  if (modifier === 1) return '1x'
  if (modifier > 0) return '0.5x'
  return '0x'
}

// --- computeMatchups ---

/**
 * Resolve all Pokémon, build TypeMap, return full matchup matrix.
 * @param {string[]} yourTeam   - non-empty name strings
 * @param {string[]} opponentTeam
 * @returns {Promise<{yourTeam: object[], opponentTeam: object[], matrix: object[], summary: object}>}
 */
export async function computeMatchups(yourTeam, opponentTeam) {
  const [typeMap, ...allPokemon] = await Promise.all([
    getTypeMap(),
    ...yourTeam.map(getPokemon),
    ...opponentTeam.map(getPokemon),
  ])

  const resolvedYours = allPokemon.slice(0, yourTeam.length)
  const resolvedOpponents = allPokemon.slice(yourTeam.length)

  const matrix = []
  for (const yours of resolvedYours) {
    for (const theirs of resolvedOpponents) {
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

  const summary = {
    superEffective: matrix.filter((e) => e.youVsThem === '2x').length,
    neutral: matrix.filter((e) => e.youVsThem === '1x').length,
    notVeryEffective: matrix.filter((e) => e.youVsThem === '0.5x' || e.youVsThem === '0x').length,
  }

  return { yourTeam: resolvedYours, opponentTeam: resolvedOpponents, matrix, summary }
}
