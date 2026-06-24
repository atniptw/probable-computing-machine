# V2 Technical Design: Team Synergy & Damage Calculator

**Status:** Draft  
**Date:** 2026-06-23  
**Depends on:** PRD-team-synergy-damage-calculator.md  
**Informs:** CONCEPT-v3-engine.md (V3 packaging step)

---

## Purpose

This document bridges the V2 PRD to implementation. It specifies every type that changes, every service function that is added, how the cache keys evolve, what each hook needs, what each component needs, and the wave-by-wave build order. When in doubt about scope or behavior, defer to the PRD.

---

## Current Source Topology

```
src/
  App.tsx                          — orchestrator (state, handlers)
  services/
    pokeapiClient.ts               — PokéAPI raw types + fetch primitive
    pokemonCache.ts                — index/name-list caches; CACHE_PREFIX = 'pkm_v2_'
    pokeapi.ts                     — getPokemon, getMoveType, getWildMoveset, computeMatchups
    typechart.ts                   — getTypeMap, calcEffectiveness
    ranking.ts                     — rankTeamAgainstOpponent (legacy, not on render path)
  hooks/
    usePokemonNameIndex.ts
    useMoveNameIndex.ts
    usePokemonSuggestions.ts
    useTeamConfiguration.ts        — TeamMemberConfig { name, moves? }
    useMatchupMatrix.ts            — MatchupViewModel (offense/defense groups, ratings)
  data/
    games.ts                       — GameDefinition array
    gyms/
      types.ts                     — GymLeader, GymPokemon interfaces
      index.ts                     — getGymsForGame, getGymById
      emerald.ts, black-2.ts, …    — static gym data (no levels yet)
  components/
    AppView/                       — BattleSelectorSection, TeamConfigurationSection
    MatchupViewer/                 — MatchupContainer, OffenseSection, DefenseSection, PokemonCard
    TypeBadge.tsx
```

V2 adds:

```
  services/
    damageCalc.ts                  — NEW: pure damage formula, per-generation
    teamCoverage.ts                — NEW: offensive coverage + defensive gap analysis
  data/
    gen1SpecialOverrides.ts        — NEW: { [pokemonName]: specialStat } lookup table
```

---

## Type Changes

### 1. `PokemonStats` (new, in `pokeapiClient.ts`)

```ts
export interface PokemonStats {
  hp: number
  attack: number
  defense: number
  specialAttack: number // PokéAPI stat name: 'special-attack'
  specialDefense: number // PokéAPI stat name: 'special-defense'
  speed: number
}
```

### 2. `Pokemon` (expand in `pokeapiClient.ts`)

```ts
// V1 shape (current)
export interface Pokemon {
  name: string
  types: string[]
  sprite: string | null
}

// V2 shape — add stats
export interface Pokemon {
  name: string
  types: string[]
  stats: PokemonStats
  sprite: string | null
}
```

This is a breaking change to all consumers. `useMatchupMatrix` and `computeMatchups` both reference `Pokemon`. After this change, any `Pokemon` object is guaranteed to have stats available — no conditional access needed in the damage calc.

### 3. `MoveDetail` (new, in `pokeapiClient.ts`)

```ts
export type DamageClass = 'physical' | 'special' | 'status'

export interface MoveDetail {
  name: string
  type: string
  basePower: number | null // null for status moves
  damageClass: DamageClass
}
```

### 4. `TeamMemberConfig` (expand in `useTeamConfiguration.ts`)

```ts
// V1
export interface TeamMemberConfig {
  name: string
  moves?: string[]
}

// V2 — add level
export interface TeamMemberConfig {
  name: string
  level?: number // required for damage calc; absent = type-effectiveness only
  moves?: string[]
}
```

### 5. `DamageRange` (new, in `services/damageCalc.ts`)

```ts
export interface DamageRange {
  min: number
  max: number
  critMin: number
  critMax: number
}
```

