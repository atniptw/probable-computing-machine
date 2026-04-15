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

// --- Internal API response types ---

export interface PokeApiTypeEntry {
  slot: number
  type: { name: string }
}

export interface PokeApiPokemonResponse {
  name: string
  types: PokeApiTypeEntry[]
  past_types: {
    generation: { name: string }
    types: PokeApiTypeEntry[]
  }[]
  sprites: {
    front_default: string | null
  }
  moves: PokeApiPokemonMoveEntry[]
}

export interface PokeApiMoveResponse {
  type: { name: string }
}

export interface PokeApiMoveVersionDetail {
  level_learned_at: number
  move_learn_method: { name: string }
  version_group: { name: string }
}

export interface PokeApiPokemonMoveEntry {
  move: { name: string }
  version_group_details: PokeApiMoveVersionDetail[]
}

export interface PokeApiDamageRelations {
  double_damage_to: { name: string }[]
  half_damage_to: { name: string }[]
  no_damage_to: { name: string }[]
}

export interface PokeApiTypeResponse {
  damage_relations: PokeApiDamageRelations
}

export interface PokeApiTypeListResponse {
  results: { name: string; url: string }[]
}

export interface PokeApiPokemonListResponse {
  count: number
  results: { name: string; url: string }[]
}

export interface PokeApiMoveListResponse {
  count: number
  results: { name: string; url: string }[]
}

export interface PokeApiVersionResponse {
  name: string
  version_group: { name: string }
}

export interface PokeApiVersionGroupResponse {
  generation: { name: string }
  pokedexes: { name: string }[]
}

export interface PokeApiPokedexResponse {
  pokemon_entries: {
    pokemon_species: { name: string }
  }[]
}

// --- Shared constants ---

export const BASE_URL = 'https://pokeapi.co/api/v2'

export const generationNameMap: Record<string, number> = {
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

export async function fetchWithRetry(url: string): Promise<Response> {
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
