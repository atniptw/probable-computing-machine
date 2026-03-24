import { describe, expect, it } from 'vitest'
import { renderHook } from '@testing-library/react'
import { usePokemonSuggestions } from '../hooks/usePokemonSuggestions'

describe('usePokemonSuggestions', () => {
  describe('getSuggestions', () => {
    it('returns empty array when the name index is empty', () => {
      const { result } = renderHook(() =>
        usePokemonSuggestions({ maxSuggestions: 5, pokemonNameIndex: [] }),
      )
      expect(result.current.getSuggestions('pikachu')).toEqual([])
    })

    it('returns default slice when query is empty', () => {
      const index = [
        'bulbasaur',
        'ivysaur',
        'venusaur',
        'charmander',
        'charmeleon',
      ]
      const { result } = renderHook(() =>
        usePokemonSuggestions({ maxSuggestions: 3, pokemonNameIndex: index }),
      )
      expect(result.current.getSuggestions('')).toEqual([
        'bulbasaur',
        'ivysaur',
        'venusaur',
      ])
    })

    it('returns default slice when query is only whitespace', () => {
      const index = ['bulbasaur', 'ivysaur', 'venusaur', 'charmander']
      const { result } = renderHook(() =>
        usePokemonSuggestions({ maxSuggestions: 2, pokemonNameIndex: index }),
      )
      expect(result.current.getSuggestions('   ')).toEqual([
        'bulbasaur',
        'ivysaur',
      ])
    })

    it('returns prefix matches before contains matches', () => {
      const index = ['abra', 'kadabra', 'umbreon', 'breloom', 'absol']
      const { result } = renderHook(() =>
        usePokemonSuggestions({ maxSuggestions: 10, pokemonNameIndex: index }),
      )
      // prefix matches 'ab': ['abra', 'absol']
      // contains 'ab': ['kadabra']
      expect(result.current.getSuggestions('ab')).toEqual([
        'abra',
        'absol',
        'kadabra',
      ])
    })

    it('includes contains matches as a fallback when no prefix matches exist', () => {
      const index = ['pikachu', 'raichu', 'sandshrew']
      const { result } = renderHook(() =>
        usePokemonSuggestions({ maxSuggestions: 10, pokemonNameIndex: index }),
      )
      // no prefix match for 'chu', but 'pikachu' and 'raichu' contain it
      expect(result.current.getSuggestions('chu')).toEqual([
        'pikachu',
        'raichu',
      ])
    })

    it('enforces the maxSuggestions cap on combined results', () => {
      const index = ['aaa', 'aab', 'aac', 'aad', 'aae', 'xaay']
      const { result } = renderHook(() =>
        usePokemonSuggestions({ maxSuggestions: 3, pokemonNameIndex: index }),
      )
      // prefix matches 'aa': 5 entries; capped to 3
      expect(result.current.getSuggestions('aa')).toHaveLength(3)
    })

    it('normalises the query to lowercase before matching', () => {
      const index = ['pikachu', 'bulbasaur']
      const { result } = renderHook(() =>
        usePokemonSuggestions({ maxSuggestions: 5, pokemonNameIndex: index }),
      )
      expect(result.current.getSuggestions('PIK')).toEqual(['pikachu'])
    })

    it('returns no results when query does not match anything', () => {
      const index = ['pikachu', 'bulbasaur']
      const { result } = renderHook(() =>
        usePokemonSuggestions({ maxSuggestions: 5, pokemonNameIndex: index }),
      )
      expect(result.current.getSuggestions('zzz')).toEqual([])
    })
  })
})
