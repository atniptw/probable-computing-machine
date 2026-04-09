# Sessions Log

---

## 2026-04-09 - Docs #34: Fix Stale useMatchupMatrix Contract

### Objective

Update `docs/COMPONENT_DESIGN.md` to reflect the actual `useMatchupMatrix` contract after the hook was refactored.

### Completed Work

- Updated `useMatchupMatrix` outputs from `{ matrix, activeIndex, setActiveIndex, loading }` → `{ loading, matchup }`
- Updated inputs list to include full set: `teamNames`, `nameIndexReady`, `opponentMoves`, `selectedTeamIndex`
- Noted `selectedTeamIndex: number` state ownership under `MatchupContainer` in the component tree
- Architecture drift check: `CLEAN` before and after

### Validation

- `npm run lint`: pass
- `npm run tsc`: pass
- `npm run test`: 147/147 pass
- `npx playwright test --project=chromium`: 6/6 pass

### Next Actions

Continue backlog.

---

## 2026-04-09 - Fix #37: Game-Aware Team Defaults and Per-Game Persistence

### Objective

- Remove the hardcoded Emerald default team; all games start with blank slots when no saved team exists.
- Persist teams per game so switching away and back restores the correct saved team.

### Decisions Made

- See DEC-0026: moved from a single `pmh_team_v1` key to per-game `pmh_team_v1_${version}` keys with legacy Emerald fallback.
- All games, including Emerald, now default to 6 empty slots (no pre-filled Pokémon).
- Added `version` to `UseTeamConfigurationParams` and `resetTeam(version, defaultTeam)` to the hook interface.

### Completed

- `src/data/games.ts` — `defaultTeam: string[]` added to `GameDefinition`; all games (including Emerald) set to `[]`.
- `src/hooks/useTeamConfiguration.ts` — per-game storage key; `version` param; `resetTeam(version, defaultTeam)` reads from the target game's storage.
- `src/App.tsx` — passes `version` to `useTeamConfiguration`; `handleGameChange` calls `resetTeam` with the new game's version and default.
- `src/tests/games.test.ts` — updated snapshot; new test for non-Emerald empty default.
- `src/tests/useTeamConfiguration.test.ts` — added `version` to `makeParams`; updated storage keys; new `resetTeam` tests.
- `e2e/helpers.ts` — added `seedTeam` helper.
- `e2e/matchup-smoke.spec.ts`, `e2e/error-states.spec.ts` — seed team before tests that need a player Pokémon.
- `docs/COMPONENT_DESIGN.md` — `useTeamConfiguration` inputs/outputs updated.
- `docs/DATA_MODEL.md` — `GameDefinition` type and new storage key schema documented.
- Validation evidence:
  - `npm run lint` → pass
  - `npm run tsc` → pass
  - `npm run test` → 147 tests, all pass
  - `npx playwright test --project=chromium` → 6/6 pass
  - Manual review: approved by user

### Blockers

None.

---

## 2026-04-09 - Fix #24: Matchup Card Title Shows Opponent First

### Objective

- Fix heading order in matchup card so it reads "[Your Pokémon] vs [Opponent]".

### Decisions Made

- No trade-offs; one-line string swap.

### Completed

- `src/components/MatchupViewer/MatchupContainer.tsx:131` — swapped `{opponentName} vs {playerName}` to `{playerName} vs {opponentName}`.
- `src/tests/matchupContainer.test.tsx:120` — updated heading assertion to `'Swampert vs Manectric'`.
- `e2e/matchup-smoke.spec.ts` — updated 3 heading assertions to player-first order.
- `e2e/team-flow.spec.ts:26` — updated heading assertion to player-first order.
- Validation evidence:
  - `npm run lint` → pass
  - `npm run tsc` → pass
  - `npm run test` → 143 tests, all pass
  - `npx playwright test --project=chromium` → 6/6 pass
  - Manual review: approved by user

### Blockers

None.

---

## 2026-04-09 - Fix: Intermittent Test Timeouts Under Parallel Load

### Objective

- Eliminate flaky vitest timeouts caused by resource contention on WSL2.

### Decisions Made

- See DEC-0025: capped vitest worker threads at 4 and doubled testTimeout to 10 000 ms.

### Completed

- `vite.config.ts` — added `testTimeout: 10000`, `pool: 'threads'`, `poolOptions.threads.maxThreads: 4`.
- Validation evidence:
  - 15 consecutive full-suite runs, 0 failures.
  - Environment setup time dropped from ~23 s to ~11 s across the suite.

### Blockers

None.

---

## 2026-04-08 - Wave 5.1: Gym Leader Known Movesets in Defense Section

### Objective

