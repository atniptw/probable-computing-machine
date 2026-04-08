import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'

import GymLeaderSelector from '../components/AppView/GymLeaderSelector'
import GymTeamPanel from '../components/AppView/GymTeamPanel'
import { type GymLeader } from '../data/gyms/emerald'

// ─── GymLeaderSelector ────────────────────────────────────────────────────────

describe('GymLeaderSelector', () => {
  const onSelect = vi.fn()

  afterEach(() => {
    cleanup()
    onSelect.mockClear()
  })

  it('renders all 8 gym leaders with names and type labels for Emerald', () => {
    render(
      <GymLeaderSelector
        gameVersion="emerald"
        selectedGymId={null}
        onSelect={onSelect}
      />,
    )
    expect(screen.getAllByRole('button')).toHaveLength(8)
    expect(screen.getByRole('button', { name: /Roxanne/i })).toBeTruthy()
    expect(screen.getByRole('button', { name: /Juan/i })).toBeTruthy()
    // Type labels are rendered inside the buttons
    expect(screen.getByText('Rock')).toBeTruthy()
    expect(screen.getByText('Water')).toBeTruthy()
  })

  it('calls onSelect with the correct gym ID when a leader is clicked', () => {
    render(
      <GymLeaderSelector
        gameVersion="emerald"
        selectedGymId={null}
        onSelect={onSelect}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: /Roxanne/i }))
    expect(onSelect).toHaveBeenCalledOnce()
    expect(onSelect).toHaveBeenCalledWith('roxanne')
  })

  it('marks only the selected gym button as aria-pressed', () => {
    render(
      <GymLeaderSelector
        gameVersion="emerald"
        selectedGymId="brawly"
        onSelect={onSelect}
      />,
    )
    const pressed = screen
      .getAllByRole('button')
      .filter((b) => b.getAttribute('aria-pressed') === 'true')
    expect(pressed).toHaveLength(1)
    expect(pressed[0]).toHaveProperty(
      'textContent',
      expect.stringContaining('Brawly'),
    )
  })

  it('renders the empty-state message for a game with no gym data', () => {
    render(
      <GymLeaderSelector
        gameVersion="firered"
        selectedGymId={null}
        onSelect={onSelect}
      />,
    )
    expect(
      screen.getByText('No gym data available for this game yet.'),
    ).toBeTruthy()
    expect(screen.queryAllByRole('button')).toHaveLength(0)
  })
})

// ─── GymTeamPanel ─────────────────────────────────────────────────────────────

const ROXANNE: GymLeader = {
  id: 'roxanne',
  name: 'Roxanne',
  badge: 1,
  badgeName: 'Stone Badge',
  city: 'Rustboro City',
  type: 'Rock',
  team: [
    { name: 'geodude', level: 14 },
    { name: 'nosepass', level: 15 },
  ],
}

describe('GymTeamPanel', () => {
  const onPokemonSelect = vi.fn()

  afterEach(() => {
    cleanup()
    onPokemonSelect.mockClear()
  })

  it('calls onPokemonSelect with the Pokémon name when a team button is clicked', () => {
    render(
      <GymTeamPanel
        gymLeader={ROXANNE}
        selectedOpponent=""
        onPokemonSelect={onPokemonSelect}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: /nosepass/i }))
    expect(onPokemonSelect).toHaveBeenCalledOnce()
    expect(onPokemonSelect).toHaveBeenCalledWith('nosepass')
  })
})
