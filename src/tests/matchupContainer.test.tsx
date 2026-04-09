import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'

import MatchupContainer from '../components/MatchupViewer/MatchupContainer'
import { useMatchupMatrix } from '../hooks/useMatchupMatrix'
import type { MatchupViewModel } from '../hooks/useMatchupMatrix'
import type { TeamMemberConfig } from '../hooks/useTeamConfiguration'

// ─── Mock useMatchupMatrix ────────────────────────────────────────────────────
// vi.mock is hoisted above all imports by Vitest, so the static import above
// receives the auto-mocked version at test runtime.

vi.mock('../hooks/useMatchupMatrix')

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const PLAYER_POKEMON = {
  name: 'swampert',
  types: ['water', 'ground'],
  sprite: null,
}
const OPPONENT_POKEMON = {
  name: 'manectric',
  types: ['electric'],
  sprite: null,
}

const FULL_MATCHUP: MatchupViewModel = {
  player: PLAYER_POKEMON,
  opponent: OPPONENT_POKEMON,
  offense: {
    superEffective: [{ name: 'Earthquake', multiplier: 2 }],
    neutral: [],
    notEffective: [],
  },
  defense: {
    dangerous: [],
    neutral: [],
    resisted: [{ name: 'Thunderbolt', multiplier: 0.25 }],
  },
  summary: { offenseRating: 2, defenseRating: 4 },
}

// ─── Shared callbacks / props ─────────────────────────────────────────────────

const onError = vi.fn()

const BASE_PROPS = {
  exactMatchFound: true,
  gameLabel: 'Emerald',
  generation: 3,
  nameIndexReady: true,
  normalizedOpponent: 'manectric',
  onError,
  opponentSuggestions: [] as string[],
  pokemonNameSet: new Set(['swampert', 'manectric']),
  teamMembers: [{ name: 'swampert', moves: [] }] as TeamMemberConfig[],
  teamNames: ['swampert'],
}

function renderContainer(
  overrides: Partial<typeof BASE_PROPS> = {},
  hookResult: { loading: boolean; matchup: MatchupViewModel | null } = {
    loading: false,
    matchup: null,
  },
) {
  vi.mocked(useMatchupMatrix).mockReturnValue(hookResult)
  render(<MatchupContainer {...BASE_PROPS} {...overrides} />)
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('MatchupContainer — render branches', () => {
  afterEach(() => {
    cleanup()
    onError.mockReset()
    vi.mocked(useMatchupMatrix).mockReset()
  })

  it('shows the empty-team prompt when teamNames is empty', () => {
    renderContainer({ teamNames: [], teamMembers: [] })
    expect(
      screen.getByText(
        'Add your team first, then choose an opponent to view matchup details.',
      ),
    ).toBeInTheDocument()
  })

  it('shows the no-opponent prompt when normalizedOpponent is empty', () => {
    renderContainer({ normalizedOpponent: '' })
    expect(
      screen.getByText(
        'Select an opponent to view offense and defense details.',
      ),
    ).toBeInTheDocument()
  })

  it('shows the loading prompt when nameIndexReady is false', () => {
    renderContainer({ nameIndexReady: false })
    expect(screen.getByText('Loading Pokédex...')).toBeInTheDocument()
  })

  it('shows the select-from-list prompt when exactMatchFound is false and suggestions exist', () => {
    renderContainer({
      exactMatchFound: false,
      opponentSuggestions: ['manectric', 'mankey'],
    })
    expect(
      screen.getByText(
        'Select a Pokémon from the list above to view matchup details.',
      ),
    ).toBeInTheDocument()
  })

  it('shows the no-results prompt when exactMatchFound is false and no suggestions', () => {
    renderContainer({ exactMatchFound: false, normalizedOpponent: 'zzz' })
    expect(
      screen.getByText('No Pokémon found for \u201cZzz\u201d.'),
    ).toBeInTheDocument()
  })

  it('shows the loading prompt when the hook is loading', () => {
    renderContainer({}, { loading: true, matchup: null })
    expect(screen.getByText('Loading matchup details...')).toBeInTheDocument()
  })

  it('renders the matchup heading and navigation when matchup is ready', () => {
    renderContainer({}, { loading: false, matchup: FULL_MATCHUP })
    expect(
      screen.getByRole('heading', { name: 'Swampert vs Manectric' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Previous team member' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Next team member' }),
    ).toBeInTheDocument()
  })

  it('renders the matchup viewer section when matchup is ready', () => {
    renderContainer({}, { loading: false, matchup: FULL_MATCHUP })
    expect(
      screen.getByRole('region', { name: 'Matchup viewer' }),
    ).toBeInTheDocument()
  })
})
