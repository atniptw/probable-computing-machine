# Story Map: Pokémon Matchup Advisor

Story maps organize work by **user journey** (left → right) and **release priority** (top → bottom).
Each column is a user activity. Each row is a release slice. Stories within a slice can be built in parallel.

---

## User Journey (Backbone)

```
Open App → Enter Your Team → Enter Opponent Team → Run Matchup → Read Results → Iterate
```

---

## Story Map

### Activity 1 — Open App

| Priority | Story |
|----------|-------|
| MVP | App loads at GitHub Pages URL with no errors |
| MVP | Team input form is visible immediately (no loading screen needed) |
| MVP | App is usable on desktop browser |
| V2 | App is usable on mobile screen sizes (responsive layout) |
| V2 | Favicon and page title show "Pokémon Matchup Advisor" |
| V3 | App loads within 1s on repeat visits (Vite bundle optimized) |

---

### Activity 2 — Enter Your Team

| Priority | Story |
|----------|-------|
| MVP | User sees 6 labelled input slots under "Your Team" |
| MVP | User can type a Pokémon name into any slot (free text) |
| MVP | Entering at least 1 Pokémon name enables the submit button |
| MVP | Empty slots are ignored (not treated as errors) |
| MVP | Input is trimmed and lowercased before lookup |
| V2 | Invalid name shows inline "Not found" error on that slot after submission |
| V2 | User can clear a slot by deleting its text |
| V3 | Pokémon name autocomplete/suggestions appear as user types |
| V3 | Pokémon sprite appears in the slot after a valid name is confirmed |

---

### Activity 3 — Enter Opponent Team

| Priority | Story |
|----------|-------|
| MVP | User sees 6 labelled input slots under "Opponent Team" |
| MVP | Same input rules as "Your Team" |
| MVP | Entering at least 1 opponent Pokémon enables the submit button |
| V2 | Invalid opponent names show same inline error treatment as your team |
| V3 | Autocomplete and sprites same as Activity 2 |

---

### Activity 4 — Run Matchup

| Priority | Story |
|----------|-------|
| MVP | Clicking "Check Matchups" triggers type lookup and calculation |
| MVP | Submit button shows a loading spinner while request is in flight |
| MVP | Inputs are disabled while loading to prevent mid-flight changes |
| MVP | Matchup completes in < 2s on first load (no cache) |
| MVP | Matchup completes in < 500ms on repeat queries (cached data) |
| MVP | Network error shows top-level "Check your connection" banner |
| MVP | Rate limit (429) triggers 1s retry once before showing error |
| V2 | PokéAPI type data is prefetched on app startup (reduces first query time) |
| V3 | Results update without full page reload when user edits team and resubmits |

---

### Activity 5 — Read Results

| Priority | Story |
|----------|-------|
| MVP | Results grid appears below the form after successful query |
| MVP | Grid rows = your team, columns = opponent team |
| MVP | Each cell shows "You → Them" effectiveness label (2×, 1×, 0.5×, 0×) |
| MVP | Each cell shows "Them → You" effectiveness label |
| MVP | Effectiveness labels have distinct colour coding (green / grey / red / dark) |
| MVP | Summary bar shows count of super effective, neutral, and weak matchups |
| V2 | Dual-type combinations are stacked and displayed clearly per cell |
| V2 | Pokémon names in headers link to PokéAPI entry (optional detail view) |
| V3 | Best matchup for each of your Pokémon is visually highlighted |
| V3 | User can hover a cell for a plain-English explanation ("Pikachu is super effective against Blastoise because Electric beats Water") |

---

### Activity 6 — Iterate

| Priority | Story |
|----------|-------|
| MVP | User can edit any slot and re-submit to get updated results |
| MVP | Results are replaced (not appended) on each query |
| V2 | "Reset" button clears all slots and results |
| V2 | Previously entered team names persist in slots after submit (no clearing) |
| V3 | User can swap a single Pokémon without re-entering the whole team |
| V3 | Previous query result is shown side-by-side with new result for comparison |

---

## Release Slices

### MVP — Core matchup functionality (ship first)

Vertically: all MVP rows across all 6 activities.

Acceptance: a player can open the app, type two teams, and see a complete type-effectiveness grid.

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

### V2 — Polish and usability

- Responsive layout for mobile
- Autocomplete Pokémon names
- Inline error states per slot
- Reset button
- Team persists across submits
- PokéAPI type prefetch on startup

---

### V3 — Delight

- Pokémon sprites in slots and result headers
- Best-matchup highlight
- Hover explanation tooltips
- Side-by-side comparison of previous vs new query

---

## Implementation Order Within MVP

Dependencies determine build order:

```
1. pokeapi.js service (getPokemon, getTypeMap, computeMatchups)   ← no UI deps
2. calcEffectiveness logic + Vitest unit tests                    ← no UI deps
3. App state scaffold (yourTeam, opponentTeam, result, loading)   ← needs service
4. TeamInput → TeamSlots → PokemonSlot                           ← needs App state
5. SubmitButton                                                   ← needs TeamInput
6. MatchupResults → MatchupGrid → MatchupCell                    ← needs result type
7. SummaryBar                                                     ← needs result type
8. Error handling: inline slot errors + banner                    ← needs all above
9. GitHub Actions deploy.yml + vite.config.js base path           ← needs build
10. End-to-end smoke test: open URL → enter teams → check result  ← needs deploy
```

---

## Open Questions (Product Owner to Decide)

1. Should the app support Pokémon from **all generations** on MVP, or limit to a specific generation?
2. Should empty slots be ignored silently, or should the user be prompted to fill at least N slots?
3. Should results be shown per-Pokémon pair, or should the default view be aggregated by "your Pokémon best matchups"?
