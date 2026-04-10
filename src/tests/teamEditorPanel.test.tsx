import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'

import TeamEditorPanel from '../components/AppView/TeamEditorPanel'

// ─── Shared callbacks ─────────────────────────────────────────────────────────

const getSuggestions = vi.fn(() => [] as string[])
const getMoveSuggestions = vi.fn(() => [] as string[])
const onSlotChange = vi.fn()
const onAddMove = vi.fn(() => true)
const onRemoveMove = vi.fn()
const onSlotFocus = vi.fn()
const onSlotBlur = vi.fn()
const onSuggestionSelect = vi.fn()

function resetMocks() {
  getSuggestions.mockReset().mockReturnValue([])
  getMoveSuggestions.mockReset().mockReturnValue([])
  onSlotChange.mockReset()
  onAddMove.mockReset().mockReturnValue(true)
  onRemoveMove.mockReset()
  onSlotFocus.mockReset()
  onSlotBlur.mockReset()
  onSuggestionSelect.mockReset()
}

function renderPanel(
  overrides: Partial<Parameters<typeof TeamEditorPanel>[0]> = {},
) {
  const defaults = {
    teamDraft: ['swampert', 'manectric'],
    teamMovesDraft: [[], []],
    teamSlotErrors: [null, null],
    teamMoveErrors: [null, null],
    activeTeamSlot: null,
    getSuggestions,
    getMoveSuggestions,
    onSlotChange,
    onAddMove,
    onRemoveMove,
    onSlotFocus,
    onSlotBlur,
    onSuggestionSelect,
  }
  render(<TeamEditorPanel {...defaults} {...overrides} />)
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('TeamEditorPanel', () => {
  afterEach(() => {
    cleanup()
    resetMocks()
  })

  it('renders a labeled input for each team slot', () => {
    renderPanel()
    expect(screen.getByLabelText('Team slot 1')).toBeInTheDocument()
    expect(screen.getByLabelText('Team slot 2')).toBeInTheDocument()
  })

  it('shows a slot error when teamSlotErrors has a value', () => {
    renderPanel({ teamSlotErrors: ['Not a valid Pokémon', null] })
    expect(screen.getByRole('alert')).toHaveTextContent('Not a valid Pokémon')
  })

  it('renders move chips for team members that already have moves', () => {
    renderPanel({ teamMovesDraft: [['surf', 'earthquake'], []] })
    expect(screen.getByText('Surf')).toBeInTheDocument()
    expect(screen.getByText('Earthquake')).toBeInTheDocument()
  })

  it('calls onRemoveMove with the correct slot and move index', () => {
    renderPanel({ teamMovesDraft: [['surf', 'earthquake'], []] })
    fireEvent.click(
      screen.getByRole('button', { name: 'Remove Surf from team slot 1' }),
    )
    expect(onRemoveMove).toHaveBeenCalledOnce()
    expect(onRemoveMove).toHaveBeenCalledWith(0, 0)
  })

  it('disables the move input and Add Move button when a slot already has 4 moves', () => {
    renderPanel({
      teamMovesDraft: [['surf', 'earthquake', 'ice-beam', 'toxic'], []],
    })
    expect(screen.getByLabelText('Add move for team slot 1')).toBeDisabled()
    expect(
      screen.getAllByRole('button', { name: 'Add Move' })[0],
    ).toBeDisabled()
  })

  it('calls onSlotChange when a slot input value changes', () => {
    renderPanel()
    fireEvent.change(screen.getByLabelText('Team slot 1'), {
      target: { value: 'flygon' },
    })
    expect(onSlotChange).toHaveBeenCalledOnce()
    expect(onSlotChange).toHaveBeenCalledWith(0, 'flygon')
  })
})
