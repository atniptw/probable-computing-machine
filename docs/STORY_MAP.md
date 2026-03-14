# Story Map: Pokémon Matchup Advisor

Story maps organize work by **user journey** (left → right) and **release priority** (top → bottom).
Each column is a user activity. Stories are sequenced as step-by-step user flow.

---

## User Journey (Backbone)

| Step | User Flow |
|---|---|
| 1 | Open App |
| 2 | Configure Your Team |
| 3 | Select Opponent |
| 4 | Auto-Run Matchup |
| 5 | Read Results |
| 6 | Iterate: edit team or change opponent |

---

## Story Map

| Open App | Configure Your Team | Select Opponent | Auto-Run Matchup | Read Results | Iterate |
|---|---|---|---|---|---|
| Open app experience | Build your team | Build opponent team | Execute matchup check | Understand outcomes | Adjust and compare |
| Loads with visible form | 6 slots and basic validation | Same input rules for opponent | Loading plus network and 429 handling | Grid plus summary labels | Re-submit replaces results |
| Mobile layout and title polish | Inline errors and clear slot | Inline-error parity with your team | Type prefetch on startup | Dual-type clarity and detail links | Reset and keep entered names |
| Repeat-load optimization | Autocomplete and sprites | Autocomplete parity | Result updates without page reload | Best-match highlights and explanations | Side-by-side comparison view |

---

## Delivery Steps

### Step 1 — Core matchup functionality (ship first)

Focus: complete the essential end-to-end flow across all 6 activities.

Acceptance: a player can configure one saved team, choose one opponent, and see ranked matchup guidance.

Stories:
- App loads at GitHub Pages URL
- Team input form with 6 slots each
- At-least-1 slot fills submit button
- Submit fetches Pokémon types from PokéAPI (with localStorage cache)
- Type effectiveness matrix computed client-side
- Results grid with 2× / 1× / 0.5× / 0× labels and colour badges
- Summary bar
- Error handling: invalid name (inline), network (banner), rate limit (retry banner)
- GitHub Actions deploy on push to main

---

### Step 2 — Polish and usability

- Responsive layout for mobile
- Autocomplete Pokémon names
- Inline error states per slot
- Reset button
- Team persists across submits
- PokéAPI type prefetch on startup

---

### Step 3 — Delight

- Pokémon sprites in slots and result headers
- Best-matchup highlight
- Hover explanation tooltips
- Side-by-side comparison of previous vs new query

---

## Implementation Order

Dependencies determine build order:

| Step | Work Item | Depends On | Layer |
|---|---|---|---|
| 1 | `pokeapi.js` service (`getPokemon`, `getTypeMap`, `computeMatchups`) | None | Service |
| 2 | `calcEffectiveness` logic + Vitest unit tests | 1 | Service |
| 3 | App state scaffold (`yourTeam`, `opponentTeam`, `result`, `loading`) | 1, 2 | State |
| 4 | `TeamInput` + `TeamSlots` + `PokemonSlot` | 3 | UI |
| 5 | `SubmitButton` | 4 | UI |
| 6 | `MatchupResults` + `MatchupGrid` + `MatchupCell` | 3 | UI |
| 7 | `SummaryBar` | 3 | UI |
| 8 | Error handling (inline slot errors + network banner) | 5, 6, 7 | Integration |
| 9 | `deploy.yml` + `vite.config.js` base path | 8 | Deploy |
| 10 | End-to-end smoke test (open URL -> enter teams -> check result) | 9 | Validation |

---

## Open Questions (Product Owner to Decide)

1. Should the app support Pokémon from **all generations** in the first release, or limit to a specific generation?
2. Should empty slots be ignored silently, or should the user be prompted to fill at least N slots?
3. Should results be shown per-Pokémon pair, or should the default view be aggregated by "your Pokémon best matchups"?
