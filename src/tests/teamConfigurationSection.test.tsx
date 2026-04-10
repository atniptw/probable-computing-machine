import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'

import TeamConfigurationSection from '../components/AppView/TeamConfigurationSection'

const onGameChange = vi.fn()
const onBack = vi.fn()

function renderSection(
  overrides: Partial<Parameters<typeof TeamConfigurationSection>[0]> = {},
) {
  const defaults = {
    selectedGameVersion: 'emerald',
    onGameChange,
    onBack,
  }
  render(<TeamConfigurationSection {...defaults} {...overrides} />)
}

describe('TeamConfigurationSection', () => {
  afterEach(() => {
    cleanup()
    onGameChange.mockReset()
    onBack.mockReset()
  })

  it('renders the section heading', () => {
    renderSection()
    expect(screen.getByText('Team configuration')).toBeInTheDocument()
  })

  it('renders the game version select with the provided value', () => {
    renderSection({ selectedGameVersion: 'emerald' })
    expect(screen.getByRole('combobox', { name: 'Game Version' })).toHaveValue(
      'emerald',
    )
  })

  it('calls onGameChange when the game version is changed', () => {
    renderSection()
    fireEvent.change(screen.getByRole('combobox', { name: 'Game Version' }), {
      target: { value: 'red' },
    })
    expect(onGameChange).toHaveBeenCalledOnce()
    expect(onGameChange).toHaveBeenCalledWith('red')
  })

  it('calls onBack when the Back button is clicked', () => {
    renderSection()
    fireEvent.click(screen.getByRole('button', { name: 'Back' }))
    expect(onBack).toHaveBeenCalledOnce()
  })
})