### 6. `MoveRecommendation` (new, in `services/damageCalc.ts`)

```ts
export interface MoveRecommendation {
  moveName: string
  moveType: string
  basePower: number | null
  damageClass: DamageClass
  effectiveness: number // type multiplier (0, 0.25, 0.5, 1, 2, 4)
  damageRange: DamageRange | null // null when level unavailable or status move
}
```

### 7. `TeamCoverageResult` (new, in `services/teamCoverage.ts`)

```ts
export interface TeamCoverageResult {
  offensiveCoverage: string[] // types your team can hit super-effectively (≥2×)
  defensiveGaps: string[] // types no member on your team resists (<1×)
}
```

### 8. `GymPokemon` (expand in `src/data/gyms/types.ts`)

```ts
// V1
export interface GymPokemon {
  name: string
  // (whatever else is already there)
}

// V2 — add level
export interface GymPokemon {
  name: string
  level: number
}
```

---

## Cache Key Map

### Pokémon detail cache

|         | Key pattern            | Stored shape                                                  | Notes                           |
| ------- | ---------------------- | ------------------------------------------------------------- | ------------------------------- |
| V1      | `pkm_v1_{name}_g{gen}` | `{ data: { name, types, sprite }, expires }`                  | Already abandoned               |
| Current | `pkm_v2_{name}_g{gen}` | `{ data: { name, types, sprite }, expires }`                  | Active; missing `stats`         |
| V2      | `pkm_v3_{name}_g{gen}` | `{ data: { name, types, stats, sprite }, cachedAt, expires }` | Bump prefix to force clean read |

Rationale for bumping to `pkm_v3_`: The current code already uses `pkm_v2_` (see `CACHE_PREFIX` in `pokemonCache.ts`). V2 of the _feature_ expands the cached shape. Bumping the prefix avoids trying to parse old entries that have no `stats` field, and is consistent with the "clean-break" pattern established in DEC-0026.

Implementation note: update `CACHE_PREFIX` from `'pkm_v2_'` to `'pkm_v3_'` in `pokemonCache.ts`. Old `pkm_v2_` entries stay in localStorage but are never read — they'll expire naturally in 7 days.

### Move detail cache

|                       | Key pattern      | Stored shape                                                          | Notes                       |
| --------------------- | ---------------- | --------------------------------------------------------------------- | --------------------------- |
| Current (memory only) | `move_v1_{name}` | In-memory `Map<string, string>` (type only)                           | No localStorage persistence |
| V2                    | `move_v1_{name}` | `{ type, basePower, damageClass, cachedAt, expires }` in localStorage | Persist full detail         |

The existing in-memory `moveTypeCache` only stores the type string. V2 fetches the same endpoint but stores more fields. Reuse the key prefix but now persist to localStorage.

### Other keys (unchanged)

- `pkm_names_v2_{version}` / `pkm_names_v2_all` — name indexes, unchanged
- `pkm_moves_v1_all` — move name index, unchanged
- `pkm_learnset_v1_{name}` — learnsets, unchanged
- `pmh_team_v1_{version}` — team saves; the `TeamMemberConfig` JSON gains a `level` field but old saves without it remain valid (level `undefined` = damage calc disabled for that slot)
- `pmh_game_v1` — selected game, unchanged

---

## Service Changes

### `src/services/pokeapiClient.ts`

Add to the `PokeApiPokemonResponse` raw type:

```ts
interface PokeApiStatEntry {
  base_stat: number
  stat: { name: string }
}

// Add to existing PokeApiPokemonResponse
interface PokeApiPokemonResponse {
  // ... existing fields ...
  stats: PokeApiStatEntry[]
}
```

Add `PokeApiMoveResponse` fields already present (confirm `power` and `damage_class` are in the existing type — they should be since `getMoveType` already hits this endpoint, but only reads `type.name`):

