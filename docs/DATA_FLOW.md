# Data Flow

## Full User Flow

```
1. App mounts in Battle screen mode.
2. App warms type cache (`getTypeMap`) and loads Pokémon name index (`getPokemonNameIndex`).
3. App loads team preview details for saved names (`pmh_team_v1`) in parallel.
4. User types opponent name in the Opponent input and taps a typeahead suggestion.
5. When opponent is an exact indexed match, app fetches:
   - cached/in-flight-deduped `getPokemon(opponent)`
   - cached/in-flight-deduped `getPokemon(teamMember)` for each saved team member
   - cached `getTypeMap()`
6. App computes recommendation buckets via `rankTeamAgainstOpponent(team, opponent)`:
   - `best` (single primary recommendation)
   - `good`
   - `neutral`
   - `risky`
7. App renders `PrimaryRecommendationCard` above the fold; secondary groups stay collapsed until user expands.
8. If user taps `Edit Team`, app enters Team Configuration screen, validates slots, saves locally, then returns to battle screen.
```

## Request + Cache Behavior

```
getPokemonNameIndex()
  ├─ in-memory cache hit → return names
  ├─ localStorage fresh cache (`pkm_names_v1`) → return names
  └─ fetch sequence:
      1) GET /pokemon?limit=1  (read total count)
      2) GET /pokemon?limit={count}
         → normalize names, cache for 7 days
         → stale-cache fallback on fetch failure

getPokemon(name)
  ├─ localStorage fresh cache (`pkm_v1_{name}`) → return Pokemon
  ├─ in-flight request for same key exists → await same Promise
  └─ GET /pokemon/{name}
      → cache for 7 days
      → 404 => PokemonNotFoundError
      → 429 retry once => RateLimitError
```

## Render State Machine

```
screen = battle, no opponent → empty hint
screen = battle, exact opponent + loading → calculating hint
screen = battle, exact opponent + loaded → primary recommendation + collapsed secondary options
screen = team → slot editor + inline validation + Save Team
error != null → banner visible in both screens
```
