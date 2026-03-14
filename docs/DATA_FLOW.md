# Data Flow

## Full User Flow

```
1. App mounts in Configure Team mode.
2. App warms type cache (`getTypeMap`) and loads Pokémon name index (`getPokemonNameIndex`).
3. User enters 1–6 Pokémon names and clicks "Save Team".
4. App validates each non-empty slot against the loaded name index.
   - Invalid entries show inline field errors.
   - Valid team is normalized/lowercased and stored in localStorage (`pmh_team_v1`).
5. App switches to Matchups mode.
6. User types opponent name in the Opponent input.
7. When opponent is an exact indexed match, app fetches:
   - cached/in-flight-deduped `getPokemon(opponent)`
   - cached/in-flight-deduped `getPokemon(teamMember)` for each saved team member
   - cached `getTypeMap()`
8. App computes per-member matchup labels and category buckets (`Best/Neutral/Risky/Avoid`).
9. Grouped matchup cards render for the selected opponent.
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
mode = configure → team editor + Save Team
mode = matchups, no opponent → empty hint
mode = matchups, exact opponent + loading → calculating hint
mode = matchups, exact opponent + loaded → grouped matchup cards
error != null → banner visible in both modes
```
