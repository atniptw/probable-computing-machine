# Data Model

## PokéAPI Source Schema (relevant fields only)

### GET /api/v2/pokemon/{name}
```json
{
  "name": "charizard",
  "types": [
    { "slot": 1, "type": { "name": "fire" } },
    { "slot": 2, "type": { "name": "flying" } }
  ]
}
```

### GET /api/v2/type/{name}
```json
{
  "name": "fire",
  "damage_relations": {
    "double_damage_to":   [{ "name": "grass" }, { "name": "ice" }],
    "half_damage_to":     [{ "name": "fire" }, { "name": "water" }],
    "no_damage_to":       [],
    "double_damage_from": [{ "name": "water" }, { "name": "rock" }],
    "half_damage_from":   [{ "name": "fire" }, { "name": "grass" }],
    "no_damage_from":     []
  }
}
```

## Application Types (JavaScript)

### Pokemon
```js
{
  name: string,      // lowercase, e.g. "charizard"
  types: string[]    // 1–2 type names, e.g. ["fire", "flying"]
}
```

### Team
```js
Pokemon[]   // 1–6 entries
```

### Effectiveness
```js
"2x" | "1x" | "0.5x" | "0x"
// Combined = product of modifiers for each type pair
```

### MatchupEntry
```js
{
  yourPokemon:      Pokemon,
  opponentPokemon:  Pokemon,
  youVsThem:        Effectiveness,  // your type attacking their type
  theyVsYou:        Effectiveness   // their type attacking your type
}
```

### MatchupResult
```js
{
  yourTeam:      Pokemon[],
  opponentTeam:  Pokemon[],
  matrix:        MatchupEntry[],   // yourTeam.length × opponentTeam.length
  summary: {
    superEffective:    number,   // count of "2x" youVsThem entries
    neutral:           number,
    notVeryEffective:  number    // count of "0.5x" or "0x" entries
  }
}
```

### TypeMap (in-memory cache)
```js
{
  [typeName: string]: {
    doubleDamageTo:   string[],
    halfDamageTo:     string[],
    noDamageTo:       string[],
    doubleDamageFrom: string[],
    halfDamageFrom:   string[],
    noDamageFrom:     string[]
  }
}
```

## localStorage Cache Schema

| Key | Value shape | TTL |
|-----|-------------|-----|
| `pkm_v1_{name}` | `{ types: string[], cachedAt: number }` | 7 days (604800000 ms) |

Type data (TypeMap) is NOT persisted to localStorage — it is rebuilt each session.
