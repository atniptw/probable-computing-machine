# Sessions Log

Append-only log for preserving continuity across long-running work.

## Session Entry Template

### Date

YYYY-MM-DD

### Objective

- 

### Decisions Made

- 

### Completed

- 

### Blockers

- 

### Next Actions

- 

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
