# Component Design

## Runtime Component Tree

```
App
├── header (inline JSX — no separate component)
│   ├── Help link (inline, always visible — opens USER_GUIDE.md)
│   ├── Feedback link (inline, always visible — opens GitHub Issues)
│   └── "Edit Team" button (inline, battle screen only)
├── BattleSelectorSection (battle screen)
│   ├── GameVersionSelect
│   ├── GymLeaderSelector (gym mode only)
│   │   └── TypeBadge (gym specialty type)
│   ├── GymTeamPanel (gym mode + gym selected)
│   └── SuggestionList (free mode, conditional)
├── TeamConfigurationSection (team screen header)
│   └── GameVersionSelect
└── ErrorBoundary (wraps <main> — catches synchronous render errors in the results pane)
    ├── MatchupContainer (battle screen, main pane) [owns selectedTeamIndex: number]
    │   ├── PokemonCard (opponent + active team member)
    │   │   └── TypeBadge × N (Pokémon types)
    │   ├── OffenseSection
    │   │   └── MoveList × N
    │   └── DefenseSection
    │       └── MoveList × N
    └── TeamEditorPanel (team screen, main pane)
        └── SuggestionList × 2 (slot + move autocomplete)
```

## App Contract

`App` is the runtime orchestrator. It delegates data loading and suggestion logic to hooks and render sections to `src/components/AppView/*` and `src/components/MatchupViewer/*`.

```ts
state: {
  selectedGameVersion: string,
  screen: 'battle' | 'team',
  opponentInput: string,
  error: string | null,
  battleMode: 'free' | 'gym',
  selectedGymId: string | null,
}

hooks: {
  usePokemonNameIndex: {
    inputs: { generation: number, label: string, version: string, onError },
    outputs: { pokemonNameIndex: string[], nameIndexReady: boolean }
  },
  useMoveNameIndex: {
    inputs: { onError },
    outputs: { moveNameIndex: string[] }
  },
  useTeamConfiguration: {
    inputs: { defaultTeam, gameLabel, nameIndexReady, onError, pokemonNameSet, teamSize, version },
    outputs: { teamNames, teamDraft, teamMembers, teamMovesDraft, teamSlotErrors, teamMoveErrors,
               activeTeamSlot, saveTeam, updateTeamSlot, addTeamMove, removeTeamMove,
               setActiveTeamSlot, prepareTeamEditor, resetTeam }
  },
  usePokemonSuggestions: {
    inputs: { pokemonNameIndex: string[], maxSuggestions: number },
    outputs: { getSuggestions(query: string): string[] }
  },
  useMatchupMatrix: {
    // consumed internally by MatchupContainer, not App directly
    inputs: { teamMembers, teamNames, normalizedOpponent, exactMatchFound, generation, gameLabel,
              nameIndexReady, opponentMoves, pokemonNameSet, selectedTeamIndex, onError },
    outputs: { loading, matchup }
  }
}
```

## Primary Behaviors

- App opens directly on the battle screen for in-fight speed.
- `BattleSelectorSection` toggles between free-battle (typeahead opponent search) and gym-leader mode (`GymLeaderSelector` → `GymTeamPanel`).
- `MatchupContainer` handles team-member cycling (desktop prev/next buttons + mobile swipe).
- `TeamEditorPanel` supports up to 4 moves per slot with add/remove chip interface; slot and move autocomplete provided by `SuggestionList`.
- Game selector controls all autocomplete, validation, and matchup rules.
- Type effectiveness map is generation-aware for key historical chart differences.
- Ranking uses `best`, `good`, `neutral`, `risky` buckets.

## Shared Primitives

Reusable presentational components used across module boundaries:

| Component   | Location                       | Purpose                                                                         |
| ----------- | ------------------------------ | ------------------------------------------------------------------------------- |
| `TypeBadge` | `src/components/TypeBadge.tsx` | Renders a colored pill for a Pokémon type; reads from `src/utils/typeColors.ts` |

## Dormant Assets

Files that exist in `src/` but are **not on the active render path**. These are candidates for removal in a future clean-up pass.

_None currently._

---

## Drift Detection and Resolution

### Running the drift check

Invoke `/architecture-drift` to compare this file against the live codebase. The skill will report:

- **Missing from docs** — components or hooks present in `src/` but not listed here
- **Stale in docs** — components or hooks listed here but no longer present in `src/`
- **Dormant candidates** — files identified as unused by static import analysis

### Resolving drift

1. If `src/` has grown beyond what is documented: update this file's component tree and hooks list, then commit alongside the feature that introduced the change.
2. If this file documents something that no longer exists: remove the stale entry and note it in `SESSIONS.md`.
3. If an asset is dormant for more than one milestone: open a clean-up issue and remove it.

### Cadence

Run `/architecture-drift` at the start of each Wave (before beginning implementation) and again before the final push of the Wave.
