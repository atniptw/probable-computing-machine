# Data Flow

## Full User Flow

```
1. User types Pokémon names into TeamInput slots
2. User clicks "Check Matchups"
3. App sets loading = true, clears previous errors
4. For each unique Pokémon name entered:
     a. Check localStorage for pkm_v1_{name}
        → Hit + not expired → use cached types
        → Miss or expired  → fetch GET /pokemon/{name}
           → 200 → parse types, write to localStorage
           → 404 → throw PokemonNotFoundError(name) → set slot error, abort
5. Call getTypeMap()
     → If TypeMap already in memory → use it
     → Else fetch GET /type/{name} for all known types (parallel)
        → Build TypeMap, store in module memory
6. computeMatchups() — pure function, no async
     → For each (yourPokemon × opponentPokemon) pair:
          → calcEffectiveness(yourTypes, theirTypes, typeMap) → youVsThem
          → calcEffectiveness(theirTypes, yourTypes, typeMap) → theyVsYou
7. Set result = MatchupResult
8. Set loading = false
9. MatchupResults renders below TeamInput
```

## Cache Check Detail

```
getPokemon(name)
    │
    ├─ read localStorage["pkm_v1_{name}"]
    │     ├─ exists + (Date.now() - cachedAt) < 604800000 ms
    │     │      → return { name, types }
    │     └─ missing or expired
    │            ↓
    └─ fetch GET /api/v2/pokemon/{name}
          ├─ 200 → extract types, write localStorage, return Pokemon
          ├─ 404 → throw PokemonNotFoundError(name)
          └─ 429 → wait 1000ms, retry once → throw RateLimitError
```

## Matchup Calculation Detail

```
calcEffectiveness(attackerTypes[], defenderTypes[], typeMap)
    │
    ├─ modifier = 1
    │
    ├─ for each attackerType:
    │     for each defenderType:
    │         if defenderType in typeMap[attackerType].doubleDamageTo  → modifier *= 2
    │         if defenderType in typeMap[attackerType].halfDamageTo    → modifier *= 0.5
    │         if defenderType in typeMap[attackerType].noDamageTo      → modifier *= 0
    │
    └─ return modifier mapped to label:
          ≥ 2    → "2x"
          1      → "1x"
          < 1    → "0.5x"
          0      → "0x"
```

## Error Propagation

```
PokemonNotFoundError(name)
    → caught in App.handleSubmit
    → sets slotErrors[index] = "Not found: {name}"
    → PokemonSlot renders error below input

RateLimitError | NetworkError
    → caught in App.handleSubmit
    → sets App.error = message string
    → renders top-level ErrorBanner
```

## Render State Machine

```
App.result === null  AND  App.loading === false  → TeamInput only, submit enabled
App.loading === true                             → TeamInput visible, spinner on button
App.error !== null                              → ErrorBanner at top
App.result !== null                             → TeamInput + MatchupResults both visible
```