```ts
interface PokeApiMoveResponse {
  type: { name: string }
  power: number | null // base power
  damage_class: { name: string } // 'physical' | 'special' | 'status'
}
```

### `src/services/pokemonCache.ts`

- Change `CACHE_PREFIX` from `'pkm_v2_'` to `'pkm_v3_'`
- Update `CachedPokemon` interface to store the expanded `Pokemon` shape (no structural change needed since it stores `data: Pokemon` and `Pokemon` is expanding)

### `src/services/pokeapi.ts`

**`getPokemon` — expand cached shape**

After fetching `/pokemon/{name}`, extract and normalize stats:

```ts
function normalizeStats(statsArray: PokeApiStatEntry[]): PokemonStats {
  const get = (name: string) =>
    statsArray.find((s) => s.stat.name === name)?.base_stat ?? 0
  return {
    hp: get('hp'),
    attack: get('attack'),
    defense: get('defense'),
    specialAttack: get('special-attack'),
    specialDefense: get('special-defense'),
    speed: get('speed'),
  }
}
```

The returned `Pokemon` object gains `stats`. No additional API call — stats live in the same `/pokemon/{name}` response that is already fetched.

**`getMoveDetail` — new function**

Replaces the current in-memory-only `getMoveType`. Fetches `/move/{name}` and persists to localStorage:

```ts
export async function getMoveDetail(moveName: string): Promise<MoveDetail>
```

Signature stays consistent with `getMoveType` for callers that only need the type: `getMoveDetail(name).then(d => d.type)`. Deprecate `getMoveType` in favor of `getMoveDetail` — delete `getMoveType` once all callers are updated.

Cache key: `move_v1_{normalizedName}` in localStorage, TTL 7 days, shape `{ type, basePower, damageClass, expires }`.

### `src/services/damageCalc.ts` (new)

Pure TypeScript, no React, no DOM, no localStorage. This is the engine core that V3 will re-package.

```ts
import type { PokemonStats, MoveDetail, DamageRange } from './pokeapiClient'
import type { Gen1SpecialOverrides } from '../data/gen1SpecialOverrides'

export type GenerationGroup = 'gen1' | 'gen2to5' | 'gen6plus'

export function getGenerationGroup(generation: number): GenerationGroup

/**
 * Compute min/max damage for a single move.
 *
 * Returns null when:
 * - move.damageClass === 'status' (no damage)
 * - attackerLevel is null (player hasn't set a level)
 * - move.basePower is null (e.g. variable-power moves — treat as unknown)
 */
export function calcDamageRange(
  move: MoveDetail,
  attackerStats: PokemonStats,
  attackerName: string, // needed for Gen 1 Special override lookup
  attackerLevel: number | null,
  defenderStats: PokemonStats,
  defenderLevel: number | null,
  generation: number,
): DamageRange | null

/**
 * Rank all moves for a given attacker vs. a given defender.
 * Sorted by: expected floor damage desc, then effectiveness desc, then move name asc.
 */
export function rankMoves(
  moves: MoveDetail[],
  attackerStats: PokemonStats,
  attackerName: string,
  attackerLevel: number | null,
  defenderStats: PokemonStats,
  defenderLevel: number | null,
  typeMultipliers: number[], // pre-computed per move, passed in to avoid circular dep
  generation: number,
): MoveRecommendation[]
```

**Damage formula by generation group:**

