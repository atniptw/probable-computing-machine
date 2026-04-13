import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'

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
const PLAYER_POKEMON_WITH_SPRITE = {
  ...PLAYER_POKEMON,
  sprite: 'https://example.com/swampert.png',
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

const TWO_MEMBER_PROPS = {
  exactMatchFound: true,
  gameLabel: 'Emerald',
  generation: 3,
  nameIndexReady: true,
  normalizedOpponent: 'manectric',
  onError,
  opponentSuggestions: [] as string[],
  pokemonNameSet: new Set(['swampert', 'manectric', 'blaziken']),
  teamMembers: [
    { name: 'swampert', moves: [] },
    { name: 'blaziken', moves: [] },
  ] as TeamMemberConfig[],
  teamNames: ['swampert', 'blaziken'],
}

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
    expect(screen.getByText('Get started')).toBeInTheDocument()
    expect(screen.getByText('Tap', { exact: false })).toBeInTheDocument()
  })

  it('shows the no-opponent prompt when normalizedOpponent is empty', () => {
    renderContainer({ normalizedOpponent: '' })
    expect(screen.getByText('Choose an opponent')).toBeInTheDocument()
    expect(
      screen.getByText('Search by name above', { exact: false }),
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

  it('renders a sprite img when the pokemon has a sprite URL', () => {
    renderContainer(
      {},
      {
        loading: false,
        matchup: { ...FULL_MATCHUP, player: PLAYER_POKEMON_WITH_SPRITE },
      },
    )
    expect(
      screen.getByRole('img', { name: /swampert sprite/i }),
    ).toBeInTheDocument()
  })
})

describe('MatchupContainer — swipe gestures', () => {
  afterEach(() => {
    cleanup()
    onError.mockReset()
    vi.mocked(useMatchupMatrix).mockReset()
  })

  it('cycles to the next index on a left swipe exceeding the threshold', () => {
    vi.mocked(useMatchupMatrix).mockReturnValue({
      loading: false,
      matchup: FULL_MATCHUP,
    })
    render(<MatchupContainer {...TWO_MEMBER_PROPS} />)

    const section = screen.getByRole('region', { name: 'Matchup viewer' })
    // Left swipe: deltaX = 130 - 200 = -70 (> 40 threshold), deltaY = 5 (< |deltaX|)
    fireEvent.touchStart(section, {
      changedTouches: [{ clientX: 200, clientY: 50 }],
    })
    fireEvent.touchEnd(section, {
      changedTouches: [{ clientX: 130, clientY: 55 }],
    })

    // cycle(1) should fire: positiveModulo(0 + 1, 2) = 1
    const calls = vi.mocked(useMatchupMatrix).mock.calls
    expect(calls[calls.length - 1][0].selectedTeamIndex).toBe(1)
  })

  it('does not cycle on a vertical swipe (|deltaY| > |deltaX|)', () => {
    vi.mocked(useMatchupMatrix).mockReturnValue({
      loading: false,
      matchup: FULL_MATCHUP,
    })
    render(<MatchupContainer {...TWO_MEMBER_PROPS} />)

    const section = screen.getByRole('region', { name: 'Matchup viewer' })
    // Vertical swipe: deltaX = 55 (> threshold) but deltaY = 100 (> |deltaX|) → no cycle
    fireEvent.touchStart(section, {
      changedTouches: [{ clientX: 200, clientY: 50 }],
    })
    fireEvent.touchEnd(section, {
      changedTouches: [{ clientX: 255, clientY: 150 }],
    })

    const calls = vi.mocked(useMatchupMatrix).mock.calls
    expect(calls[calls.length - 1][0].selectedTeamIndex).toBe(0)
  })

  it('does not cycle on a horizontal swipe at or below the threshold', () => {
    vi.mocked(useMatchupMatrix).mockReturnValue({
      loading: false,
      matchup: FULL_MATCHUP,
    })
    render(<MatchupContainer {...TWO_MEMBER_PROPS} />)

    const section = screen.getByRole('region', { name: 'Matchup viewer' })
    // Sub-threshold swipe: deltaX = 160 - 200 = -40, which is not > 40
    fireEvent.touchStart(section, {
      changedTouches: [{ clientX: 200, clientY: 50 }],
    })
    fireEvent.touchEnd(section, {
      changedTouches: [{ clientX: 160, clientY: 52 }],
    })

    const calls = vi.mocked(useMatchupMatrix).mock.calls
    expect(calls[calls.length - 1][0].selectedTeamIndex).toBe(0)
  })
})
