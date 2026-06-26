import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'

import TeamCoveragePanel from '../components/AppView/TeamCoveragePanel'
import type { TypeRelations } from '../services/pokeapiClient'

vi.mock('../hooks/useTeamCoverage', () => ({
  useTeamCoverage: vi.fn(() => ({
    coverage: {
      offensiveCoverage: ['water', 'fire'],
      defensiveGaps: ['dragon'],
    },
    loading: false,
  })),
}))

function rel(): TypeRelations {
  return { doubleDamageTo: [], halfDamageTo: [], noDamageTo: [] }
}

const typeMap = new Map<string, TypeRelations>([
  ['water', rel()],
  ['fire', rel()],
  ['grass', rel()],
  ['dragon', rel()],
])

function renderPanel() {
  render(
    <TeamCoveragePanel
      teamMembers={[{ name: 'swampert', moves: [] }]}
      generation={3}
      typeMap={typeMap}
      onError={() => {}}
    />,
  )
}

describe('TeamCoveragePanel', () => {
  afterEach(() => cleanup())

  it('is collapsed by default — only the toggle is shown', () => {
    renderPanel()
    expect(
      screen.getByRole('button', { name: /show team coverage/i }),
    ).toBeInTheDocument()
    expect(screen.queryByText(/Offensive coverage/i)).toBeNull()
  })

  it('reveals the coverage grids after clicking the toggle', () => {
    renderPanel()
    fireEvent.click(screen.getByRole('button', { name: /show team coverage/i }))
    expect(screen.getByText(/Offensive coverage/i)).toBeInTheDocument()
    expect(screen.getByText('Water')).toBeInTheDocument()
    expect(screen.getByText('Grass')).toBeInTheDocument()
  })

  it('marks defensive gap types with data-gap', () => {
    renderPanel()
    fireEvent.click(screen.getByRole('button', { name: /show team coverage/i }))
    const gaps = document.querySelectorAll('[data-gap="true"]')
    expect(gaps).toHaveLength(1)
    expect(gaps[0].textContent).toBe('Dragon')
  })

  it('renders nothing until the type map is ready', () => {
    const { container } = render(
      <TeamCoveragePanel
        teamMembers={[]}
        generation={3}
        typeMap={null}
        onError={() => {}}
      />,
    )
    expect(container.firstChild).toBeNull()
  })
})