```
// All generations: base formula
damage = floor( floor( floor(2 * L / 5 + 2) * BP * A / D ) / 50 ) + 2

Where:
  L  = attacker level
  BP = move base power
  A  = attacker's relevant attack stat (see below)
  D  = defender's relevant defense stat (see below)

Gen 1:
  A = attackerStats.specialAttack (or gen1SpecialOverrides[attackerName] if present)
      for special moves
  D = defenderStats.specialAttack (same override pattern)
      for special moves (Gen 1 uses same Special stat for attack and defense)
  A = attackerStats.attack  for physical moves
  D = defenderStats.defense for physical moves
  critMultiplier = 2.0
  randomRoll = [217, 255] / 255  → min roll ≈ 0.851, max roll = 1.0

Gen 2–5 (SpAtk/SpDef split, 2× crit):
  A = attackerStats.specialAttack  for special moves
  D = defenderStats.specialDefense for special moves
  A = attackerStats.attack         for physical moves
  D = defenderStats.defense        for physical moves
  critMultiplier = 2.0
  randomRoll = [217, 255] / 255

Gen 6+ (1.5× crit):
  A/D same as Gen 2–5
  critMultiplier = 1.5
  randomRoll = [85, 100] / 100  → min roll = 0.85, max roll = 1.0

DamageRange:
  min     = floor(baseDamage * effectiveness * minRoll)
  max     = floor(baseDamage * effectiveness * maxRoll)
  critMin = floor(min * critMultiplier)
  critMax = floor(max * critMultiplier)
```

Note: effectiveness multiplier is passed in from `calcEffectiveness` — `damageCalc.ts` does not re-compute type charts.

### `src/services/teamCoverage.ts` (new)

Pure TypeScript, no React, no DOM, no localStorage.

```ts
import type { Pokemon } from './pokeapiClient'
import type { TypeMap } from './typechart'

/**
 * Given a saved team and the generation's type map, return:
 *   offensiveCoverage: types that at least one team member can hit ≥2× (via any of their moves)
 *   defensiveGaps:     types that no team member resists (all team members take ≥1× from)
 *
 * Move types are resolved from team member move details (passed in pre-fetched).
 * Falls back to Pokémon's own types if no moves are configured.
 */
export function analyzeTeamCoverage(
  team: Array<{
    pokemon: Pokemon
    movesTypes: string[] // type of each configured move (empty = use pokemon.types)
  }>,
  typeMap: TypeMap,
  generation: number,
): TeamCoverageResult
```

### `src/data/gen1SpecialOverrides.ts` (new)

```ts
/**
 * Pokémon whose Gen 1 Special stat differs from their modern special-attack value.
 * Key = PokéAPI lowercase name. Value = correct Gen 1 Special base stat.
 *
 * Verify each entry against a reference Gen 1 calculator (e.g. Pokémon Showdown).
 */
export const GEN1_SPECIAL_OVERRIDES: Record<string, number> = {
  gengar: 100, // modern SpAtk = 130; Gen 1 Special = 100
  // add more confirmed cases during implementation
}
```

---

## Hook Changes

### `useTeamConfiguration`

Add `level` to team member state:

- Input: team slot editor renders a level number input (1–100, no default placeholder text = empty, shows damage calc disabled state if blank)
- Storage: `TeamMemberConfig.level?: number` persists to localStorage via the existing per-game key; old saves without `level` remain valid
- Validation: level 1–100 if present; out-of-range shows an inline error

No new API calls inside this hook — level is user input only.

### `useMatchupMatrix`

This hook currently resolves configured moves to `{ name, type }` pairs and calls `calcEffectiveness` to build offense/defense groups. V2 expands it:

1. Call `getMoveDetail` instead of `getMoveType` for each configured move (gets type + basePower + damageClass).
2. Pull `level` from `selectedTeamMember.level` (already in `TeamMemberConfig` after the type change).
3. Pull opponent level from either gym data (for Gym Leader mode) or `opponentLevel` prop (for Free Battle mode). Gym data levels require `GymPokemon.level` to be populated.
4. Call `rankMoves` (from `damageCalc.ts`) and include the result in the hook's output.
5. Output type change:

```ts
// New fields on MatchupViewModel
export interface MatchupViewModel {
  opponent: Pokemon
  player: Pokemon
  offense: OffenseGroup // existing
  defense: DefenseGroup // existing
  summary: MatchupSummary // existing
  moveRecommendations: MoveRecommendation[] // NEW: ranked by damage floor
  attackerLevel: number | null // NEW: for display
  defenderLevel: number | null // NEW: for display
  damageCalcAvailable: boolean // NEW: false when either level missing
}
```

