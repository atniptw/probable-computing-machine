# Sessions Log

Append-only log for preserving continuity across long-running work.

## Session Entry Template

### Date

YYYY-MM-DD

### Objective

- TBD

### Decisions Made

- TBD

### Completed

- TBD

### Blockers

- TBD

### Next Actions

- TBD

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

- `src/App.tsx` still owns the main state and effect orchestration; the next meaningful reduction requires hook extraction.

### Next Actions

- Extract opponent lookup, team persistence, and matchup execution into focused hooks.
- Decide whether to delete or archive legacy components under `src/components/TeamInput` and `src/components/MatchupResults`.
- Updated docs in `README.md`, `docs/COMPONENT_DESIGN.md`, `docs/USER_GUIDE.md`, and `docs/DATA_FLOW.md`.

### Blockers

- None after installing Playwright Chromium runtime locally.

### Next Actions

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
