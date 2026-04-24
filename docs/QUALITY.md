# Quality Ledger

## Purpose

This document grades each product domain against current test coverage and records
the **known gaps** — what is not tested, and whether that is intentional
(`accepted`), unpaid-for work (`debt`), or waiting on something upstream
(`blocked`).

CI reports per-file coverage at a point in time. This ledger is the persistent,
human-readable counterpart: an agent adding tests can find the highest-value gap,
and a reviewer can tell whether a low-coverage file is a regression or a known
accepted trade-off.

**Scope:** unit + component tests under `src/tests/`. Playwright e2e specs in
`e2e/` provide additional coverage for UI interaction flows; where a gap is
covered by e2e rather than unit tests, that is noted.

## Aggregation Method

Percentages per domain are **weighted by statement count per file**, not averaged
across files. This prevents a tiny 100%-covered helper from cancelling out a
large, mostly-uncovered module. Formula:

```
domain_stmt_pct = sum(file.statements.covered) / sum(file.statements.total)
```

Branch and function percentages use the same weighting on their respective totals.

## Forward Reference

> Coverage numbers in the table below are refreshed by the doc-gardening agent
> (issue [#73](https://github.com/atniptw/probable-computing-machine/issues/73)).
> Until that lands, refresh manually by running `npm run test:coverage` and
> recomputing the weighted aggregates from `coverage/coverage-summary.json`.

## Domain Grades

_Last refreshed: 2026-04-24 (manual, against commit on `issue-75-quality-doc`)._

| Domain                     | Stmts %  | Branch % | Known Gaps (summary)                                                                 | Status     |
| -------------------------- | -------- | -------- | ------------------------------------------------------------------------------------ | ---------- |
| `components/AppView`       | 88.49 %  | 84.62 %  | `TeamEditorPanel` move-entry interaction branches not unit-tested                    | `accepted` |
| `components/MatchupViewer` | 94.01 %  | 69.81 %  | `DefenseSection` / `OffenseSection` "show more/less" toggle branches not unit-tested | `debt`     |
| `hooks`                    | 92.41 %  | 83.68 %  | `useMatchupMatrix` error/fallback branches; `useTeamConfiguration` edge branches     | `debt`     |
| `services`                 | 90.11 %  | 82.68 %  | `pokeapi.ts` learnset + error paths; `pokemonCache` stale-cache fallbacks            | `debt`     |
| `data`                     | 100.00 % | 100.00 % | `gyms/types.ts` reports 0/0 (type-only file, nothing to cover)                       | `accepted` |

Totals across the codebase: **95.32 % statements, 82.37 % branches** (see
`coverage/coverage-summary.json`).

## Per-Domain Detail

### `components/AppView` — `accepted`

7 files, 391 statements. Five of seven components are at 100 % statements / 100 %
branches. The weighting is pulled down almost entirely by one file.

**Gaps:**

- **`TeamEditorPanel.tsx` — 69.79 % stmts, 56.52 % branches, 20 % functions.**
  Uncovered code is the move-entry flow: `handleMoveKeyDown`, the suggestion-list
  blur/focus timing, and the "Add Move" click handler branches (lines ~137–186).
  These branches are driven by keyboard and focus-timing behavior that is
  exercised by `e2e/` Playwright specs against the running app. Adding jsdom
  unit tests for these paths would duplicate the e2e coverage with less fidelity
  (jsdom does not model focus/blur timing accurately). **Reason `accepted`:**
  covered by e2e; unit tests would be low-value given jsdom limitations.

### `components/MatchupViewer` — `debt`

5 files, 317 statements. `PokemonCard` and `MatchupContainer` are at 100 %
statements. Branch coverage (69.81 %) is the lowest of any domain.

**Gaps:**

- **`DefenseSection.tsx` — 33.33 % branches.** The `threatCount > 6` show-all
  toggle and the 0x / 2x / 0.5x indicator switch are not exercised.
- **`OffenseSection.tsx` — 33.33 % branches.** Same pattern: `moveCount > 6`
  show-all toggle and the 0x / 4x / 2x / 0.5x indicator switch untested.
- **`MoveList.tsx` — 61.53 % branches.** Conditional rendering branches for
  empty and truncated lists.

**Reason `debt`:** these are pure render branches with trivial inputs. A small
batch of component tests asserting both indicator outputs and the toggle
visibility would push branches past 90 %. Not intentional; just not written yet.

### `hooks` — `debt`

5 files, 698 statements. Three of five hooks are at 100 % statements.

**Gaps:**

- **`useMatchupMatrix.ts` — 74.32 % branches.** Uncovered ranges (lines
  ~382–393) are error-fallback branches when move resolution returns empty.
- **`useTeamConfiguration.ts` — 91.01 % branches.** Uncovered lines
  (~290–295) are edge-case validation branches.
- **`useMoveNameIndex.ts` — 66.66 % branches.** Uncovered lines 32–33 are
  a corrupt-cache fallback.

**Reason `debt`:** all three are error/fallback paths that _should_ have
targeted tests. These are the likeliest places for a silent regression.

### `services` — `debt`

5 files, 738 statements.

**Gaps:**

- **`pokeapi.ts` — 79.82 % statements, 85.91 % branches.** Largest gap in the
  codebase. Uncovered ranges (~214–227, ~319–353) are the learnset cache
  path and an additional fetch helper. `pokeapi.errors.test.ts` covers the
  retry / 404 / network-error contract but not the learnset read-through
  cache.
- **`pokemonCache.ts` — 74.28 % branches.** Uncovered lines (~216–217,
  ~241–242) are stale-cache fallback branches when network fetches fail.
- **`ranking.ts` — 82.85 % branches.** One uncovered line (120).
- **`typechart.ts` — 88.37 % branches.** Uncovered lines 175–179 appear to be
  an unused-type guard.

**Reason `debt`:** services are the core integration layer with PokéAPI.
Cache-fallback branches and learnset paths being untested is a real risk —
these are exactly the branches that fire only when the network misbehaves, and
they are where users would see user-visible breakage. Highest-value target
for new tests.

### `data` — `accepted`

12 files, 1904 statements. All gym data modules and `games.ts` are at 100 %.

**Gaps:**

- **`gyms/types.ts`** reports 0/0 statements, 0/0 branches. This is a
  type-only file (interfaces, no runtime code). v8 coverage reports it as
  `0 %` cosmetically; there is literally nothing to execute. **Reason
  `accepted`:** artifact of the reporter, not a gap.

## Status Values

- **`accepted`** — intentional trade-off. Tests would be low-value (covered
  elsewhere, e.g. e2e) or not meaningful (type-only code). Do not target this
  for new unit tests without revisiting the reasoning here.
- **`debt`** — not intentional, just not written yet. High-value target for
  an agent adding tests. Prefer these over raising an already-high percentage.
- **`blocked`** — waiting on an upstream change (new contract, external
  dependency, design decision). None currently.

## How to Use This Document

- **Adding tests?** Scan the table for the lowest branch % with status `debt`.
  That is the highest-value target. At the moment: **`components/MatchupViewer`**
  (69.81 % branches) and the uncovered branches in **`services/pokeapi.ts`**
  and **`services/pokemonCache.ts`**.
- **Reviewing a PR that drops coverage?** Check whether the dropped file is
  listed under an `accepted` gap. If not, treat the drop as a regression.
- **Updating this doc?** Re-run `npm run test:coverage`, recompute the
  weighted aggregates, and update both the table and the per-domain detail.
  The doc-gardening agent (#73) will automate this.
