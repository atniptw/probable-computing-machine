import type { MatchupViewModel } from '../hooks/useMatchupMatrix'
import type { TeamMemberConfig } from '../hooks/useTeamConfiguration'
import type { Pokemon, PokemonStats } from '../services/pokeapiClient'

// ─── Shared stat fixture ───────────────────────────────────────────────────────
// Zero stats for tests that don't exercise the damage calculator.

export const TEST_STATS: PokemonStats = {
  hp: 0,
  attack: 0,
  defense: 0,
  specialAttack: 0,
  specialDefense: 0,
  speed: 0,
}

export function makePokemon(overrides: Partial<Pokemon> = {}): Pokemon {
  return {
    name: 'pikachu',
    types: ['electric'],
    sprite: null,
    stats: TEST_STATS,
    ...overrides,
  }
}

// ─── TeamMemberConfig factory ──────────────────────────────────────────────────

export function makeTeamMember(
  overrides: Partial<TeamMemberConfig> = {},
): TeamMemberConfig {
  return { name: 'pikachu', moves: [], ...overrides }
}

// ─── MatchupViewModel factory ──────────────────────────────────────────────────

export function makeMatchupViewModel(
  overrides: Partial<MatchupViewModel> = {},
): MatchupViewModel {
  return {
    player: {
      name: 'pikachu',
      types: ['electric'],
      sprite: null,
      stats: TEST_STATS,
    },
    opponent: {
      name: 'geodude',
      types: ['rock', 'ground'],
      sprite: null,
      stats: TEST_STATS,
    },
    offense: { superEffective: [], neutral: [], notEffective: [] },
    defense: { dangerous: [], neutral: [], resisted: [] },
    summary: { offenseRating: 0, defenseRating: 0 },
    ...overrides,
  }
}
