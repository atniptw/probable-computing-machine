# Component Design

## Runtime Component Tree

```
App
├── Header
│   └── EditTeamButton (battle screen only)
├── GameSelector
├── OpponentAutocompleteInput (battle screen)
├── PrimaryRecommendationCard (battle screen)
├── ExpandableMatchupList (battle screen)
│   ├── Also Good
│   ├── Neutral
│   └── Risky
├── TeamPreviewBar (battle screen)
└── Team Configuration Screen
    ├── TeamSlotInput × 6
    └── SaveTeamButton
```

## App Contract

`App` is the runtime orchestrator and owns all state.

```ts
state: {
  selectedGameVersion: string,
  screen: 'battle' | 'team',
  teamDraft: string[6],
  teamSlotErrors: (string | null)[6],
  teamNames: string[],
  teamPreview: Pokemon[],
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
  pokemonNameIndex: string[],
  nameIndexReady: boolean,
  loading: boolean,
  error: string | null
}
```

## Primary Behaviors

- App opens directly on the battle screen for in-fight speed.
- Game selector controls all autocomplete, validation, and matchup rules.
- Opponent and team inputs only accept Pokémon from the selected game's Pokédex.
- Opponent input uses local typeahead suggestions (button list), not datalist dropdown.
- Ranking is bucketed as `best`, `good`, `neutral`, `risky`; `best` always contains one primary recommendation.
- Secondary recommendations are collapsed by default behind “Show other options (X)”.
- Team editor validates each non-empty slot against the selected game index and allows duplicates or fewer than 6 entries.
- Type effectiveness map is generation-aware for key historical chart differences.

## Legacy Note

Legacy two-team components under `src/components/TeamInput` and `src/components/MatchupResults` are no longer part of the active runtime flow.
