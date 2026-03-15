# Data Flow

## Full User Flow

```
1. App mounts in Battle screen mode.
2. App restores selected game (`pmh_game_v1`) and resolves generation metadata.
3. App warms generation-specific type cache (`getTypeMap({ generation })`) and loads selected-game Pokédex index (`getPokemonNameIndex(version)`).
4. App loads team preview details for saved names (`pmh_team_v1`) in parallel using generation-aware typings.
5. User types opponent name in the Opponent input and taps a typeahead suggestion.
6. When opponent is an exact indexed match, app fetches:
   - cached/in-flight-deduped `getPokemon(opponent, { generation })`
   - cached/in-flight-deduped `getPokemon(teamMember, { generation })` for each saved team member
   - cached `getTypeMap({ generation })`
7. App computes recommendation buckets via `rankTeamAgainstOpponent(team, opponent)`:
   - `best` (single primary recommendation)
   - `good`
   - `neutral`
   - `risky`
8. App renders `PrimaryRecommendationCard` above the fold; secondary groups stay collapsed until user expands.
9. If user taps `Edit Team`, app enters Team Configuration screen, validates slots against selected-game Pokédex, saves locally, then returns to battle screen.
```

## Request + Cache Behavior

```
getPokemonNameIndex(version)
  ├─ in-memory cache hit (`pkm_names_v2_{version}`) → return names
  ├─ localStorage fresh cache (`pkm_names_v2_{version}`) → return names
  └─ fetch sequence:
      1) GET /version/{version}
      2) GET /version-group/{version_group}
      3) GET /pokedex/{pokedex_name}
         → normalize names, cache for 7 days
         → stale-cache fallback on fetch failure

getPokemon(name, { generation })
  ├─ localStorage fresh cache (`pkm_v2_{name}_g{generation}`) → return Pokemon
  ├─ in-flight request for same key exists → await same Promise
  └─ GET /pokemon/{name}
      → applies historical `past_types` resolution when available for selected generation
      → cache for 7 days
      → 404 => PokemonNotFoundError
      → 429 retry once => RateLimitError

getTypeMap({ generation })
  ├─ in-memory cache hit (`generation` key) → return map
  ├─ if generation 9 cache exists, clone baseline map
  └─ apply generation rules:
      - remove Fairy before Gen 6
      - remove Dark/Steel before Gen 2
      - restore pre-Gen 6 Ghost/Dark vs Steel resistance
      - apply Gen 1 Ghost/Psychic and Ice/Fire historical adjustments
```

## Render State Machine

```
screen = battle, no opponent → empty hint
screen = battle, exact opponent + loading → calculating hint
screen = battle, exact opponent + loaded → primary recommendation + collapsed secondary options
screen = team → slot editor + inline validation + Save Team
error != null → banner visible in both screens
```
