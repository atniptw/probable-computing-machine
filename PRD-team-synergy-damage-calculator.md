# PRD: Team Synergy & Damage Calculator

**Feature name:** Team Synergy & Damage Calculator  
**Status:** Draft  
**Date:** 2026-06-23

---

## Problem / Motivation

The current app answers one question well: _can my Pokémon's type beat this opponent's type?_ That's useful at the start of a playthrough, but players quickly hit its ceiling. Type effectiveness is binary — it doesn't tell you _how much_ damage you'll deal, whether your team has any Pokémon that can actually land a hit on a given opponent, or whether your whole team melts to the same two types.

Three gaps worth closing:

1. **Damage is guesswork.** Knowing Flamethrower is 2× vs. Venusaur doesn't tell you if it one-shots. Players have to guess or look up base stats elsewhere.
2. **Team coverage is invisible.** The app is 1v1 only. You can't see "my whole team is weak to Ice" without manually checking each member.
3. **Team setup is too shallow.** The current editor captures Pokémon names and moves but not levels — making any future damage calc approximate by design. The right fix is a richer one-time setup flow, not a hidden default.

---

## In Scope (v1 of this feature)

**Richer team setup (the foundation everything else builds on)**

The design principle: setup is a one-time investment done outside of battle. Once your team is configured, the battle view requires no additional input — you just select an opponent and read results. Incremental updates (leveling up, learning a new move, swapping a Pokémon) should be fast, not a full re-entry.

Each team slot captures:

- **Pokémon name** — autocomplete from game Pokédex (existing)
- **Level** — required; number input 1–100; no default (blank until the user enters it)
- **Moves** — up to 4, autocomplete from move index (existing); once a move is selected, show its type badge, damage class (Physical / Special / Status), and base power inline as confirmation

UX flow:

1. _Full setup (first time or new playthrough):_ User fills out all 6 slots with name, level, and moves before entering battle view. Incomplete slots (missing level or no moves) can be saved as drafts but the damage calc degrades gracefully — shows type effectiveness only, no damage range, with a prompt to complete the slot.
2. _Incremental update:_ Tap any slot card to edit just that member. Common quick actions: bump level, swap one move, replace the whole slot.
3. _Battle view:_ No setup friction. Select opponent, read matchup cards. Level and moves are already stored.

For Gym Leader mode, opponent Pokémon levels can be pre-populated from the existing gym data — the user doesn't need to enter them.

For Free Battle mode, the user enters the opponent's Pokémon name (existing) and optionally their level. If the opponent level is omitted, damage ranges are shown as "?" with a note that the opponent's level is unknown.

**Damage range calculator**

- Compute a min–max damage range for each of your team member's moves against the selected opponent using the correct formula for the selected game's generation (see table below).
- Uses the level stored in team setup for the attacker; opponent level from gym data or user input for the defender. No fallback default.
- Use each Pokémon's base stats from PokéAPI (no IVs/EVs).
- Range = minimum roll to maximum roll per the generation's random factor, plus a Critical Hit column.
- Render as a "X–Y HP" range alongside the existing type-effectiveness badge.

**Per-generation formula differences** (all supported games in scope):

| Games     | Gen | Core formula                           | Atk/Def stat used                       | Critical multiplier | Random factor            |
| --------- | --- | -------------------------------------- | --------------------------------------- | ------------------- | ------------------------ |
| Red       | 1   | `((2L/5+2) × BP × Atk / Def) / 50 + 2` | Single `special` stat for special moves | 2×                  | 217–255 / 255 (~85–100%) |
| Crystal   | 2   | Same structure, SpAtk/SpDef split      | `special-attack` / `special-defense`    | 2×                  | 217–255 / 255            |
| Emerald   | 3   | `((2L/5+2) × BP × Atk / Def) / 50 + 2` | SpAtk/SpDef                             | 2×                  | 217–255 / 255            |
| Platinum  | 4   | Same as Gen 3                          | SpAtk/SpDef                             | 2×                  | 217–255 / 255            |
| Black 2   | 5   | Same as Gen 3                          | SpAtk/SpDef                             | 2×                  | 217–255 / 255            |
| X         | 6   | Same as Gen 3                          | SpAtk/SpDef                             | **1.5×**            | 85–100 / 100             |
| Ultra Sun | 7   | Same as Gen 6                          | SpAtk/SpDef                             | 1.5×                | 85–100 / 100             |
| Sword     | 8   | Same as Gen 6                          | SpAtk/SpDef                             | 1.5×                | 85–100 / 100             |
| Scarlet   | 9   | Same as Gen 6                          | SpAtk/SpDef                             | 1.5×                | 85–100 / 100             |

