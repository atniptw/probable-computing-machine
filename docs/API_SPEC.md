# API Specification

All calls go directly from the browser to PokéAPI v2. No backend proxy. CORS is supported by PokéAPI.

**Base URL**: `https://pokeapi.co/api/v2`

## Endpoints Used

### GET /pokemon/{name}

Fetch a Pokémon's type assignments by name.

| | |
|---|---|
| Auth | None |
| Cache | `localStorage`, 7-day TTL |
| On 404 | Throw `PokemonNotFoundError` |
| On 429 | Retry once after 1s, then throw `RateLimitError` |

**Success — fields used**
```json
{
  "name": "pikachu",
  "types": [
    { "slot": 1, "type": { "name": "electric" } }
  ]
}
```

---

### GET /pokemon?limit=100000

Fetch the full Pokemon name index for client-side partial search.

| | |
|---|---|
| Auth | None |
| Cache | `localStorage`, 7-day TTL (`pkm_names_v1`) |
| Failure fallback | Use stale cached names if available |

**Success - fields used**
```json
{
  "count": 1302,
  "results": [
    { "name": "bulbasaur", "url": "https://pokeapi.co/api/v2/pokemon/1/" },
    { "name": "ivysaur", "url": "https://pokeapi.co/api/v2/pokemon/2/" }
  ]
}
```

---

### GET /type/{name}

Fetch type effectiveness relations.

| | |
|---|---|
| Auth | None |
| Cache | Module-level memory map (session lifetime) |
| Called | Once per unique type, on first startup |

**Success — fields used**
```json
{
  "name": "electric",
  "damage_relations": {
    "double_damage_to":   [{ "name": "water" }, { "name": "flying" }],
    "half_damage_to":     [{ "name": "electric" }, { "name": "grass" }],
    "no_damage_to":       [{ "name": "ground" }],
    "double_damage_from": [{ "name": "ground" }],
    "half_damage_from":   [{ "name": "flying" }, { "name": "steel" }],
    "no_damage_from":     []
  }
}
```

---

### GET /type?limit=100

List all type names. Called once on startup to prefetch the full TypeMap.

---

## Client-Side Service Interface (`src/services/pokeapi.js`)

```js
// Returns Pokemon with name and types.
// Checks localStorage first; falls back to PokéAPI fetch.
async function getPokemon(name: string): Promise<Pokemon>

// Returns all Pokemon names for local partial search.
// Uses cached localStorage index and falls back to stale cache on fetch failure.
async function getPokemonNameIndex(): Promise<string[]>

// Returns complete TypeMap.
// Fetches all types once per session; subsequent calls return cached map.
async function getTypeMap(): Promise<TypeMap>

// Resolves all Pokémon, builds TypeMap, computes full matchup matrix.
async function computeMatchups(
  yourTeam: string[],
  opponentTeam: string[]
): Promise<MatchupResult>
```

## Matchup Calculation

For each `(yourPokemon, opponentPokemon)` pair, compute `youVsThem`:

1. Start modifier at `1`.
2. For each of your Pokémon's types, look up `typeMap[yourType]`:
   - If opponent type is in `doubleDamageTo` → multiply by `2`
   - If opponent type is in `halfDamageTo` → multiply by `0.5`
   - If opponent type is in `noDamageTo` → multiply by `0`
3. Map final modifier:
   - `≥ 2` → `"2x"` 
   - `1` → `"1x"`
   - `0.5` or `0.25` → `"0.5x"`
   - `0` → `"0x"`
4. Repeat with roles swapped for `theyVsYou`.

## Error Types

| Error class | Cause | App response |
|-------------|-------|--------------|
| `PokemonNotFoundError(name)` | 404 from `/pokemon/{name}` | Inline field error |
| `RateLimitError` | 429 after retry | Top-level retry banner |
| `NetworkError` | Fetch threw / no connection | Top-level "check connection" banner |
