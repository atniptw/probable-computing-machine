# Concept: V3 — Pokémon Battle Engine

**Status:** Pre-spec (stub)  
**Date:** 2026-06-23  
**Depends on:** V2 shipping with services-layer discipline (see V2 PRD)

---

## Vision

Extract the V2 computation core into a standalone, framework-agnostic TypeScript engine that can be consumed by:

1. **The existing React UI** — same as today, but importing from a package instead of `src/services/` directly
2. **A battle bot** — an agent that can evaluate team compositions, recommend moves, and make in-battle decisions autonomously

---

## What the Engine Exposes

Building on what V2 ships:

- `calcDamageRange(move, attacker, defender, gen)` — min/max damage for a move in a given generation
- `rankMoves(moves, attacker, opponent, gen)` — moves sorted by expected damage
- `analyzeTeamCoverage(team, gen)` — offensive coverage and defensive gaps for a full team
- `calcEffectiveness(attackerTypes, defenderTypes, typeMap)` — already exists

What the bot additionally needs (V3 new work):

- `evaluatePosition(gameState)` — score a battle position (team HP totals, type matchups, speed tiers)
- `recommendAction(gameState, gen)` — given current in-battle state, return the best move or switch decision
- `scoreRoster(candidates, challenge, gen)` — given a pool of Pokémon and a target challenge (e.g. a gym), score which 6 to bring

---

## Bot Platform Options

### Option A: Pokémon Showdown

- Competitive battle simulator at pokemonshowdown.com
- Public battle protocol, documented API, existing Node.js client libraries
- Bots are a well-established pattern in the community
- **Pros:** No emulator needed, TypeScript-native, easy to test, Gen 6–9 formats well-supported
- **Cons:** Competitive formats only, not the full game experience (no catching, no overworld)
- **Verdict:** Lowest barrier to a working bot. Best starting point.

### Option B: ROM + Emulator (mGBA / BizHawk)

- Play an actual game ROM via an emulator with scripting support (Lua or Python bridges)
- Full game experience: catching, overworld, story progression
- **Pros:** Real game, all generations
- **Cons:** Significant complexity — must read game memory or use screenshot OCR to get state into the engine; legal gray area depending on ROM sourcing
- **Verdict:** Right long-term target if the bot goal is a full playthrough agent. Much harder than Showdown.

### Option C: Custom Simulator

- Build a simplified battle simulator in TypeScript, battle rules only
- Full control over scope and generation support
- **Pros:** No external dependency, engine and simulator co-located
- **Cons:** Essentially rebuilding Showdown — high effort for little gain unless custom rules are needed
- **Verdict:** Avoid unless Options A and B both prove unworkable.

---

## Recommended V3 Sequence

1. **Package the engine.** Extract `src/services/` into a standalone TypeScript package (could stay as a local monorepo package initially — no need to publish to npm yet). UI imports from the package; nothing changes visually.
2. **Define the bot interface.** Implement `evaluatePosition` and `recommendAction` against the Pokémon Showdown battle protocol.
3. **Wire up a Showdown bot.** Connect engine to a Showdown client library. Start with a single-format, single-generation bot (e.g. Gen 9 Random Battle) to validate the loop.
4. **Expand.** Add more generations, smarter position evaluation, roster scoring.

---

## Open Questions (resolve before V3 spec)

- Monorepo or separate repo for the engine package?
- Which Showdown format for the first bot target? (Random Battle removes team-building complexity and is a clean isolated test of move decision-making.)
- Does the bot need to handle Pokémon catching/team-building from a ROM, or is battle decision-making the initial scope?