### `useTeamCoverage` (new)

```ts
function useTeamCoverage(params: {
  teamMembers: TeamMemberConfig[]
  teamNames: string[]
  generation: number
  typeMap: TypeMap | null
  onError: (msg: string | null) => void
}): {
  coverage: TeamCoverageResult | null
  loading: boolean
}
```

Fetches `Pokemon` and `MoveDetail[]` for each team member (reuses `getPokemon` + `getMoveDetail` which are already called by `useMatchupMatrix` — browser HTTP cache prevents duplicate network calls). Calls `analyzeTeamCoverage` from `teamCoverage.ts`. Only runs when the team is fully populated with valid names.

---

## Component Changes

### `TeamEditorPanel`

- Add a **level input** to each team slot card:
  - `type="number"` min=1 max=100, no default value (placeholder = "Level")
  - Reads/writes `TeamMemberConfig.level`
  - Inline validation: shows error if out of 1–100 range
  - Slot without a level shows a subtle "⚠ Set level for damage calc" note instead of blocking save

- Add **move inline detail** after a move is selected:
  - Fetch `MoveDetail` on move selection and display: type badge + damage class chip (`Physical` / `Special` / `Status`) + base power number
  - Loading: show skeleton until `getMoveDetail` resolves
  - Status moves: show just the type badge + "Status" chip, no power

- Add **team coverage panel** as a collapsible section at the bottom:
  - Toggle: "Show team coverage ▾"
  - Rendered by a new `TeamCoveragePanel` component
  - Powered by `useTeamCoverage`
  - Only renders when typeMap is ready

### `OffenseSection` / `MoveList`

Currently renders move name + type effectiveness label. V2 adds:

- Damage range display: "XX–YY HP" (or "?–? HP" when opponent level unknown)
- Crit range on hover/tap: "(crit: XX–YY HP)"
- `damageCalcAvailable = false` state: shows type effectiveness only, no damage column
- Highlight the top-damage move (highest `damageRange.min`) per matchup

### `TeamCoveragePanel` (new component)

```
TeamCoveragePanel
  OffensiveCoverageGrid     — 18 type pills, filled = team can hit ≥2×, hollow = can't
  DefensiveGapsGrid         — types no team member resists (shown in red/warning)
```

Lives in `TeamEditorPanel` as a collapsible section. Not visible in the battle view.

---

## Data Changes

### Gym data files (`src/data/gyms/*.ts`)

Each `GymPokemon` entry gains a `level: number` field. This is a data entry task — no new API calls. Every existing game file (emerald.ts, red.ts, crystal.ts, etc.) needs to be updated.

Source of truth for gym Pokémon levels: Bulbapedia or Serebii gym leader pages. Verify at least one game's data against the game itself or a trusted reference during QA.

Example delta for `emerald.ts`:

```ts
// Before
{ name: 'geodude' }

// After
{ name: 'geodude', level: 12 }
```

### `src/data/gen1SpecialOverrides.ts`

New file. Start with confirmed Gengar (Gen 1 Special = 100). Grow during implementation as other discrepancies are found.

---

## Data Flow

```
User selects opponent
  └─ useMatchupMatrix
       ├─ getPokemon(opponent, { generation })   → Pokemon (with stats, cached pkm_v3_*)
       ├─ getPokemon(player,   { generation })   → Pokemon (with stats, cached pkm_v3_*)
       ├─ getMoveDetail(move)  × N              → MoveDetail (cached move_v1_*)
       ├─ calcEffectiveness(...)                → type multiplier per move (typechart.ts)
       ├─ rankMoves(...)                        → MoveRecommendation[] (damageCalc.ts)
       └─ MatchupViewModel { ..., moveRecommendations, damageCalcAvailable }
            └─ MatchupContainer → OffenseSection → MoveList (shows damage range)

User opens team editor
  └─ useTeamCoverage
       ├─ getPokemon(each member)               → Pokemon (cached, no extra calls)
       ├─ getMoveDetail(each move)              → MoveDetail (cached, no extra calls)
       ├─ analyzeTeamCoverage(...)             → TeamCoverageResult (teamCoverage.ts)
       └─ TeamCoveragePanel (collapsible)
```

