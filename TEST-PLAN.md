# Test Plan — Pokémon Matchup Helper

**Date:** 2026-06-23  
**Scope:** Full project — V1 existing coverage + V2 additions  
**Stack:** Vitest + @testing-library/react (unit/component), Playwright (e2e)  
**Commands:** `npm run test`, `npm run test:coverage`, `npm run e2e`

---

## Overview

The existing harness (from ROADMAP current state) has good coverage of services and hooks, no component tests, and a single smoke E2E. This plan documents what needs to exist per wave, what's new for V2, and the concrete test cases to write.

### Current coverage summary

| Layer                          | Status  | Notes                                                        |
| ------------------------------ | ------- | ------------------------------------------------------------ |
| Services (`src/services/`)     | Good    | `calcEffectiveness`, `computeMatchups`, `getTypeMap` covered |
| Hooks (`src/hooks/`)           | Good    | Core hooks covered                                           |
| Components (`src/components/`) | None    | Zero tests; all branching UI logic is untested               |
| Data (`src/data/`)             | None    | Gym data correctness not verified                            |
| E2E                            | Partial | 1 free-battle smoke test; gym flow uncovered                 |
| Architecture boundaries        | None    | Import rules exist in CLAUDE.md but are not enforced         |
| PokéAPI contracts              | None    | Interface shapes are documented but not verified             |

---

## V1 Gaps — ROADMAP Waves 1–3

These items are already tracked in ROADMAP.md. Documenting them here with concrete test cases for completeness.

### Wave 1.1 — Gym data unit tests

**File:** `src/tests/gyms.test.ts`  
**Type:** Unit

Test cases:

- `getGymsForGame('emerald')` returns a non-empty array with correct shape (`{ id, name, leader, pokemon[] }`)
- `getGymsForGame` returns results for every supported game (`red`, `crystal`, `emerald`, `platinum`, `black-2`, `x`, `ultra-sun`, `sword`, `scarlet`)
- `getGymById` returns the correct gym when given a valid ID
- `getGymById` returns `undefined` or `null` for an unknown ID
- Every `GymPokemon` in every game file has a non-empty `name` field (data integrity assertion)
- No duplicate gym IDs within a single game

### Wave 1.2 — Pre-commit hook

Not a test case; a CI/harness change. Add `vitest run` to `.husky/pre-commit`. No test file needed.

### Wave 1.3 — Accessibility

Covered in Wave 2 component tests (aria-pressed assertions). Tracked in ROADMAP.

### Wave 2.1 — Gym component tests

**File:** `src/tests/components/GymLeaderSelector.test.tsx`  
**Type:** Component (RTL)

Test cases:

- Renders all gym leaders with correct name and type label for a given game
- Clicking a gym leader calls `onSelect` with the correct gym ID
- Selected gym has `aria-pressed="true"`; unselected gyms have `aria-pressed="false"`
- Renders a no-data message when called for a game with no gym data

**File:** `src/tests/components/GymTeamPanel.test.tsx`  
**Type:** Component (RTL)

Test cases:

- Renders the correct Pokémon names for the selected gym
- Clicking a Pokémon calls `onPokemonSelect` with the correct name
- Selected Pokémon has `aria-pressed="true"`

### Wave 2.2 — E2E gym leader flow

**File:** `e2e/matchup-smoke.spec.ts` (extend existing)  
**Type:** E2E (Playwright)

Test cases:

- Toggle to Gym Leader mode → gym list appears
- Select a gym → Pokémon team appears
- Click a team Pokémon → matchup viewer renders with that Pokémon's name in the header
- Matchup viewer shows at least one offense or defense card

### Wave 2.3 — Core UI component tests

**File:** `src/tests/components/BattleSelectorSection.test.tsx`  
**Type:** Component (RTL)

Test cases:

- Renders Free Battle tab and Gym Leader tab
- Switching tabs toggles the active view
- Typing in the opponent field calls the suggestion handler
- Selecting a suggestion calls `onOpponentSelect` with the correct name

**File:** `src/tests/components/MatchupContainer.test.tsx`  
**Type:** Component (RTL)

Test cases:

- Renders loading state while data is fetching
- Renders error state when fetch fails
- Renders `OffenseSection` and `DefenseSection` when data is available
- `OffenseSection` renders a card per team member with effectiveness label
- Effectiveness label shows "super effective", "not effective", "immune" for ×2, ×0.5, ×0 cases

