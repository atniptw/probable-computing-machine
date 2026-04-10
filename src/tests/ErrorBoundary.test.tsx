import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'

import ErrorBoundary from '../components/ErrorBoundary'

afterEach(cleanup)

function Boom(): never {
  throw new Error('render crash')
}

describe('ErrorBoundary', () => {
  it('renders children normally when no error is thrown', () => {
    render(
      <ErrorBoundary>
        <p>All good</p>
      </ErrorBoundary>,
    )
    expect(screen.getByText('All good')).toBeDefined()
  })

  it('renders the fallback when a child throws during render', () => {
    // Suppress React's console.error for expected error boundary noise
    const spy = console.error
    console.error = () => {}
    try {
      render(
        <ErrorBoundary>
          <Boom />
        </ErrorBoundary>,
      )
    } finally {
      console.error = spy
    }

    expect(screen.getByText('Something went wrong.')).toBeDefined()
    expect(
      screen.getByText(
        'An unexpected error occurred while rendering this view.',
      ),
    ).toBeDefined()
    expect(screen.getByRole('button', { name: 'Try again' })).toBeDefined()
  })

  it('resets to children after clicking "Try again"', () => {
    let shouldThrow = true

    function MaybeThrow() {
      if (shouldThrow) throw new Error('render crash')
      return <p>Recovered</p>
    }

    const spy = console.error
    console.error = () => {}
    try {
      render(
        <ErrorBoundary>
          <MaybeThrow />
        </ErrorBoundary>,
      )
    } finally {
      console.error = spy
    }

    expect(screen.getByText('Something went wrong.')).toBeDefined()

    shouldThrow = false
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))

    expect(screen.getByText('Recovered')).toBeDefined()
  })
})
