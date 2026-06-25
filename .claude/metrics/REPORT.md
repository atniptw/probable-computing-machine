# Agent Performance Report

_Generated 2026-06-25T18:08:49+00:00 from `ledger.jsonl` (12 issues scored). Window = last 10 vs prior 10, per difficulty band._

## Headline — autonomy burden & verify, per band

- **Small (S):** burden — → 0.0 (need more data) · verify — → 100% (need more data)
- **Medium (M):** burden — → 0.0 (need more data) · verify — → 86% (need more data)
- **Large (L):** burden — → 0.0 (need more data) · verify — → 67% (need more data)

> Getting better at autonomy = burden trends **down** while verify-first-try holds or rises. _(Need ≥2 windows in a band before a trend appears.)_

## Small (S) — 2 issues

**Quality**

| metric            | prior 0 | last 2 | trend            |
| ----------------- | ------- | ------ | ---------------- |
| review rounds     | —       | 0.0    | (need more data) |
| verify first try  | —       | 100%   | (need more data) |
| fixups after push | —       | 0.0    | (need more data) |

**Autonomy**

| metric                             | prior 0 | last 2 | trend            |
| ---------------------------------- | ------- | ------ | ---------------- |
| corrections (user redirected me)   | —       | 0.0    | (need more data) |
| avoidable handoffs                 | —       | 0.0    | (need more data) |
| wrong autonomous calls             | —       | 0.0    | (need more data) |
| necessary handoffs                 | —       | 0.0    | (need more data) |
| AUTONOMY BURDEN (corr+avoid+wrong) | —       | 0.0    | (need more data) |

## Medium (M) — 7 issues

**Quality**

| metric            | prior 0 | last 7 | trend            |
| ----------------- | ------- | ------ | ---------------- |
| review rounds     | —       | 0.0    | (need more data) |
| verify first try  | —       | 86%    | (need more data) |
| fixups after push | —       | 0.0    | (need more data) |

**Autonomy**

| metric                             | prior 0 | last 7 | trend            |
| ---------------------------------- | ------- | ------ | ---------------- |
| corrections (user redirected me)   | —       | 0.0    | (need more data) |
| avoidable handoffs                 | —       | 0.0    | (need more data) |
| wrong autonomous calls             | —       | 0.0    | (need more data) |
| necessary handoffs                 | —       | 0.1    | (need more data) |
| AUTONOMY BURDEN (corr+avoid+wrong) | —       | 0.0    | (need more data) |

## Large (L) — 3 issues

**Quality**

| metric            | prior 0 | last 3 | trend            |
| ----------------- | ------- | ------ | ---------------- |
| review rounds     | —       | 0.0    | (need more data) |
| verify first try  | —       | 67%    | (need more data) |
| fixups after push | —       | 0.3    | (need more data) |

**Autonomy**

| metric                             | prior 0 | last 3 | trend            |
| ---------------------------------- | ------- | ------ | ---------------- |
| corrections (user redirected me)   | —       | 0.0    | (need more data) |
| avoidable handoffs                 | —       | 0.0    | (need more data) |
| wrong autonomous calls             | —       | 0.0    | (need more data) |
| necessary handoffs                 | —       | 0.0    | (need more data) |
| AUTONOMY BURDEN (corr+avoid+wrong) | —       | 0.0    | (need more data) |

## Recent notes (for /retro distillation)

- #96: New data file + test, Gengar seed per DESIGN. Clean.
- #94: getMoveDetail + wrapper. Had to update move contract fixture for new required response fields (runtime) — fine.
- #93: Wide blast radius: tightened Pokemon.stats to required, updated 4 test construction sites + defensive normalizeStats. First verify failed format:check (prettier not in PostToolUse hook).
- #97: Spec had signature gaps (effectiveness, defenderName, type home) — resolved per DEC-0034. Controlled hand-computed tests; ±1-vs-Showdown deferred to E1. Auto-format hook made verify pass first try.
- #98: rankMoves tier sort (known>unknown>status). Clean, verify first try.
- #99: Pure coverage analysis; dropped redundant generation param (typeMap is gen-scoped). Verify first try, 100% cov.
- #100: Level draft/validation/persistence parallel to moves. Process slip: edited on main before issue-start (recovered via checkout -b).
- #102: useTeamCoverage hook. First verify failed: test passed unstable params causing effect re-run loop. Dropped redundant teamNames param. Closure-narrowing TS fix.
- #101: useMatchupMatrix damage-calc integration. Test rot risk: getMoveType->getMoveDetail; re-mocked so configured-move path stays covered. App threading deferred to wave D.
- #103: First visual issue. Visual-QA pre-screen (screenshots) → user approved. necessary_handoff = the Tier-1 visual sign-off (designed gate, not penalized).