### Wave 2.4 — Coverage scope expansion

Update `vite.config.ts` to include `src/components/**/*.tsx` in `coverage.include` once Wave 2.3 tests are merged. Raise branch/statement thresholds as coverage grows.

### Wave 3.1 — Import boundary tests

**File:** `src/tests/architecture/importBoundaries.test.ts`  
**Type:** Architecture fitness

Test cases (each asserts no matching import path exists via `grep` or a custom ESLint rule):

- No file in `src/services/` imports from `src/hooks/`
- No file in `src/services/` imports from `src/components/`
- No file in `src/hooks/` imports from `src/components/`
- No file in `src/data/` imports from `src/services/` or `src/hooks/`

Implementation note: these can be implemented as Vitest tests that use `node:fs` + `node:path` to walk the directory tree and assert import patterns, or as a custom ESLint rule that runs in `npm run lint`. Either approach is acceptable — the key is that it's automated and runs in CI.

### Wave 3.2 — PokéAPI contract tests

**File:** `src/tests/contracts/pokeapi.contract.test.ts`  
**Type:** Contract (integration against real API or fixture)

Test cases — each asserts the response shape matches the TypeScript interface:

- `GET /api/v2/pokemon/bulbasaur` → response has `name: string`, `types: Array<{slot, type: {name}}>`, `stats: Array<{base_stat, stat: {name}}>`, `sprites.front_default: string | null`
- `GET /api/v2/type/fire` → response has `damage_relations` with the expected sub-keys (`double_damage_to`, `half_damage_to`, `no_damage_to`, etc.)
- `GET /api/v2/move/flamethrower` → response has `type: {name}`, `power: number | null`, `damage_class: {name}`
- `GET /api/v2/pokemon?limit=10000` → response has `count: number`, `results: Array<{name, url}>`

Implementation note: use real network calls in a slow/optional test suite (e.g. `vitest run --project=contracts`), or record responses as fixtures and run them offline. The DESIGN-v2.md references these tests as required before merging any API-touching change.

### Wave 3.3 — Generation-aware type chart tests

**File:** `src/tests/typechart.gen.test.ts`  
**Type:** Unit

Test cases (explicit, not inferred):

