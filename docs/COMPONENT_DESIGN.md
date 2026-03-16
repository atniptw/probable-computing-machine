# Component Design

## Component Tree

```
App
├── TeamInput
│   ├── TeamSlots (label="Your Team")
│   │   └── PokemonSlot × 6
│   ├── TeamSlots (label="Opponent Team")
│   │   └── PokemonSlot × 6
│   └── SubmitButton
└── MatchupResults  (only after first successful submit)
    ├── MatchupGrid
    │   └── MatchupCell × (yourTeam.length × opponentTeam.length)
    └── SummaryBar
```

## Component Contracts

### App
Root component; owns all state.

```js
state: {
  yourTeam:     string[6],     // Pokémon names (empty string = empty slot)
  opponentTeam: string[6],
  result:       MatchupResult | null,
  loading:      boolean,
  error:        string | null  // top-level banner error
}
```

Calls `computeMatchups()` on submit. Sets `result` on success; sets `error` on failure.

---

### TeamInput
Form containing both team slot groups and submit button.

```js
props: {
  yourTeam:             string[],
  opponentTeam:         string[],
  onYourTeamChange:     (index, value) => void,
  onOpponentTeamChange: (index, value) => void,
  onSubmit:             () => void,
  loading:              boolean
}
```

---

### TeamSlots
Labelled group of 6 PokemonSlot inputs.

```js
props: {
  label:    string,                    // "Your Team" | "Opponent Team"
  slots:    string[],                  // 6 values
  onChange: (index, value) => void
}
```

---

### PokemonSlot
Single text input for one Pokémon name.

```js
props: {
  value:       string,
  onChange:    (value) => void,
  error:       string | null,   // inline "Not found" error for this slot
  placeholder: string           // "Pokémon 1" … "Pokémon 6"
}
```

---

### SubmitButton
```js
props: {
  onClick:  () => void,
  disabled: boolean,   // true when loading or no filled slots
  loading:  boolean    // shows spinner
}
```

---

### MatchupResults
Renders grid and summary. Only mounted when `result` is non-null.

```js
props: {
  result: MatchupResult
}
```

---

### MatchupGrid
N×M table of matchup cells with column/row headers.

```js
props: {
  matrix:       MatchupEntry[],
  yourTeam:     Pokemon[],
  opponentTeam: Pokemon[]
}
```

---

### MatchupCell
One cell showing two-way effectiveness with visual badges.

```js
props: {
  entry: MatchupEntry
}

// Renders:
// "2x"   → green badge  — Super Effective
// "1x"   → grey badge   — Neutral
// "0.5x" → red badge    — Not Very Effective
// "0x"   → dark badge   — No Effect
```

---

### SummaryBar
Aggregate counts across the full matchup matrix.

```js
props: {
  summary: { superEffective: number, neutral: number, notVeryEffective: number }
}
```

## State Management

All state lives in `App`. Props flow down; callbacks flow up. No external state library.

```
App  ←——————————— (callbacks bubble up)
 └── TeamInput
       └── TeamSlots
             └── PokemonSlot

App  ———————————→ (result prop)
 └── MatchupResults
       ├── MatchupGrid → MatchupCell
       └── SummaryBar
```
