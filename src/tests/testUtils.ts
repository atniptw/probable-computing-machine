import type { MatchupViewModel } from '../hooks/useMatchupMatrix'
import type { TeamMemberConfig } from '../hooks/useTeamConfiguration'

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
    player: { name: 'pikachu', types: ['electric'], sprite: null },
    opponent: { name: 'geodude', types: ['rock', 'ground'], sprite: null },
    offense: { superEffective: [], neutral: [], notEffective: [] },
    defense: { dangerous: [], neutral: [], resisted: [] },
    summary: { offenseRating: 0, defenseRating: 0 },
    ...overrides,
  }
}
