# Agent Performance Report

_Generated 2026-06-26T14:26:13+00:00 from `ledger.jsonl` (15 issues scored). Window = last 10 vs prior 10, per difficulty band._

## Headline — autonomy burden & verify, per band

- **Small (S):** burden — → 0.0 (need more data) · verify — → 100% (need more data)
- **Medium (M):** burden — → 0.0 (need more data) · verify — → 78% (need more data)
- **Large (L):** burden — → 0.0 (need more data) · verify — → 75% (need more data)

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

## Medium (M) — 9 issues

**Quality**

| metric            | prior 0 | last 9 | trend            |
| ----------------- | ------- | ------ | ---------------- |
| review rounds     | —       | 0.0    | (need more data) |
| verify first try  | —       | 78%    | (need more data) |
| fixups after push | —       | 0.0    | (need more data) |

**Autonomy**

| metric                             | prior 0 | last 9 | trend            |
| ---------------------------------- | ------- | ------ | ---------------- |
| corrections (user redirected me)   | —       | 0.0    | (need more data) |
| avoidable handoffs                 | —       | 0.0    | (need more data) |
| wrong autonomous calls             | —       | 0.0    | (need more data) |
| necessary handoffs                 | —       | 0.3    | (need more data) |
| AUTONOMY BURDEN (corr+avoid+wrong) | —       | 0.0    | (need more data) |

## Large (L) — 4 issues

**Quality**

| metric            | prior 0 | last 4 | trend            |
| ----------------- | ------- | ------ | ---------------- |
| review rounds     | —       | 0.0    | (need more data) |
| verify first try  | —       | 75%    | (need more data) |
| fixups after push | —       | 0.2    | (need more data) |

**Autonomy**

| metric                             | prior 0 | last 4 | trend            |
| ---------------------------------- | ------- | ------ | ---------------- |
| corrections (user redirected me)   | —       | 0.0    | (need more data) |
| avoidable handoffs                 | —       | 0.0    | (need more data) |
| wrong autonomous calls             | —       | 0.0    | (need more data) |
| necessary handoffs                 | —       | 0.2    | (need more data) |
| AUTONOMY BURDEN (corr+avoid+wrong) | —       | 0.0    | (need more data) |

## Recent notes (for /retro distillation)

- #97: Spec had signature gaps (effectiveness, defenderName, type home) — resolved per DEC-0034. Controlled hand-computed tests; ±1-vs-Showdown deferred to E1. Auto-format hook made verify pass first try.
- #98: rankMoves tier sort (known>unknown>status). Clean, verify first try.
- #99: Pure coverage analysis; dropped redundant generation param (typeMap is gen-scoped). Verify first try, 100% cov.
- #100: Level draft/validation/persistence parallel to moves. Process slip: edited on main before issue-start (recovered via checkout -b).
- #102: useTeamCoverage hook. First verify failed: test passed unstable params causing effect re-run loop. Dropped redundant teamNames param. Closure-narrowing TS fix.
- #101: useMatchupMatrix damage-calc integration. Test rot risk: getMoveType->getMoveDetail; re-mocked so configured-move path stays covered. App threading deferred to wave D.
- #103: First visual issue. Visual-QA pre-screen (screenshots) → user approved. necessary_handoff = the Tier-1 visual sign-off (designed gate, not penalized).
- #104: Move detail badges. First verify failed new lint rule (sync setState in effect); fixed via async run(). Visual-QA approved.
- #105: Damage range in battle view — full A->B->C engine live in UI. Multi-file integration (App threading + OffenseSection/MoveList). Visual-QA approved (156-184 HP + ?-? state).
- #106: TeamCoveragePanel + useTypeMap. Visual-QA approved. Surfaced a pre-existing typeMap bug (Stellar in Gen 3) — filed as follow-up.
