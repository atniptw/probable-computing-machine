# Component Design

## Runtime Component Tree

```
App
├── Header
│   └── EditTeamButton (battle screen only)
├── BattleSelectorSection (battle screen)
│   ├── GameVersionSelect
│   └── SuggestionList (opponent, conditional)
├── TeamConfigurationSection (team screen header)
│   └── GameVersionSelect
├── BattleResultsPanel (battle screen)
│   ├── PrimaryRecommendationCard
│   ├── ExpandableMatchupList
│   │   ├── Also Good
│   │   ├── Neutral
│   │   └── Risky
│   └── TeamPreviewBar
└── TeamEditorPanel (team screen body)
  ├── TeamSlotInput × 6
  ├── SuggestionList (team slot, conditional)
  └── SaveTeamButton
```

## App Contract

`App` is the runtime orchestrator and now delegates data loading and suggestion logic to dedicated hooks.

```ts
state: {
  selectedGameVersion: string,
  screen: 'battle' | 'team',
  teamDraft: string[6],
  teamSlotErrors: (string | null)[6],
  teamNames: string[],
  activeTeamSlot: number | null,
  opponentInput: string,
  opponent: Pokemon | null,
  rankedBuckets: {
    best: RankedTeamEntry[],
    good: RankedTeamEntry[],
    neutral: RankedTeamEntry[],
    risky: RankedTeamEntry[]
  },
  showOtherOptions: boolean,
  loading: boolean,
  error: string | null
}

hooks: {
  usePokemonNameIndex: {
    inputs: { version: string, generation: number },
    outputs: { pokemonNameIndex: string[], nameIndexReady: boolean }
  },
  useTeamPreview: {
    inputs: { generation: number, teamNames: string[] },
    outputs: { teamPreview: Pokemon[] }
  },
  usePokemonSuggestions: {
    inputs: { pokemonNameIndex: string[], maxSuggestions: number },
    outputs: { getSuggestions(query: string): string[] }
  },
  useMatchupResults: {
    inputs: {
      screen: 'battle' | 'team',
      normalizedOpponent: string,
      teamNames: string[],
      pokemonNameSet: Set<string>,
      generation: number,
      gameLabel: string
    },
    outputs: {
      opponent: Pokemon | null,
      rankedBuckets: RankedTeamBuckets,
      loading: boolean,
      showOtherOptions: boolean
    }
  }
}
```

## Primary Behaviors

- App opens directly on the battle screen for in-fight speed.
- App now delegates render concerns to `src/components/AppView/*` and data-loading/suggestion concerns to `src/hooks/*`.
- Game selector controls all autocomplete, validation, and matchup rules.
- Opponent and team inputs only accept Pokémon from the selected game's Pokédex.
- Opponent input uses local typeahead suggestions (button list), not datalist dropdown.
- Ranking is bucketed as `best`, `good`, `neutral`, `risky`; `best` always contains one primary recommendation.
- Secondary recommendations are collapsed by default behind “Show other options (X)”.
- Team editor validates each non-empty slot against the selected game index and allows duplicates or fewer than 6 entries.
- Type effectiveness map is generation-aware for key historical chart differences.

## Legacy Note

Legacy two-team components under `src/components/TeamInput` and `src/components/MatchupResults` are no longer part of the active runtime flow.
