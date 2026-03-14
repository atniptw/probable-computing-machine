# Component Design

## Runtime Component Tree

```
App
├── Header
├── ConfigureTeamSection (mode = "configure")
│   ├── Team slot input × 6
│   └── Save Team button
└── MatchupsSection (mode = "matchups")
    ├── Opponent input + datalist suggestions
    ├── Edit Team action
    └── Ranked matchup groups
        └── Expandable matchup cards
```

## App Contract

`App` is the runtime orchestrator and owns all state.

```ts
state: {
  mode: 'configure' | 'matchups',
  teamDraft: string[6],
  teamSlotErrors: (string | null)[6],
  teamNames: string[],
  opponentInput: string,
  opponent: Pokemon | null,
  ranked: RankedMatchup[],
  expandedCard: string | null,
  pokemonNameIndex: string[],
  nameIndexReady: boolean,
  loading: boolean,
  error: string | null
}
```

## Primary Behaviors

- Configure mode validates and saves team names to `localStorage` (`pmh_team_v1`).
- Matchups mode auto-computes only when opponent input is an exact indexed name.
- Output remains grouped cards: `Best`, `Neutral`, `Risky`, `Avoid`.
- `Edit Team` returns to configure mode without resetting saved team.

## Legacy Note

Legacy two-team components under `src/components/TeamInput` and `src/components/MatchupResults` are no longer part of the active runtime flow.
