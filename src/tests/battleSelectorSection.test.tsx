import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'

import BattleSelectorSection from '../components/AppView/BattleSelectorSection'
import type { BattleMode } from '../App'

// ─── Shared callbacks ─────────────────────────────────────────────────────────

const onGameChange = vi.fn()
const onBattleModeChange = vi.fn()
const onGymSelect = vi.fn()
const onOpponentInputChange = vi.fn()
const onSuggestionSelect = vi.fn()

function resetMocks() {
  onGameChange.mockReset()
  onBattleModeChange.mockReset()
  onGymSelect.mockReset()
  onOpponentInputChange.mockReset()
  onSuggestionSelect.mockReset()
}

function renderSection(
  overrides: Partial<Parameters<typeof BattleSelectorSection>[0]> = {},
) {
  const defaults = {
    selectedGameVersion: 'emerald',
    onGameChange,
    battleMode: 'free' as BattleMode,
    onBattleModeChange,
    selectedGymId: null,
    onGymSelect,
    opponentInput: '',
    onOpponentInputChange,
    normalizedOpponent: '',
    exactMatchFound: false,
    opponentSuggestions: [],
    onSuggestionSelect,
  }
  render(<BattleSelectorSection {...defaults} {...overrides} />)
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('BattleSelectorSection — free battle mode', () => {
  afterEach(() => {
    cleanup()
    resetMocks()
  })

  it('renders the opponent input in free mode', () => {
    renderSection()
    expect(screen.getByLabelText('Opponent Pokemon')).toBeInTheDocument()
  })

  it('calls onBattleModeChange("gym") when Gym leader button is clicked', () => {
    renderSection()
    fireEvent.click(screen.getByRole('button', { name: 'Gym leader' }))
    expect(onBattleModeChange).toHaveBeenCalledOnce()
    expect(onBattleModeChange).toHaveBeenCalledWith('gym')
  })

  it('calls onBattleModeChange("free") when Free battle button is clicked', () => {
    renderSection({ battleMode: 'gym' })
    fireEvent.click(screen.getByRole('button', { name: 'Free battle' }))
    expect(onBattleModeChange).toHaveBeenCalledOnce()
    expect(onBattleModeChange).toHaveBeenCalledWith('free')
  })

  it('shows suggestion list when opponent typed, no exact match, suggestions present', () => {
    renderSection({
      normalizedOpponent: 'sala',
      exactMatchFound: false,
      opponentSuggestions: ['salamence', 'salazzle'],
    })
    expect(
      screen.getByRole('listbox', { name: 'Opponent suggestions' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Salamence' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Salazzle' })).toBeInTheDocument()
  })

  it('hides suggestion list when exactMatchFound is true', () => {
    renderSection({
      normalizedOpponent: 'salamence',
      exactMatchFound: true,
      opponentSuggestions: ['salamence'],
    })
    expect(
      screen.queryByRole('listbox', { name: 'Opponent suggestions' }),
    ).not.toBeInTheDocument()
  })

  it('hides suggestion list when normalizedOpponent is empty', () => {
    renderSection({
      normalizedOpponent: '',
      exactMatchFound: false,
      opponentSuggestions: ['salamence'],
    })
    expect(
      screen.queryByRole('listbox', { name: 'Opponent suggestions' }),
    ).not.toBeInTheDocument()
  })

  it('calls onSuggestionSelect when a suggestion button is clicked', () => {
    renderSection({
      normalizedOpponent: 'sala',
      exactMatchFound: false,
      opponentSuggestions: ['salamence'],
    })
    fireEvent.click(screen.getByRole('button', { name: 'Salamence' }))
    expect(onSuggestionSelect).toHaveBeenCalledOnce()
    expect(onSuggestionSelect).toHaveBeenCalledWith('salamence')
  })
})

describe('BattleSelectorSection — gym leader mode', () => {
  afterEach(() => {
    cleanup()
    resetMocks()
  })

  it('renders gym leader buttons instead of opponent input', () => {
    renderSection({ battleMode: 'gym' })
    expect(screen.queryByLabelText('Opponent Pokemon')).not.toBeInTheDocument()
    // GymLeaderSelector renders all 8 Emerald leaders
    expect(screen.getByRole('button', { name: /Roxanne/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Juan/i })).toBeInTheDocument()
  })

  it('renders GymTeamPanel when a gym is selected', () => {
    renderSection({ battleMode: 'gym', selectedGymId: 'roxanne' })
    // Roxanne's team has geodude (x2) and nosepass
    expect(
      screen.getByRole('button', { name: /nosepass/i }),
    ).toBeInTheDocument()
  })

  it('does not render GymTeamPanel when no gym is selected', () => {
    renderSection({ battleMode: 'gym', selectedGymId: null })
    expect(
      screen.queryByRole('button', { name: /nosepass/i }),
    ).not.toBeInTheDocument()
  })
})