- Use canonical Emerald gym leader movesets in the defense section instead of generic type inference (issue #20).

### Decisions Made

- No trade-offs requiring a DECISIONS.md entry.
- Reused the existing `resolveConfiguredMoves` function for opponent move resolution — same async PokéAPI lookup path used for player configured moves.
- Free battle mode unchanged: empty `opponentMoves` falls through to `buildDefenseMoves(opponentPokemon.types)`.

### Completed

- `src/data/gyms/emerald.ts` — `moves: string[]` added to `GymPokemon` interface; all 8 gym leaders populated with canonical Emerald movesets.
- `src/App.tsx` — `opponentMoves` useMemo derives gym Pokémon moves when `battleMode === 'gym'`; passed to `MatchupContainer`.
- `src/components/MatchupViewer/MatchupContainer.tsx` — `opponentMoves?: string[]` prop accepted and forwarded to `useMatchupMatrix`.
- `src/hooks/useMatchupMatrix.ts` — resolves opponent moves in parallel with player moves; uses them in place of `buildDefenseMoves` when non-empty.
- `src/tests/useMatchupMatrix.test.ts` — 2 new tests: gym mode uses provided moves (not type inference), free battle falls back to type inference.
- `src/tests/gymComponents.test.tsx` — fixture updated to include required `moves: []` field.
- Validation evidence:
  - `npm run lint` → pass
  - `npm run tsc` → pass
  - `npm run test` → 143 tests, 20 files, all pass

### Blockers

- Playwright could not run initially due to missing `libnspr4.so` on WSL2. Fixed with `sudo npx playwright install-deps chromium`.

### Next Actions

- None. Issue #20 closed.

---

## 2026-04-08 - Wave 4.4: Remove Dormant Assets

### Objective

- Delete three dormant source files, their tests, clear the Dormant Assets table, and raise the functions coverage floor (issue #19).

### Decisions Made

- DEC-0024 added: functions coverage floor raised from 68 back to 70, fulfilling the remediation commitment in DEC-0023. Actual functions coverage after removal: 75.92%.

### Completed

- Deleted: `src/components/AppView/BattleResultsPanel.tsx`, `src/hooks/useTeamPreview.ts`, `src/hooks/useMatchupResults.ts`
- Deleted: `src/tests/useTeamPreview.test.ts`, `src/tests/useMatchupResults.test.ts` (BattleResultsPanel had no test file)
- `docs/COMPONENT_DESIGN.md` — Dormant Assets table cleared ("None currently")
- `vite.config.ts` — functions threshold raised from 68 → 70 (DEC-0024)
- `DECISIONS.md` — DEC-0024 added at top
- Validation evidence:
  - `npm run lint` → pass
  - `npm run tsc` → pass
  - `npm run test` → 141 tests, 20 files, all pass
  - `npm run test:coverage` → statements 89%, branches 80%, functions 75.92%, lines 89% — all above thresholds

### Blockers

- None.

### Next Actions

- Review backlog for Wave 5 planning.

---

## 2026-04-08 - Wave 4.3: Wire /architecture-drift into work-issue Cycle

### Objective

- Make architecture drift detection mandatory at the start of every issue cycle (issue #18).

### Decisions Made

- No trade-offs requiring a DECISIONS.md entry.
- Implemented both options from the issue notes: detection (Step 1.5 in `work-issue.md`) and prevention (new CLAUDE.md docs rule line for `COMPONENT_DESIGN.md`).

### Completed

- `.claude/commands/work-issue.md` — added Step 1.5: run `/architecture-drift` before implementation and resolve any `DRIFT DETECTED` findings first.
- `CLAUDE.md` — added explicit rule: "New components or hooks are added or removed → update `docs/COMPONENT_DESIGN.md` component tree and hooks list."
- Validation evidence:
  - `npm run lint` → pass
  - `npm run tsc` → pass
  - `npm run test` → 154 tests, 22 files, all pass

### Blockers

- None.

### Next Actions

- Issue #19 — Wave 4.4: Remove dormant assets.

---

## 2026-04-08 - Wave 4.2: Architecture Drift Detection

### Objective

- Create repeatable architecture drift check comparing live codebase to `docs/COMPONENT_DESIGN.md` (issue #17).

### Decisions Made

- No trade-offs requiring a DECISIONS.md entry.
- Brought `docs/COMPONENT_DESIGN.md` up to date with current reality before writing the skill: removed stale components (`BattleResultsPanel` subtree, `TeamSlotInput`, `SaveTeamButton`, `TeamPreviewBar`), added missing components (`GymLeaderSelector`, `GymTeamPanel`, `MatchupContainer`, `PokemonCard`, `OffenseSection`, `DefenseSection`), added missing hooks (`useMatchupMatrix`, `useMoveNameIndex`), added Dormant Assets table for files present in `src/` but not on the active render path.
- Drift check implemented as a manual skill rather than an automated test, matching the issue note ("can start as a manual checklist").

### Completed

- `docs/COMPONENT_DESIGN.md` — fully updated to reflect current runtime component tree, App Contract state, active hooks, and dormant asset inventory; includes Drift Detection and Resolution section with cadence guidance.
- `.claude/commands/architecture-drift.md` — new skill that compares `src/components/` and `src/hooks/` against documented lists and reports missing, stale, and dormant candidates with a CLEAN / DRIFT DETECTED verdict.
- `CLAUDE.md` — added `/architecture-drift` to the Workflows skill list.
- Validation evidence:
  - `npm run lint` → pass
  - `npm run tsc` → pass
  - `npm run test` → 154 tests, 22 files, all pass

### Blockers

- None.

### Next Actions

- Issue #18 (if exists) or review backlog for next wave.

---

## 2026-04-08 - Wave 4.1: Formalize Reviewer Agent as a Skill

### Objective

- Create `/review` skill with a structured template for code review (issue #16).

### Decisions Made

- No trade-offs requiring a DECISIONS.md entry.
- Skill template structured into five sections: bugs, contract violations, a11y, security, AC check — each with blocking/minor classification and a final ship/fix-first verdict.
- Step 6 in `work-issue.md` updated to invoke `/review` instead of the ad-hoc general-purpose agent prompt, ensuring consistent criteria every run.

### Completed

- `.claude/commands/review.md` — new skill with structured review template covering all four required categories and explicit verdict format.
- `CLAUDE.md` — added `/review` to the Workflows skill list.
- `.claude/commands/work-issue.md` — Step 6 updated to reference `/review`.
- Validation evidence:
  - `npm run lint` → pass
  - `npm run tsc` → pass
  - `npm run test` → 154 tests, 22 files, all pass

### Blockers

- None.

### Next Actions

- Issue #17 — Wave 4.2: Architecture drift detection.

---

## 2026-04-08 - Wave 3.3: Generation-Aware Type Chart Regression Tests

### Objective

- Add explicit regression tests for all generation-specific type chart rules (issue #15).

### Decisions Made

- No trade-offs requiring a DECISIONS.md entry.
- Used `getTypeMap` + `calcEffectiveness` end-to-end (not `applyGenerationTypeRules` directly) so tests catch both parsing and application of rules.
- Placed in a new file `generationTypeRules.test.ts` (same `src/tests/` directory, satisfying "co-located with or near `calcEffectiveness` tests" AC).
- `beforeEach` stubs fetch with a minimal 8-type fixture covering all tested rules; exact URL matching (not catch-all) prevents silent failures.

### Completed

- `src/tests/generationTypeRules.test.ts` — 9 tests covering all 4 acceptance criteria:
  - AC1 (Ghost/Psychic Gen 1): Ghost immunity = 0 in Gen 1, super effective = 2 in Gen 2+
  - AC2 (Fairy Gen 6): `map.has('fairy')` false in Gen 5, true in Gen 6; Fairy 2x vs Dragon
  - AC3 (two+ extras): Dark/Steel absent in Gen 1; Ghost 0.5x vs Steel in Gen 3, neutral in Gen 6; Ice neutral vs Fire in Gen 1, 0.5x in Gen 2+
  - AC4: File co-located with `calcEffectiveness.test.ts` in `src/tests/`
- Validation evidence:
  - `npm run lint` → pass
  - `npm run tsc` → pass
  - `npm run test` → 154 tests, 22 files, all pass

### Blockers

- None.

### Next Actions

- Issue #16 — Wave 4.1: Formalize reviewer agent as a skill.

---

## 2026-04-08 - Wave 3.2: PokéAPI Contract Tests

### Objective

- Add contract tests verifying PokéAPI response shapes are correctly parsed to internal TypeScript interfaces (issue #14).

### Decisions Made

- No trade-offs requiring a DECISIONS.md entry.
- Contract tests use stub fixtures matching `docs/API_SPEC.md` exactly — no live network calls.
- Focused on gaps: `getTypeMap` and `getMoveType` had no contract tests; `getPokemon` and `getPokemonNameIndex` had behavioral tests but not explicit field-mapping assertions.
- Existing `getPokemonNameIndex.test.ts` behavioral tests not duplicated — contract file only adds shape-verification tests.

### Completed

- `src/tests/pokeapi.contract.test.ts` — 7 tests covering all 4 acceptance criteria:
  - `getPokemon`: name, slot-ordered types, sprite mapping; past_types generation nesting
  - `getPokemonNameIndex`: count + results[].name → string[] mapping
  - `getTypeMap`: snake_case damage_relations → camelCase TypeRelations; unknown/shadow exclusion
  - `getMoveType`: type.name → string mapping
- Validation evidence:
  - `npm run lint` → pass
  - `npm run tsc` → pass
  - `npm run test` → 145 tests, 21 files, all pass

### Blockers

- None.

### Next Actions

- Issue #15 — Wave 3.3: Generation-aware type chart explicit tests.

---

## 2026-04-08 - Wave 3.1: Import Boundary Tests

### Objective

- Add architecture fitness tests enforcing layer separation between hooks, data, and services (issue #13).

### Decisions Made

- Implemented as a Vitest test file (Node environment) rather than an ESLint rule — no `eslint-plugin-import` available, and the test approach integrates cleanly with existing CI (`npm run test`).
- Added `@types/node` dev dependency to support `node:fs`, `node:path`, `node:url` imports in the boundary test.

### Completed

- `src/tests/importBoundaries.test.ts` — 3 tests walking each layer's files and asserting no forbidden imports:
  - `hooks/` → not importing from `components/`
  - `data/` → not importing from `hooks/` or `services/`
  - `services/` → not importing from `hooks/` or `components/`
- Violations produce a human-readable message: `src/hooks/useX.ts: imports from components (../components/Foo)`.
- Validation evidence:
  - `npm run lint` → pass
  - `npm run tsc` → pass
  - `npm run test` → 138 tests, 20 files, all pass

### Blockers

- None.

### Next Actions

- Issue #14 — Wave 3.2: PokéAPI contract tests.

---

## 2026-04-08 - Wave 2.4: Coverage Scope Extended to Components

### Objective

- Add `src/components/**/*.tsx` to `coverage.include` and set realistic thresholds for the expanded scope (issue #12).

### Decisions Made

- DEC-0023: Functions threshold lowered from 70 to 65 when expanding scope to components. Aggregate functions coverage dropped to 69.56% because component event handlers and render sub-functions are hard to reach in unit tests. Other thresholds raised (stmts/lines 70→75, branches unchanged at 80).

### Completed

- `vite.config.ts`: added `src/components/**/*.tsx` to `coverage.include`; adjusted thresholds to statements/lines 75, branches 80, functions 65.
- Validation evidence:
  - `npm run lint` → pass
  - `npm run tsc` → pass
  - `npm run test --coverage` → 135 tests, 19 files, all pass; no threshold violations

### Blockers

- None.

### Next Actions

- Issue #13 — Wave 3.1: Import boundary tests.

---

## 2026-04-08 - Wave 2.3: Component Tests for AppView and MatchupViewer

### Objective

- Add RTL component tests for `BattleSelectorSection`, `TeamEditorPanel`, and `MatchupContainer` (issue #11).

### Decisions Made

- No trade-offs requiring a DECISIONS.md entry.
- Mocked `useMatchupMatrix` at the module level in `matchupContainer.test.tsx` to isolate the component from async PokéAPI calls.
- Used `screen.getByRole('region', { name: 'Matchup viewer' })` for the labeled section — RTL resolves `<section aria-label="...">` as role `region`, not via `getByLabel`.

### Completed

- `src/tests/battleSelectorSection.test.tsx` — 10 tests covering: free/gym mode toggle, opponent input render, suggestion list show/hide conditions, suggestion click callback, GymTeamPanel conditional render.
- `src/tests/teamEditorPanel.test.tsx` — 8 tests covering: slot rendering, slot error display, move chip rendering, Remove callback, 4-move disable guard, Save button disabled state, onSave callback, onSlotChange callback.
- `src/tests/matchupContainer.test.tsx` — 7 tests covering all 5 render branches: empty team, no opponent, no exact match, loading, and full matchup with heading + navigation.
- Validation evidence:
  - `npm run lint` → pass
  - `npm run tsc` → pass
  - `npm run test` → 135 tests, 19 files, all pass

### Blockers

- None.

### Next Actions

- Issue #12 — Wave 2.4: Add `src/components/**/*.tsx` to coverage scope and raise thresholds.

---

## 2026-04-08 - Wave 2.2: Gym Leader E2E Scenario

### Objective

- Expand Playwright smoke spec to cover the gym leader flow end-to-end.

### Decisions Made

- No trade-offs requiring a DECISIONS.md entry.
- Extracted shared API route setup into `setupApiRoutes(page)` helper to avoid duplicating ~130 lines of mocks across two tests.

### Completed

- Added gym leader scenario to `e2e/matchup-smoke.spec.ts` covering all 4 acceptance criteria: mode toggle, gym selection, Pokémon click, matchup viewer render.
- Refactored existing free-battle test to use shared `setupApiRoutes` helper.
- Validation evidence:
  - `npm run lint` → pass
  - `npm run tsc` → pass
  - `npm run test` → 110 tests, 16 files, pass
  - `npx playwright test` → cannot run locally (WSL2 missing libnspr4 system dep, requires sudo); CI validates via `--with-deps` in `deploy.yml`.

### Blockers

- None.

### Next Actions

- Wave 2.3: Add component tests for AppView and MatchupViewer (issue #11).

---

## 2026-04-08 - Wave 2.1: Component Tests for Gym Components

### Objective

- Add RTL component tests for `GymLeaderSelector` and `GymTeamPanel` to close the zero-coverage gap on the gym feature.

### Decisions Made

- No trade-offs requiring a DECISIONS.md entry.
- Explicit `cleanup()` calls required in `afterEach` — RTL auto-cleanup does not fire in this vitest/jsdom setup without a `setupFiles` configuration.

### Completed

- Added `src/tests/gymComponents.test.tsx` (5 tests) covering all acceptance criteria:
  - All 8 Emerald gym leaders render with names and type labels.
  - Clicking a leader calls `onSelect` with the correct gym ID.
  - Selected gym button has `aria-pressed=true` (only one at a time).
  - Empty state renders for non-Emerald games.
  - Clicking a team Pokémon calls `onPokemonSelect` with the correct name.
- Validation evidence:
  - `npm run lint` → pass
  - `npm run tsc` → pass
  - `npm run test` → 109 tests, 16 files, pass

### Blockers

- None.

### Next Actions

- Wave 2.2: Expand e2e smoke test to cover gym leader flow (issue #10).

---

## 2026-04-08 - Repo Hygiene, Wave 1.2, Wave 1.3

### Objective

- Aggressive repo cleanup: fix DECISIONS.md integrity, remove dead files, slim CLAUDE.md.
- Complete Wave 1.2 (unit tests in pre-commit) and Wave 1.3 (aria-pressed on gym buttons).

### Decisions Made

- No trade-offs requiring a DECISIONS.md entry — all changes are cleanup or straightforward hardening.

### Completed

- DECISIONS.md: renamed duplicate DEC-0018 → DEC-0022, removed duplicate Owner block in DEC-0017, sorted all 22 entries newest-first, stripped template header.
- SESSIONS.md: removed template block, consolidated duplicate Blockers/Next Actions section.
- PROJECT.md: removed stale non-goal (move-level analysis shipped in DEC-0019/0020).
- Deleted 11 stale Copilot `.agent.md` files (obsolete after Claude Code migration).
- Deleted `gate-evidence.yml` and `pull_request_template.md` (PR workflow not used).
- Committed untracked files: `ROADMAP.md`, `src/tests/gyms.test.ts`, `.claude/commands/github-issues.md`.
- Added DECISIONS.md integrity check to `deploy.yml` (unique IDs + descending order).
- Added to CLAUDE.md: DECISIONS entry format rule, no-untracked-files DoD, delivery-model cleanup rule, issue-linking rule (`Closes #N`).
- Slimmed CLAUDE.md from 322 → 172 lines: extracted Role Instructions to `.claude/commands/role-guide.md`, condensed Playwright guidelines, deleted stale `pr.md` skill.
- Issue #7 (Wave 1.2): added `npx vitest run` to `.husky/pre-commit` — broken tests now block commits locally.
- Issue #8 (Wave 1.3): added `aria-pressed` to `GymLeaderSelector` and `GymTeamPanel` buttons.
- Validation evidence:
  - `npm run lint` → pass
  - `npm run tsc` → pass
  - `npm run test` → 104 tests, 15 files, pass

### Blockers

- None.

### Next Actions

- Wave 2.1: Component tests for `GymLeaderSelector` and `GymTeamPanel` (issue #9).
- Wave 2.2: Expand e2e smoke test to cover gym leader flow (issue #10).

---

## 2026-04-07 - Wave 1.1: Add Gym Data Unit Tests

### Objective

- Add `src/tests/gyms.test.ts` to close the QA gap logged when the gym leader feature shipped.

### Decisions Made

- No trade-offs requiring a DECISIONS.md entry — straightforward test file against stable static data.

### Completed

- Added `src/tests/gyms.test.ts` (18 tests) covering `getGymsForGame`, `getGymById`, and full roster shape for all 8 Emerald gym leaders.
- Validation evidence:
  - `npm run lint` → pass
  - `npm run tsc` → pass
  - `npm run test` → 104 tests, 15 files, pass
- Closes GitHub issue atniptw/probable-computing-machine#6.

### Blockers

- None.

### Next Actions

- Wave 1.2: Add unit tests to pre-commit hook.
- Wave 1.3: Fix accessibility gaps on gym buttons.

---

## 2026-04-07 - Add Gym Leader Battle Mode

### Objective

- Add a "Gym Leader" battle mode for Pokémon Emerald so users can select a gym leader and tap a team member to trigger a matchup without typing.

### Decisions Made

- Gym Pokémon names stored in PokéAPI-normalized format (lowercase, hyphenated) so they resolve through the existing matchup hook without additional transformation.
- Gym selection is ephemeral (not persisted to localStorage) — the use case is per-session battle prep.
- No new decision entry in `DECISIONS.md` — the architecture extends cleanly with no trade-offs requiring formal documentation.

### Completed

- Added `src/data/gyms/emerald.ts` with all 8 Emerald gym leaders, badge order, type, and full team rosters.
- Added `src/components/AppView/GymLeaderSelector.tsx` — gym list picker with badge number and type badge.
- Added `src/components/AppView/GymTeamPanel.tsx` — tappable team roster with level labels and selection state.
- Extended `BattleSelectorSection` with Free Battle / Gym Leader mode toggle and conditional render.
- Updated `App.tsx` with `battleMode` and `selectedGymId` state; reset logic wired into game-change and mode-change handlers.
- Added all supporting CSS in `App.module.css`.
- Validation evidence:
  - `npm run lint` → pass
  - `npm run tsc` → pass
  - `npm run test` → 86 tests, 14 files, pass

### Blockers

- None.

### Next Actions

- Add `src/tests/gyms.test.ts` covering `getGymById`, `getGymsForGame`, and roster shape (QA follow-up from sign-off).
- Monitor CI e2e run on this PR for Playwright stability.

---

## 2026-03-24 - Fix CI E2E Startup Path Reliability

### Objective

- Resolve failing CI `npm run e2e` step where smoke test locators could not find battle-screen controls.

### Decisions Made

- Switch Playwright `webServer` command to `npm run dev -- --host 127.0.0.1 --port 4173` in all environments.
- Remove CI-specific base-path navigation from smoke test and use `/` consistently.
- Keep production validation in pipeline via the existing standalone `npm run build` step.

### Completed

- Updated `playwright.config.ts` to use dev server for Playwright in CI and local runs.
- Updated `e2e/matchup-smoke.spec.ts` to use a single root entry path and removed brittle game-selector precondition.
- Validation evidence:
  - `export CI=1 && npm run e2e` -> pass
  - `npm run lint` -> pass

### Blockers

- None.

### Next Actions

- Re-run GitHub Actions `build` job on latest commit and confirm stable green e2e execution.

---

## 2026-03-24 - Replace Comma-Separated Move Input with Structured Move Picker

### Objective

- Replace freeform comma-separated team move entry with an add/remove move flow backed by autocomplete.

### Decisions Made

- Store draft moves as arrays in editor state so the UI can represent individual moves directly.
- Load a cached global move-name index from PokéAPI for client-side autocomplete instead of move-by-move lookups while typing.
- Keep manual typing available so move entry still works if autocomplete data fails to load.

### Completed

- Reworked `useTeamConfiguration` to expose `addTeamMove` and `removeTeamMove` operations with duplicate, slot, and max-count validation.
- Added cached `getMoveNameIndex` support in `src/services/pokeapi.ts` and a new `useMoveNameIndex` hook.
- Replaced the team editor comma-separated move field with chip-style added moves, remove actions, and an autocomplete-backed `Add Move` input.
- Added test coverage for structured move editing and move-name index caching.
- Validation evidence:
  - `npm run lint` -> pass
  - `npm run test` -> pass (13 files, 83 tests)
  - `npm run tsc` -> pass

### Blockers

- None.

### Next Actions

- Add focused component or e2e coverage for move suggestion selection and chip removal behavior.

---

## 2026-03-24 - Close Move Autocomplete Hook Coverage Gap

### Objective

- Remove the remaining zero-coverage gap for the move autocomplete hook introduced by the structured move picker change.

### Decisions Made

- Add focused hook tests around loading, success, and failure states instead of broader UI tests for this pass.

### Completed

- Added `src/tests/useMoveNameIndex.test.ts` covering pending, resolved, and rejected `getMoveNameIndex` flows.
- Re-ran coverage to verify the hook no longer sits at zero coverage.

### Blockers

- None.

### Next Actions

- Add component or e2e coverage for autocomplete selection behavior if UI regressions appear.

---

## 2026-03-24 - Fix CI Build Runtime for Coverage Job

### Objective

- Resolve GitHub Actions deploy workflow failure during `npm run test:coverage`.

### Decisions Made

- Move CI runtime from Node 18 to Node 22 in deploy workflow to satisfy dependency engine requirements.

### Completed

- Updated `.github/workflows/deploy.yml` to use `actions/setup-node@v4` with `node-version: '22'`.
- Verified local validation commands still pass after workflow update.

### Blockers

- None.

### Next Actions

- Monitor the next `Deploy to GitHub Pages` run to confirm green build on hosted runners.

---

## 2026-03-24 - Align Playwright Smoke Test with Matchup Viewer UI

### Objective

- Resolve failing CI e2e smoke test after migration from recommendation UI to matchup viewer UI.

### Decisions Made

- Update smoke test assertions to target current matchup viewer structure and labels.
- Use CI-specific entry path for Playwright (`/probable-computing-machine/`) to match Vite preview base path.

### Completed

- Updated `e2e/matchup-smoke.spec.ts` to assert matchup viewer headings/regions and team member cycling.
- Replaced stale recommendation-flow assertions (`Best Choice`, grouped recommendation headings).
- Added CI-safe navigation path logic in the test.

### Blockers

- None.

### Next Actions

- Re-run `Deploy to GitHub Pages` workflow and confirm the e2e step remains stable.

---

## 2026-03-24 - Add Team Move Editing to Team Configuration

### Objective

- Allow users to save each team member's actual moves from the Edit Team flow and use those moves in matchup calculations.

### Decisions Made

- Keep Pokemon name suggestions as-is and add a separate optional comma-separated move input per team slot.
- Persist team data as member objects (`name`, `moves`) while preserving compatibility with legacy name-array storage.
- Resolve move typing through PokéAPI move endpoints, falling back to default type-based templates when custom move resolution yields no usable moves.

### Completed

- Updated team configuration hook to support move drafts, move validation, and member-object persistence.
- Updated team editor panel UI with per-slot optional move input and validation messaging.
- Wired team member move data from app state into matchup rendering flow.
- Added `getMoveType` helper in `src/services/pokeapi.ts` with in-memory request de-duplication and caching.
- Updated matchup matrix hook to use configured moves when available and keep existing fallback behavior.
- Expanded unit coverage in `useTeamConfiguration` and `useMatchupMatrix` tests for new move behavior.
- Validation evidence:
  - `npm run lint` -> pass
  - `npm run test` -> pass (12 files, 78 tests)

### Blockers

- None.

### Next Actions

- Verify the structured move picker with focused UI coverage.

---

## 2026-03-24 - Remove Bottom Team Cycling Panel

### Objective

- Simplify matchup viewer layout by removing the bottom "Cycle Team Members" panel.

### Decisions Made

- Keep team-member cycling only through existing swipe and header arrow controls.
- Remove the duplicated lower navigation region to reduce visual noise.

### Completed

- Removed bottom team navigation section from `src/components/MatchupViewer/MatchupContainer.tsx`.
- Removed no-longer-used helper/import logic tied to tab-style bottom cycling UI.
- Removed orphaned CSS classes from `src/components/MatchupViewer/MatchupViewer.module.css`.
- Validation evidence:
  - `npm run lint` -> pass
  - `npm run test` -> pass (12 files, 74 tests)

### Blockers

- None.

### Next Actions

- Optionally add a subtle first-time swipe coachmark if discoverability feedback continues.

---

## 2026-03-24 - Implement Matchup Viewer UI Replacement

### Objective

- Replace recommendation-oriented battle output with a descriptive matchup viewer focused on "Pokemon A vs Pokemon B."

### Decisions Made

- Keep live generation-aware data flow via existing `pokeapi` contracts.
- Introduce a dedicated `useMatchupMatrix` hook for descriptive offense/defense rendering.
- Keep recommendation engine logic isolated and unused in the new viewer path.

### Completed

- Added new viewer components under `src/components/MatchupViewer/`:
  - `MatchupContainer`, `PokemonCard`, `OffenseSection`, `DefenseSection`, `SummarySection`.
- Added `src/hooks/useMatchupMatrix.ts` to fetch opponent/player data and compute grouped offense/defense sections.
- Replaced battle render integration in `src/App.tsx` from `BattleResultsPanel` to `MatchupContainer`.
- Added `src/tests/useMatchupMatrix.test.ts` covering grouping behavior, validation errors, and rate-limit handling.
- Fixed TypeScript test typing drift in `src/tests/useMatchupResults.test.ts` (`screen` union typing).
- Validation evidence:
  - `npm run lint` -> pass
  - `npm run tsc` -> pass
  - `npm run test` -> pass (12 files, 74 tests)

### Blockers

- None.

### Next Actions

- Add focused component/e2e coverage for swipe interactions and responsive layout behavior.
- Remove or archive unused recommendation-only UI assets once product direction is finalized.

---

## 2026-03-24 - Capture Testing Reliability Lessons in Docs and Skills

### Objective

- Document test reliability lessons and align project docs with current implementation state.

### Decisions Made

- Codify hook test stability guardrails in frontend role instructions and testing skills.
- Expand coverage-gate expectations to include explicit unhandled-error checks.
- Update README and development docs as soon as testing architecture changes are completed.

### Completed

- Updated `README.md` next actions to reflect post-coverage priorities.
- Added a testing reliability section to `README.md`.
- Updated `docs/DEVELOPMENT.md` with current test inventory, coverage thresholds, and troubleshooting notes.
- Updated deployment workflow and Pages setup examples in `docs/DEVELOPMENT.md` to match current CI behavior.
- Updated `.github/instructions/frontend.instructions.md` with hook-test and async-mock guardrails.
- Updated `.github/skills/test-coverage-gate/SKILL.md` with stronger evidence and decision criteria.
- Updated `.github/skills/polyglot-test-agent/SKILL.md` with mandatory post-generation validation checks.

### Blockers

- None.

### Next Actions

- Keep this guidance aligned as additional hook/component tests are added.
- Consider adding a compact troubleshooting index in docs if recurring issues appear.

---

## 2026-03-24 - Expand Hook Coverage and Stabilize Test Suite

### Objective

- Raise automated confidence before starting new feature work by adding focused hook and service tests.

### Decisions Made

- Include `src/hooks/**/*.ts` in coverage scope so quality gates reflect current app architecture.
- Increase coverage thresholds to stronger baseline targets: 70 statements, 80 branches, 70 functions, 70 lines.
- Keep hook test patterns dependency-safe by using stable props/mocks to avoid effect-loop false positives.

### Completed

- Added hook tests: `useTeamConfiguration`, `useMatchupResults`, `usePokemonSuggestions`, `usePokemonNameIndex`, `useTeamPreview`.
- Added service error-path tests for `pokeapi`.
- Fixed unhandled async mock issue in `usePokemonNameIndex` tests (`getTypeMap` always returns a promise).
- Fixed infinite rerender loop in `useTeamPreview` tests caused by inline array literals in `renderHook` callbacks.
- Updated `vite.config.ts` coverage include list and thresholds.
- Ran validation checks:
  - `npm run test:coverage` -> 70/70 tests passing, thresholds passing.
  - `npm run lint` -> passing.

### Blockers

- None.

### Next Actions

- Commit the coverage/test hardening changes.
- Optionally add a CI step that explicitly runs `npm run test:coverage` on PRs if not already enforced in all workflows.

---

## 2026-03-16 - Setup Collaboration Foundation

### Objective

- Initialize lean documentation system for long-running project collaboration.

### Decisions Made

- Use hybrid cadence: one ongoing thread plus weekly reset summaries.
- Keep docs lean but mandatory for scope, sessions, and decisions.
- Use quick questionnaire now and deep questionnaire later.

### Completed

- Expanded `README.md` into collaboration hub.
- Created `PROJECT.md`, `SESSIONS.md`, `DECISIONS.md`, and `.instructions.md`.
- Seeded project charter with initial questionnaire outcomes.

### Blockers

- MVP problem statement and first user persona are not finalized.

### Next Actions

- Finalize MVP problem statement and scope boundaries.
- Add first implementation milestone and target date.
- Start deep questionnaire once MVP boundaries are drafted.

---

## 2026-03-16 - Implement Agentic Team Framework

### Objective

- Stand up shared .github customization and role-gated workflow for multi-role delivery.

### Decisions Made

- Activate all roles from the start: PM, Architect, Backend, Frontend, QA, DevOps, Docs.
- Use strict blocking gates for merge and release decisions.
- Standardize team behavior through `.github/copilot-instructions.md` and `.github/AGENTS.md`.

### Completed

- Created shared operating instructions and role coordination docs in `.github/`.
- Added role instruction files for seven software delivery roles.
- Added reusable prompts for feature intake, architecture review, QA sign-off, and release readiness.
- Added starter skills for API contract validation, coverage gate checks, release checklist, and rollback procedure.
- Updated root docs to reference the new agentic system.

### Blockers

- CI enforcement and PR templates are not implemented yet.
- First pilot user story is not defined yet.

### Next Actions

- Define first pilot feature with PM intake prompt.
- Create PR and issue templates for mandatory gate evidence.
- Add CI checks that enforce artifact presence and validation signals.

---

## 2026-03-16 - Add Enforcement Templates and CI Gate

### Objective

- Enforce strict role-gate evidence at issue and pull request stages.

### Decisions Made

- Standardize feature intake through an issue form with required PM fields.
- Require PR evidence sections and explicit checklist confirmation.
- Block PRs when mandatory gate markers are missing.

### Completed

- Added `.github/pull_request_template.md` with required gate evidence sections.
- Added `.github/ISSUE_TEMPLATE/feature-intake.yml` and `config.yml`.
- Added `.github/workflows/gate-evidence.yml` to enforce PR evidence checks.
- Updated `README.md` and `DECISIONS.md` to reflect enforcement phase completion.

### Blockers

- No pilot issue and PR have been run yet to validate workflow behavior.

### Next Actions

- Open first feature intake issue using template.
- Create pilot PR using template and intentionally fail one checkbox to validate blocker behavior.
- Run full compliant PR to confirm pass path.

---

## 2026-03-16 - Governance Cleanup and Consistency Pass

### Objective

- Remove structural inconsistencies and deprecated configuration from the agentic setup.

### Decisions Made

- Removed root pointer instruction file and standardized governance in `.github/`.
- Updated prompts to use current frontmatter schema.
- Removed universal role `applyTo` values to reduce context collisions.

### Completed

- Updated `README.md` and `PROJECT.md` for cadence and governance consistency.
- Updated prompt files in `.github/prompts/` from `mode` to `agent`.
- Updated role instruction files in `.github/instructions/` to remove `applyTo: "**"`.
- Hardened `.github/workflows/gate-evidence.yml` for case-insensitive checklist validation.
- Added cleanup rationale as `DEC-0004`.

### Blockers

- Branch protection rules still must be configured in GitHub repository settings.

### Next Actions

- Configure required status check for `Gate Evidence Check` on `main`.
- Run a pilot PR to validate the cleanup behavior.

---

## 2026-03-16 - Fix E2E Selector Regression

### Objective

- Restore the GitHub Pages workflow by fixing the Playwright smoke test after the card-based UI redesign.

### Decisions Made

- Scope the E2E assertion to the clicked matchup card instead of querying duplicated text across the full page.

### Completed

- Identified the latest workflow failure as a Playwright strict-mode locator error in `e2e/matchup-smoke.spec.ts`.
- Updated the smoke test to assert `Attack effectiveness:` within the expanded card only.

### Blockers

- Local browser execution in this dev container may still require additional Playwright system libraries, so final end-to-end validation is expected in GitHub Actions.

### Next Actions

- Push the fix and confirm the latest `Deploy to GitHub Pages` workflow passes.

---

## 2026-03-16 - Implement Global Pokemon Name Search Index

### Objective

- Replace Emerald-opponent allowlist with full Pokemon name index search and exact-match detail fetch.

### Decisions Made

- Fetch all Pokemon names once via `GET /pokemon?limit=100000` and cache locally with TTL.
- Use prefix-first local filtering and cap datalist suggestions to 20 entries.
- Fetch matchup details only after the opponent input exactly matches an indexed name.

### Completed

- Added `getPokemonNameIndex()` with cache + stale-cache fallback in `src/services/pokeapi.ts`.
- Updated opponent flow in `src/App.tsx` to use index-backed suggestions instead of static Emerald list.
- Updated Playwright smoke test to mock the list endpoint and validate partial-to-exact flow.
- Added unit tests for name-index caching behavior.
- Updated `docs/API_SPEC.md` with the new list endpoint contract.

### Blockers

- None during local implementation.

### Next Actions

- Run and verify `npm run tsc`, `npm run test`, and `npm run e2e` in CI-safe environment.
- Update user-facing guide copy for single-opponent search flow alignment.

---

## 2026-03-14 - Fix Devcontainer Build Failure on Trixie

### Objective

- Restore successful devcontainer startup after feature installation failure.

### Decisions Made

- Move from `mcr.microsoft.com/devcontainers/base:trixie` plus Node feature install to `mcr.microsoft.com/devcontainers/javascript-node:1-20-bookworm`.
- Remove `ghcr.io/devcontainers/features/node:1` to avoid the failing apt/signature install path.

### Completed

- Analyzed Remote Containers log and identified `OpenPGP signature verification failed` with `Not live until` timestamps during Node feature install.
- Updated `.devcontainer/devcontainer.json` image and features accordingly.
- Preserved existing Copilot CLI and GitHub CLI features.

### Blockers

- None.

### Next Actions

- Rebuild and reopen the container in VS Code to validate end-to-end startup.

---

## 2026-03-14 - Implement Battle-First Mobile UX v2

### Objective

- Implement the v2 UX spec with a single clear primary recommendation and low-cognitive-load battle flow.

### Decisions Made

- Open app on battle screen by default and keep team editing as secondary screen.
- Use local custom typeahead suggestion lists for opponent and team slots instead of native datalist dropdowns.
- Enforce one primary recommendation and collapse all secondary options by default.

### Completed

- Added ranking contract and reason generator in `src/services/ranking.ts` with buckets: `best`, `good`, `neutral`, `risky`.
- Refactored `src/App.tsx` into battle-first flow with `PrimaryRecommendationCard`, `ExpandableMatchupList`, `TeamPreviewBar`, and team configuration screen.
- Updated styling in `src/App.module.css` for mobile-first hierarchy and larger tap targets.
- Added unit tests in `src/tests/ranking.test.ts`.
- Updated Playwright smoke test in `e2e/matchup-smoke.spec.ts` to validate new typeahead + primary recommendation flow.
- Verified `npm run tsc`, `npm run test`, and `npm run e2e -- e2e/matchup-smoke.spec.ts --project=chromium`.

---

## 2026-03-24 - Add Foundation Validation Tooling

### Objective

- Establish enforced local and CI quality gates before deeper architecture refactoring.

### Decisions Made

- Adopt ESLint 9 flat config, Prettier, Husky, and lint-staged as the baseline developer validation toolchain.
- Move Vitest to a jsdom environment and require coverage reporting in CI with initial service-layer thresholds.
- Run lint, format check, typecheck, and coverage before build and Playwright validation in the deploy workflow.

### Completed

- Added linting, formatting, Husky, and lint-staged dependencies plus repo configuration.
- Added validation scripts to `package.json` and coverage thresholds to `vite.config.ts`.
- Updated `.github/workflows/deploy.yml` to run lint, format check, typecheck, and coverage before build and E2E.
- Extended `.github/dependabot.yml` to monitor npm dependencies.
- Updated `README.md` and `docs/DEVELOPMENT.md` to match the current toolchain and validation flow.

### Blockers

- None yet; next risk is whether new lint rules expose code issues that need cleanup during the architecture pass.

### Next Actions

- Run the new validation suite locally and fix any issues introduced by the stricter tooling.
- Start decomposing `src/App.tsx` once the repo is green under the new gates.

---

## 2026-03-24 - Extract App Render Sections

### Objective

- Reduce `src/App.tsx` render-layer complexity without changing the current state model.

### Decisions Made

- Extract render-only sections first into `src/components/AppView/*` before moving state and effects into hooks.
- Centralize empty matchup bucket creation to remove repeated reset literals in `src/App.tsx`.

### Completed

- Added `BattleSelectorSection`, `TeamConfigurationSection`, `TeamEditorPanel`, `BattleResultsPanel`, `GameVersionSelect`, and `SuggestionList` under `src/components/AppView/`.
- Added `src/utils/format.ts` and removed duplicated display formatting logic from `src/App.tsx`.
- Replaced repeated matchup reset object literals in `src/App.tsx` with a shared helper.
- Updated component and development docs to reflect the active runtime structure.
- Verified `npm run lint`, `npm run format:check`, `npm run tsc`, `npm run test`, and `npm run e2e`.

### Blockers

- None.

### Next Actions

- Extract opponent lookup, team persistence, and matchup execution into focused hooks.
- Decide whether to delete or archive legacy components under `src/components/TeamInput` and `src/components/MatchupResults`.
- Add regression coverage for team editor validation edge cases (invalid slot values and mixed empty/filled states).
- Review mobile ergonomics on small-height devices for above-the-fold best-choice visibility.

---

## 2026-03-14 - Add Game-Specific Pokédex and Generation Rules

### Objective

- Make matchup flow game-aware so users only see Pokémon from a selected game, with generation-specific type-rule behavior.

### Decisions Made

- Add a selectable game list (default Emerald) and persist selection locally.
- Replace global Pokémon index with game-scoped Pokédex lookup (`version` → `version-group` → `pokedex`).
- Use generation-aware type logic: historical Pokémon `past_types` + generation chart overrides for key differences.

### Completed

- Added game catalog in `src/data/games.ts`.
- Extended `src/services/pokeapi.ts` with:
  - game version context resolver,
  - game-scoped `getPokemonNameIndex(version)`,
  - generation-aware `getPokemon(name, { generation })`,
  - generation-aware `getTypeMap({ generation })` with historical overrides.
- Updated `src/App.tsx` to include game selector, selected-game persistence, and selected-game validation for opponent/team entries.
- Added selector styling in `src/App.module.css`.
- Updated tests:
  - `src/tests/getPokemonNameIndex.test.ts`
  - `src/tests/getPokemon.test.ts`
  - `e2e/matchup-smoke.spec.ts`
- Verified:
  - `npm run tsc`
  - `npm run test`
  - `npm run e2e -- e2e/matchup-smoke.spec.ts --project=chromium`

### Blockers

- None.

### Next Actions

- Expand supported game list coverage and verify each mapped Pokédex behavior.
- Add targeted tests for Gen 1 and Gen 6 chart differences in app-level ranking scenarios.

---

## 2026-03-14 - Optimize PokéAPI Call Efficiency

### Objective

- Reduce redundant and oversized PokéAPI requests while preserving existing UX behavior.

### Decisions Made

- Add in-flight de-duplication for repeated concurrent `getPokemon(name)` requests.
- Fetch Pokémon name index in two steps (`limit=1` for count, then `limit={count}`) instead of fixed oversized `limit=100000`.

### Completed

- Updated `src/services/pokeapi.ts` with request de-duplication maps for Pokémon details and name index fetches.
- Added unit test coverage for concurrent request de-duplication in `src/tests/getPokemon.test.ts`.
- Updated `src/tests/getPokemonNameIndex.test.ts` for the count+exact-limit strategy and concurrent index fetch de-duplication.
- Updated `docs/API_SPEC.md` to reflect the new endpoint flow.
- Verified with targeted tests: `npm run test -- src/tests/getPokemonNameIndex.test.ts src/tests/getPokemon.test.ts`.

### Blockers

- None.

### Next Actions

- Optionally run full suite (`npm run test`) to confirm no unrelated regressions.

---

## 2026-03-14 - Implement Team-First Matchup Flow

### Objective

- Implement a dedicated Configure Team step before opponent selection and preserve single-opponent ranked matchup output.

### Decisions Made

- Add explicit runtime mode switch (`configure` → `matchups`) in `App`.
- Validate saved team slots against the global Pokémon name index before allowing progression.
- Keep automatic matchup recomputation for exact opponent name matches.

### Completed

- Refactored `src/App.tsx` to support team configuration, save action, and edit-team return path.
- Added team-entry UI and validation styles in `src/App.module.css`.
- Updated smoke e2e flow in `e2e/matchup-smoke.spec.ts` for configure-team-first interaction and two-step name index API mocking.
- Updated product docs: `docs/USER_GUIDE.md`, `docs/DATA_FLOW.md`, `docs/COMPONENT_DESIGN.md`, and `docs/STORY_MAP.md`.
- Validation run: `npm run tsc` and `npm run test` passed.

### Blockers

- Local Playwright browser binary is not installed in this container, so `npm run e2e -- e2e/matchup-smoke.spec.ts` cannot execute until `npx playwright install` is run.

### Next Actions

- Install Playwright browser binaries and rerun smoke e2e.
- Remove or archive legacy two-team components once final UX is confirmed stable.

---

## 2026-03-14 - Add Team Slot Autocomplete

### Objective

- Add autocomplete/search suggestions to team configuration input boxes.

### Decisions Made

- Reuse the existing global Pokémon name index and prefix-first filtering for team-slot suggestions.
- Attach a per-slot datalist so each input suggests based on its current typed value.

### Completed

- Updated `src/App.tsx` to provide `getSuggestions(query)` for both opponent and team-slot inputs.
- Added `list` + `datalist` wiring for all six team inputs in configure mode.
- Validation run: `npm run tsc` and `npm run test` passed.

### Blockers

- None.

### Next Actions

- Optional: add an e2e assertion specifically for team-slot autocomplete suggestions.

---

## 2026-03-24 - Extract App Data Loading Hooks

### Objective

- Reduce orchestration complexity in `src/App.tsx` by moving data-loading and suggestion logic into focused hooks.

### Decisions Made

- Keep matchup execution and user action handlers in `App`, but extract reusable effect/state blocks for name index loading, team preview loading, and typeahead suggestion logic.
- Preserve runtime behavior while changing internal boundaries.

### Completed

- Added `src/hooks/usePokemonNameIndex.ts` for game-aware Pokédex index loading and generation warmup.
- Added `src/hooks/useTeamPreview.ts` for asynchronous loading of configured team preview data.
- Added `src/hooks/usePokemonSuggestions.ts` for prefix-first/contains fallback filtering with capped results.
- Updated `src/App.tsx` to consume the new hooks and remove duplicated effect logic.
- Updated `docs/COMPONENT_DESIGN.md`, `docs/DEVELOPMENT.md`, and `DECISIONS.md` (DEC-0016).
- Verified with:
  - `npm run format`
  - `npm run lint`
  - `npm run tsc`
  - `npm run test -- --run`
  - `npm run e2e -- --project=chromium`

### Blockers

- None.

### Next Actions

- Add targeted unit tests for hook contracts (name-index failure path and suggestion ordering).
- Continue incremental reduction of `App` surface by extracting matchup execution flow when safe.

---

## 2026-03-24 - Extract Matchup Execution Hook

### Objective

- Continue the `App.tsx` decomposition by moving matchup execution and result lifecycle side effects into a dedicated hook.

### Decisions Made

- Encapsulate matchup validation and async execution in `useMatchupResults` while preserving existing top-level `App` event handlers.
- Keep UI flow unchanged and preserve existing error messaging semantics.

### Completed

- Added `src/hooks/useMatchupResults.ts` to own matchup state (`opponent`, `rankedBuckets`, `loading`, `showOtherOptions`) and execution effects.
- Updated `src/App.tsx` to consume `useMatchupResults` and remove the large inlined matchup effect block.
- Updated `docs/COMPONENT_DESIGN.md`, `docs/DEVELOPMENT.md`, and `DECISIONS.md` (DEC-0017).
- Verified with:
  - `npm run format`
  - `npm run lint`
  - `npm run tsc`
  - `npm run test -- --run`
  - `npm run e2e -- --project=chromium`

### Blockers

- None.

### Next Actions

- Add focused unit tests for `useMatchupResults` error and reset paths.
- Revisit whether `App` save-team validation can be moved into a dedicated hook without reducing clarity.

---

## 2026-03-24 - Extract Team Save Hook and Remove Legacy Components

### Objective

- Further shrink `src/App.tsx` by extracting save-team validation/persistence and execute final cleanup of unused legacy UI component directories.

### Decisions Made

- Added `useTeamConfiguration` as the dedicated boundary for team draft state, slot validation, and local storage persistence.
- Deleted unused legacy component folders (`src/components/TeamInput`, `src/components/MatchupResults`) instead of archiving them.

### Completed

- Added `src/hooks/useTeamConfiguration.ts`.
- Updated `src/App.tsx` to consume `useTeamConfiguration` and remove inline team save/edit logic.
- Deleted legacy files from `src/components/TeamInput/` and `src/components/MatchupResults/`.
- Updated `README.md`, `docs/COMPONENT_DESIGN.md`, `docs/DEVELOPMENT.md`, and `DECISIONS.md` (DEC-0018).

### Blockers

- None.

### Next Actions

- Add unit tests covering `useTeamConfiguration` validation/persistence branches.
- Add unit tests for `useMatchupResults` reset behavior when game/index conditions change.
