import { describe, expect, it } from 'vitest'

import { GEN1_SPECIAL_OVERRIDES } from '../data/gen1SpecialOverrides'

describe('GEN1_SPECIAL_OVERRIDES', () => {
  it('maps gengar to its Gen 1 Special stat of 100', () => {
    expect(GEN1_SPECIAL_OVERRIDES['gengar']).toBe(100)
  })

  it('contains only positive integer values', () => {
    const values = Object.values(GEN1_SPECIAL_OVERRIDES)
    expect(values.length).toBeGreaterThan(0)
    for (const value of values) {
      expect(Number.isInteger(value)).toBe(true)
      expect(value).toBeGreaterThan(0)
    }
  })
})