- Ghost vs. Psychic in Gen 1 → `calcEffectiveness` returns `0` (immune, unlike Gen 2+ where it's ×2)
- Poison vs. Bug in Gen 1 → returns `2` (super effective; reversed in later gens)
- Fairy type does not exist in Gen 1 (`getTypeMap(1)` has no Fairy key)
- Steel vs. Ghost in Gen 6+ → returns `0` (immune)
- Fairy vs. Dragon in Gen 6+ → returns `2`
- Fire vs. Steel in Gen 1 → returns `1` (Steel doesn't exist in Gen 1)

---

## V2 Additions

These are new tests required by the V2 feature set. They don't exist yet and should be written alongside the implementation waves (A–E in DESIGN-v2.md).

### Wave A — Foundation

**A3: `getPokemon` stat extraction**

File: extend existing `pokeapi` service tests  
Type: Unit

- `normalizeStats` maps `special-attack` → `specialAttack`, `special-defense` → `specialDefense`, `hp` → `hp`, etc.
- `normalizeStats` returns `0` for any stat name not present in the array (defensive default)
- `getPokemon` result now includes `stats` with all six stat fields
- `getPokemon` stores the expanded shape under `pkm_v3_*` cache key, not `pkm_v2_*`

**A4: `getMoveDetail`**

File: `src/tests/services/getMoveDetail.test.ts`  
Type: Unit

- Returns `{ name, type, basePower, damageClass }` for a physical move (e.g. Tackle → `physical`, `basePower: 40`)
- Returns `basePower: null` and `damageClass: 'status'` for a status move (e.g. Growl)
- Returns `basePower: null` and `damageClass: 'special'` for a variable-power move (e.g. Hidden Power)
- Persists result to localStorage under `move_v1_{name}` with an `expires` field
- On second call, reads from localStorage without making a network request (cache hit)
- Expired cache entry triggers a fresh fetch

**A5: Gym data completeness (V2 extension of Wave 1.1)**

Extend `src/tests/gyms.test.ts`:

- Every `GymPokemon` entry across all game files has a `level` field that is a number between 1 and 100
- No level is `0` or `undefined`

**A6: `gen1SpecialOverrides`**

File: `src/tests/data/gen1SpecialOverrides.test.ts`  
Type: Unit

- `GEN1_SPECIAL_OVERRIDES['gengar']` equals `100` (not the modern 130)
- All values in the override map are positive integers
- No key in the map conflicts with a standard Pokémon name that does NOT have a Gen 1 Special discrepancy (regression guard — grows as overrides are added)

### Wave B — Damage Calculator

**B1: `calcDamageRange`**

File: `src/tests/services/damageCalc.test.ts`  
Type: Unit — these are the acceptance criteria cases from the PRD. Each must match a reference calculator to within ±1 HP.

Gen 1 (special stat, 2× crit, 217–255/255 random):

- Gengar (SpAtk override 100, Lv 50) using Thunderbolt (BP 95, Special) vs. Starmie (SpDef = Special = 85, Lv 50): verify min, max, critMin, critMax
- Machamp (Atk 130, Lv 50) using Submission (BP 80, Physical) vs. Snorlax (Def 65, Lv 50): verify range
- Status move (Growl) → `calcDamageRange` returns `null`
- `attackerLevel: null` → returns `null`

Gen 2–5 (SpAtk/SpDef split, 2× crit, 217–255/255 random):

- Typhlosion (SpAtk 109, Lv 50) using Flamethrower (BP 95, Special) vs. Feraligatr (SpDef 79, Lv 50): verify range
- Hariyama (Atk 120, Lv 50) using Brick Break (BP 75, Physical) vs. Registeel (Def 150, Lv 50): verify range

Gen 6+ (SpAtk/SpDef split, 1.5× crit, 85–100/100 random):

- Greninja (SpAtk 103, Lv 50) using Surf (BP 90, Special) vs. Charizard (SpDef 85, Lv 50): verify range
- Garchomp (Atk 130, Lv 50) using Dragon Claw (BP 80, Physical) vs. Togekiss (Def 95, Lv 50): verify range
- Crit multiplier is 1.5×, not 2× → assert `critMin` = `floor(min * 1.5)`

Edge cases:

- `basePower: null` with `damageClass: 'special'` (variable-power move) → returns `null`
- Effectiveness multiplier of 0 (immune) → `min = max = critMin = critMax = 0`
- Effectiveness multiplier of 4 (4×) → all values are 4× the base damage

**B2: `rankMoves`**

File: extend `src/tests/services/damageCalc.test.ts`  
Type: Unit — 10 verified cases

- Higher base power ranks ahead of lower base power (same type, same attacker/defender)
- Super-effective move ranks ahead of neutral move even if BP is the same
- Status moves rank last (no damage)
- Moves with `basePower: null` rank above status but below any move with a known damage floor
- Variable-power moves with `damageClass: 'special'` are handled consistently (not thrown)
- Sorted correctly when two moves have identical damage floors (tiebreak by effectiveness, then move name alphabetically)
- Works correctly when `attackerLevel` is `null` — returns array with `damageRange: null` on each entry, sorted by effectiveness then name
- Works correctly when `defenderLevel` is `null` — same null-damageRange behavior
- Handles empty moves array → returns `[]`
- Returns the full `MoveRecommendation` shape (all fields present) for a normal case

**B3: `analyzeTeamCoverage`**

File: `src/tests/services/teamCoverage.test.ts`  
Type: Unit

- A team with a Grass-type move covers Water, Ground, Rock in offensiveCoverage
- A team with zero Dragon resistors has Dragon in defensiveGaps
- A team of 6 with at least one move of every type has a complete offensiveCoverage (empty defensiveGaps is not required)
- Falls back to Pokémon's own types when `movesTypes` is empty
- Deduplicates offensiveCoverage (same type covered by multiple members appears once)
- Works correctly for Gen 1 (Fairy type not present; Steel type not present)
- Works correctly for Gen 6+ (Fairy type appears in coverage if a team member has a Fairy move)

### Wave C — Hook wiring

**C1: `useTeamConfiguration` level field**

File: extend existing hook tests  
Type: Unit (hook via RTL `renderHook`)

- Initial state: `level` is `undefined` for a slot with no saved data
- Setting level to a valid number persists it to localStorage in the `pmh_team_v1_*` entry
- Setting level out of range (0 or 101) produces a validation error
- Loading a saved team without a `level` field doesn't throw — level defaults to `undefined`

**C2: `useMatchupMatrix` expansion**

File: extend existing hook tests  
Type: Unit

- `damageCalcAvailable` is `false` when attacker level is `undefined`
- `damageCalcAvailable` is `false` when defender level is `undefined` (Free Battle with no opponent level entered)
- `damageCalcAvailable` is `true` when both levels are present
- `moveRecommendations` is populated and sorted by `damageRange.min` descending when both levels are present
- `moveRecommendations` has `damageRange: null` entries when either level is missing

**C3: `useTeamCoverage`**

File: `src/tests/hooks/useTeamCoverage.test.ts`  
Type: Unit

- Returns `coverage: null` while loading
- Returns correct `offensiveCoverage` and `defensiveGaps` once resolved
- Does not trigger duplicate PokéAPI fetches when the battle view has already fetched the same Pokémon (cache hit)
- Does not run when team has no members with valid names

### Wave D — UI components

**D1–D4 test additions**

File: `src/tests/components/TeamEditorPanel.test.tsx` (extend)

- Level input renders for each slot
- Entering 50 in the level input updates the team member's level state
- Entering 0 shows an inline validation error
- Entering 101 shows an inline validation error
- Slot without a level shows the "Set level for damage calc" warning note

File: `src/tests/components/OffenseSection.test.tsx`

- When `damageCalcAvailable` is `true`: renders "XX–YY HP" range per move
- When `damageCalcAvailable` is `false`: renders type effectiveness label only; no damage column
- When opponent level is unknown: renders "?–? HP" placeholder
- Top-damage move receives a highlight class or attribute

File: `src/tests/components/TeamCoveragePanel.test.tsx`

- Collapsed by default; clicking toggle shows the panel
- Renders a pill or indicator for each type in `offensiveCoverage`
- Types in `defensiveGaps` are visually distinguished (e.g. `data-gap="true"` or warning color class)

### Wave E — Acceptance criteria validation

These are manual QA steps per the PRD success criteria, run once after Wave D is merged:

- Damage range for at least one case per generation group (Gen 1, Gen 2–5, Gen 6+) matches Pokémon Showdown's calculator to within ±1 HP. Record the verified cases in `DECISIONS.md`.
- Move recommender sorts moves in correct order for at least 10 manually checked matchups.
- Team coverage panel correctly reports a type gap for a known weak team (e.g. all Normal-type team → no resistances to Fighting).
- No `429` error during a typical cold-cache session (6-member team, 4 moves each).

---

## Coverage Targets

| Layer      | Current target | Target after V2 + Wave 2.4     |
| ---------- | -------------- | ------------------------------ |
| Services   | 80% statements | 90% statements                 |
| Hooks      | 80% statements | 85% statements                 |
| Components | 0% (excluded)  | Include; target 70% statements |
| Data       | 0% (excluded)  | Include; target 90% statements |

Coverage is measured by `npm run test:coverage`. Thresholds are enforced in `vite.config.ts`. Do not raise thresholds until tests exist to back them up.

---

## Test ordering / sequencing

```
Now         Wave 1.1, 1.2 (gym data tests, pre-commit hook)
            Wave A3, A4, A5, A6 (alongside V2 Wave A implementation)

Next        Wave B1, B2, B3 (alongside V2 Wave B implementation)
            Wave 2.1, 2.2 (gym component tests + e2e gym flow)

Then        Wave C1, C2, C3 (alongside V2 Wave C hook wiring)
            Wave 2.3, 2.4 (broader component coverage, raise thresholds)

Later       Wave D tests (alongside V2 Wave D UI)
            Wave 3.1, 3.2, 3.3 (architecture boundary + contract + gen-chart)

Finish      Wave E (manual acceptance criteria QA after V2 Wave D merges)
```

The V2 service tests (Waves A–B) should be written before or alongside their implementation, not after. The damage calculator is the highest-risk new logic and correctness must be verified against a reference before UI is built on top of it.

---

## What's explicitly not tested

- Trivial getters, constants, and enumerations with no branching logic
- React framework internals (routing, context propagation)
- PokéAPI server behavior (rate limiting, availability) — only the client-side response shape is tested
- IV/EV inputs (deferred from V2 scope)
- Weather, terrain, and field effects (deferred)