The Gen 1 Special stat is the primary structural difference — all other gens use the same core formula with only the critical multiplier and random roll range varying.

**Move recommender**

- For a selected opponent, rank each team member's moves by expected damage (highest floor first).
- Show move name, type badge, base power, and damage range.
- Highlight the top move per team member.

**Team coverage panel**

- For your saved team (up to 6), show a type-coverage grid: which of the 18 types your team can hit super-effectively (offensive coverage), and which types your team has zero resistance to (defensive gaps).
- Surface as a collapsible panel — useful for team-building, not needed during a live battle.

---

## Explicitly Deferred

- Weather, terrain, and field effects (sun/rain/electric terrain, etc.)
- Held items and abilities
- Status condition modifiers (burn halving physical attack, etc.)
- Accuracy weighting in expected damage (move accuracy × base power)
- IV/EV inputs — base stats only for now
- Double battle support

---

## V3 Forward Compatibility Constraint

V3 will extract the computation core into a standalone engine consumable by both the UI and a battle bot. To avoid a costly V3 rewrite:

- All new V2 computation logic (damage calculation, team coverage analysis, move ranking) **must live in `src/services/`**, not in React hooks.
- Hooks are wrappers only — they call into services and manage React loading/error state. No business logic.
- Services must remain pure TypeScript with no React, DOM, or browser-storage dependencies.

This is already the pattern established by `calcEffectiveness` and `computeMatchups`. V2 just needs to stay disciplined about it. V3 then becomes a packaging step, not a rewrite.

---

## Key Assumptions

1. PokéAPI's `/pokemon/{name}` already returns `stats[]` in the response. V2 will bump the Pokémon cache key to `pkm_v2_{name}` and expand the cached shape to `{ types, stats, cachedAt }`. The `pkm_v1_{name}` entries will be abandoned (not migrated).
2. Same clean-break approach applies to any other cache keys that need to expand in V2.
3. `/move/{name}` already returns `base_power` and `damage_class.name` ("physical" | "special" | "status"). The current `getMoveType` call already hits this endpoint but only captures the type string.
4. Gym leader Pokémon levels can be added to the existing gym data files (e.g. `src/data/gyms/emerald.ts`) without a new API call — they're static, known values. This is a data entry task, not an engineering task.
5. The current `TeamMemberConfig` type (`{ name: string, moves?: string[] }`) needs a `level?: number` field. Storing it as optional lets existing saved teams remain valid; missing level just disables damage calc for that slot.

---

## Resolved Design Decisions

**Move data caching** — Use `move_v1_{name}` in localStorage mirroring the Pokémon cache pattern, storing `{ type, basePower, damageClass, cachedAt }` with the same 7-day TTL. The V2 clean-break rule applies: bump to `move_v2_{name}` if the shape needs to expand later.

**Gen 1 Special stat** — PokéAPI returns modern `special-attack` and `special-defense` for all Pokémon, not the original Gen 1 `special` base stat. For most Gen 1 Pokémon `special-attack` equals the original Special and is safe to use. However, a small number had their SpAtk changed when Game Freak made the Gen 2 split — Gengar is the most notable (Gen 1 Special = 100, modern SpAtk = 130). Use `special-attack` from PokéAPI as the default and maintain a small hardcoded lookup table (`src/data/gen1SpecialOverrides.ts`) for confirmed exceptions. Verify against a reference Gen 1 damage calculator (e.g. Pokémon Showdown's calc) during implementation to catch any others.

**Opponent stats fetch timing** — Fetch eagerly when the opponent is selected. Stats are already in the `/pokemon/{name}` payload fetched for types — no extra API call, no rate limit cost. Lazy loading would cause a visible loading flash when the damage panel opens. Expand `getPokemon` to extract and cache stats alongside types in the `pkm_v2_{name}` entry.

**Coverage panel placement** — Inside the team editor as a collapsible section, not a separate route or battle-view tab. Coverage is a team-building concern, not a per-battle concern. A "Show team coverage" toggle at the bottom of the team editor keeps the battle view clean and reinforces the "setup once" mental model.

---

## Success Criteria

- Damage range for at least one test case per generation group (Gen 1 Special-based, Gen 2–5 2× crit, Gen 6+ 1.5× crit) matches a reference calculator to within ±1 HP.
- Move recommender lists moves in strictly correct damage order for at least 10 manually verified cases.
- Team coverage panel correctly identifies at least one type gap for any team that demonstrably has one.
- No `RateLimitError` (429) during typical session load (6-member team, 4 moves each, cold cache).
- All new PokéAPI calls covered by contract tests (per the pattern in Wave 3.2 of the roadmap).
- Existing test coverage thresholds do not regress.