Key property: all PokéAPI calls use the same cache layer. A Pokémon's stats are fetched exactly once per session per game generation (from `getPokemon`). Move details are fetched once per move name (from `getMoveDetail`). Opening the coverage panel costs zero additional API calls if the battle view has already run.

---

## App.tsx Changes

V2 adds two new state fields and one prop thread:

```ts
// New state in App
opponentLevel: number | null // Free Battle mode only; null = opponent level unknown

// Thread opponentLevel down to useMatchupMatrix
// Thread gym Pokémon level from static data down to useMatchupMatrix
```

The level for Gym Leader mode comes from `GymPokemon.level` (static data), not user input. `App` already knows which gym Pokémon is selected. Pass its level into `useMatchupMatrix` as `defenderLevel`.

---

## COMPONENT_DESIGN.md Updates Required

After V2 ships, `docs/COMPONENT_DESIGN.md` needs:

- `TeamCoveragePanel` added to the component tree under `TeamEditorPanel`
- `useTeamCoverage` added to the hooks list
- `MatchupViewModel` contract updated (new fields)
- `useTeamConfiguration` contract updated (`level` field)

---

## localStorage Key Reference

| Key pattern                | Shape                                        | TTL    | Notes                              |
| -------------------------- | -------------------------------------------- | ------ | ---------------------------------- |
| `pkm_v3_{name}_g{gen}`     | `{ data: Pokemon, expires }`                 | 7 days | V2 Pokémon detail (with stats)     |
| `pkm_v2_{name}_g{gen}`     | _(stale)_                                    | —      | Old entries, abandoned not deleted |
| `move_v1_{normalizedName}` | `{ type, basePower, damageClass, expires }`  | 7 days | New persistent move detail         |
| `pkm_names_v2_{version}`   | `{ names, expires }`                         | 7 days | Unchanged                          |
| `pkm_names_v2_all`         | `{ names, expires }`                         | 7 days | Unchanged                          |
| `pkm_moves_v1_all`         | `{ names, expires }`                         | 7 days | Unchanged                          |
| `pkm_learnset_v1_{name}`   | `{ moves, expires }`                         | 7 days | Unchanged                          |
| `pmh_team_v1_{version}`    | `TeamMemberConfig[]` (now includes `level?`) | —      | Backward-compatible                |
| `pmh_game_v1`              | game version string                          | —      | Unchanged                          |

---

## Implementation Waves

### Wave A — Foundation (no UI visible changes)

1. **A1. Type changes** — Add `PokemonStats` and `MoveDetail` to `pokeapiClient.ts`. Expand `Pokemon`. Add `TeamMemberConfig.level?`. Update `GymPokemon`.
2. **A2. Cache bump** — Change `CACHE_PREFIX` to `'pkm_v3_'` in `pokemonCache.ts`. Verify existing tests still pass.
3. **A3. `getPokemon` expansion** — Extract and normalize `stats` from the `/pokemon` response. Store in the `pkm_v3_` cache. Update unit tests / PokéAPI contract tests (ROADMAP Wave 3.2).
4. **A4. `getMoveDetail`** — New function in `pokeapi.ts`. Persists to localStorage. Deprecate `getMoveType` (leave it as a thin wrapper calling `getMoveDetail` until all callers are updated).
5. **A5. Gym data levels** — Add `level` to every `GymPokemon` entry across all game files. Add unit test assertion that every entry has a non-zero level.
6. **A6. `gen1SpecialOverrides.ts`** — Create the file with Gengar as the first confirmed entry.

