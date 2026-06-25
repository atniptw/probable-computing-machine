import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'

import MoveDetailBadges from '../components/AppView/MoveDetailBadges'
import { getMoveDetail } from '../services/pokeapi'
import type { MoveDetail } from '../services/pokeapiClient'

vi.mock('../services/pokeapi', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../services/pokeapi')>()
  return { ...actual, getMoveDetail: vi.fn() }
})

function detail(overrides: Partial<MoveDetail> = {}): MoveDetail {
  return {
    name: 'surf',
    type: 'water',
    basePower: 90,
    damageClass: 'special',
    ...overrides,
  }
}

describe('MoveDetailBadges', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  it('renders type badge, damage class chip, and base power for a damaging move', async () => {
    vi.mocked(getMoveDetail).mockResolvedValue(detail())
    render(<MoveDetailBadges moveName="surf" />)

    await waitFor(() => expect(screen.getByText('Water')).toBeInTheDocument())
    expect(screen.getByText('Special')).toBeInTheDocument()
    expect(screen.getByText('90 BP')).toBeInTheDocument()
  })

  it('omits base power for a status move', async () => {
    vi.mocked(getMoveDetail).mockResolvedValue(
      detail({
        name: 'growl',
        type: 'normal',
        basePower: null,
        damageClass: 'status',
      }),
    )
    render(<MoveDetailBadges moveName="growl" />)

    await waitFor(() => expect(screen.getByText('Status')).toBeInTheDocument())
    expect(screen.queryByText(/BP/)).toBeNull()
  })

  it('shows a loading skeleton until the detail resolves', () => {
    vi.mocked(getMoveDetail).mockReturnValue(new Promise<MoveDetail>(() => {}))
    render(<MoveDetailBadges moveName="surf" />)

    expect(
      screen.getByLabelText('Loading details for surf'),
    ).toBeInTheDocument()
  })
})