### Wave B — Damage Calculator Service

7. **B1. `damageCalc.ts`** — Implement `getGenerationGroup` and `calcDamageRange`. Unit tests: at least one case per generation group (Gen 1 special-based, Gen 2–5 2× crit, Gen 6+ 1.5× crit) matched against a reference calculator. Verify output matches PRD success criteria (±1 HP).
8. **B2. `rankMoves`** — Implement in `damageCalc.ts`. Unit tests: 10 manually verified cases for sort order.
9. **B3. `teamCoverage.ts`** — Implement `analyzeTeamCoverage`. Unit tests: verify at least one team with a clear gap reports it correctly.

### Wave C — Hook Wiring

10. **C1. `useTeamConfiguration` level** — Add level field to editor state, validation, and localStorage persistence. Existing team saves without level remain valid.
11. **C2. `useMatchupMatrix` expansion** — Call `getMoveDetail`, thread attacker/defender levels, call `rankMoves`, add new fields to `MatchupViewModel`. Do not yet render damage ranges in UI (keeps the PR focused).
12. **C3. `useTeamCoverage`** — New hook, wired to `teamCoverage.ts`.

### Wave D — UI

13. **D1. Team editor level input** — Add level number input to `TeamEditorPanel` slots. Existing move autocomplete UX unchanged.
14. **D2. Move inline detail** — Show type badge, damage class chip, and base power in the team editor after a move is picked.
15. **D3. Damage range in battle view** — Add damage range column to `MoveList` / `OffenseSection`. Degraded state when `damageCalcAvailable = false`.
16. **D4. `TeamCoveragePanel`** — New collapsible component, wired to `useTeamCoverage`, placed at the bottom of `TeamEditorPanel`.

### Wave E — Validation & Documentation

17. **E1. Acceptance criteria verification** — Manually verify all PRD success criteria (damage ranges, move sort order, coverage gaps, no 429s).
18. **E2. Architecture drift check** — Run `/architecture-drift` to confirm `COMPONENT_DESIGN.md` matches reality. Update it.
19. **E3. DECISIONS.md** — Add entries for any decisions made during implementation that aren't already recorded in the PRD.
20. **E4. ROADMAP.md update** — Add V2 wave items to the existing wave structure following the harness model.

---

## V3 Compatibility Checklist

Before merging each wave, verify:

- [ ] `damageCalc.ts` has zero imports from `react`, `src/hooks/`, `src/components/`, or any localStorage/DOM access
- [ ] `teamCoverage.ts` same constraint
- [ ] `pokeapi.ts` and `pokemonCache.ts` remain the only files that touch localStorage
- [ ] `useMatchupMatrix` and `useTeamCoverage` contain no business logic — only async orchestration and React state
- [ ] No new business logic added directly to any component

V3 packaging step will be: copy `src/services/` into a standalone TypeScript package. If the above constraints hold, nothing in the engine needs to change.

---

## Open Questions

These need answers before or during Wave B:

1. **Gen 1 Special override list completeness.** Starting with Gengar is documented. Who else changed between Gen 1 and Gen 2? Research during B1 using Bulbapedia's Gen 1 base stat tables and Showdown's Gen 1 calc.

2. **Variable base power moves** (Hidden Power, Return, Natural Gift, etc.). `basePower = null` currently means "status move." Variable-power moves also have `null` in PokéAPI. Proposal: show "?" damage range for any move where `basePower` is null and `damageClass !== 'status'`. Confirm this is acceptable UX before D3.

3. **Gym data level sourcing.** Is the plan to use standard gym leader level sets or challenge mode / rematch sets? Decision for Wave A5. Proposal: standard (first encounter) for all games, documented in a comment in each gym file.
