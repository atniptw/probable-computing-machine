# Decisions Log

---

## DEC-0024

### Date

2026-04-08

### Title

Raise functions coverage floor back to 70 after removing dormant assets

### Context

DEC-0023 set the functions floor to 68 (temporarily below the 70 target) because `BattleResultsPanel`, `useTeamPreview`, and `useMatchupResults` were in scope but not covered. Wave 4.4 deleted those files and their test files. After removal, actual functions coverage is 75.92% — well above the 70 target.

### Decision

Raise `functions` threshold from 68 back to 70, fulfilling the remediation commitment in DEC-0023. All other thresholds remain unchanged (`statements` 75, `branches` 80, `lines` 75).

### Owner

QA

---

## DEC-0023

### Date

2026-04-08

### Title

Set functions coverage floor to 68% (temporary) when expanding scope to include components

### Context

Adding `src/components/**/*.tsx` to the coverage scope dropped the aggregate functions coverage from ~83% (data/services/hooks only) to 69.56%. Component event handlers and render sub-functions are not fully reachable in Wave 2.3 unit tests. Rather than exclude components again, the functions floor is set to 68 — tight to the current actual (69.56%) to maintain signal — and explicitly treated as a temporary minimum pending Wave 3+ test additions.

### Decision

Set `functions` threshold to 68 (temporarily below the prior 70, close to actual 69.56%). All other thresholds raised: `statements` 70→75, `lines` 70→75, `branches` unchanged at 80. The 68 floor will be raised back above 70 once untested component functions (BattleResultsPanel, TeamConfigurationSection, TeamEditorPanel internals) receive coverage in a future wave.

### Remediation Target

Issue #13+ (Wave 3): add tests for uncovered component functions and raise the functions threshold back to ≥70.

### Owner

QA

---

## DEC-0022

### Date

2026-03-24

### Context

- `App` still owned save-team validation, team draft state management, and persistence behavior.
- Legacy component directories (`src/components/TeamInput`, `src/components/MatchupResults`) were no longer imported and increased maintenance noise.

### Decision

- Extract team editing, validation, and persistence into `useTeamConfiguration` under `src/hooks/`.
- Remove legacy unused component directories from `src/components/` instead of archiving them.

### Consequences

- Positive: smaller `App` orchestration surface and reduced dead code burden.
- Trade-offs: historical reference implementations are removed from source and can only be recovered from git history.

### Owner

- Frontend + Architect

---

## DEC-0021

### Date

2026-03-24

### Context

- CI e2e runs were failing because the app did not mount under Playwright when using `vite preview` with the repository base path.
- The deployed build path (`/probable-computing-machine/`) remained valid for production, but preview-mode asset resolution in CI caused flaky or empty-page smoke runs.

### Decision

- Run Playwright e2e against `vite dev` in both local and CI environments.
- Keep the smoke spec entry path as `/` to avoid environment-conditional navigation in tests.

### Consequences

- Positive: stable e2e startup path and fewer CI-only path regressions.
- Trade-offs: e2e validates runtime behavior on dev server instead of preview server, while production bundling remains validated by the separate `npm run build` step.

### Owner

- DevOps + QA + Frontend

---

## DEC-0020

### Date

2026-03-24

### Context

- Team move editing initially shipped as a comma-separated text field, which pushed parsing and validation burden onto the user.
- Product feedback required a lower-friction interaction for adding exact moves while preserving static-client constraints.

### Decision

- Replace comma-separated move entry with a structured add/remove move picker in the team editor.
- Fetch and cache a global move-name index from PokéAPI for client-side autocomplete.
- Keep move addition resilient by allowing manual entry when autocomplete loading fails.

### Consequences

- Positive: lower input error rate, clearer editing affordance, and better alignment with the underlying `moves: string[]` data model.
- Trade-offs: adds one more cached dataset in the browser and slightly more editor state complexity.

### Owner

- Product + Frontend

---

## DEC-0019

### Date

2026-03-24

### Context

- Team editing previously captured only Pokemon names, so matchup offense output could not reflect the player's actual move choices.
- User-requested capability required custom move input with low UI complexity and no backend.

### Decision

- Persist team configuration as member objects with `name` and optional `moves` (up to four moves per member).
- Resolve move types dynamically via PokéAPI `move` endpoint (`getMoveType`) and cache move-type lookups in memory.
- Keep fallback offense move templates for cases where no custom moves are configured or no configured moves resolve successfully.

### Consequences

- Positive: matchup output now tracks player-entered moves and better represents real team loadouts.
- Trade-offs: adds extra network dependency for move-type resolution and introduces additional validation complexity in team editor state.

### Owner

- Frontend + Architect

---

## DEC-0018

### Date

2026-03-24

### Context

- The battle output was recommendation-oriented (`best/good/neutral/risky`) and did not match the new product requirement to answer only "Pokemon A vs Pokemon B."
- Product scope explicitly excluded recommendation logic and battle decisioning, while still requiring live, game-aware data.

### Decision

- Replace the battle output panel with a descriptive matchup viewer composed of opponent card, player card, offense section, defense section, and summary section.
- Add `useMatchupMatrix` for matchup rendering data and keep recommendation logic isolated in `ranking.ts` (not used by the new viewer path).
- Implement team-member cycling in the viewer with desktop controls and mobile swipe while keeping opponent fixed.

### Consequences

- Positive: output now aligns with scope and provides fast, readable matchup context without recommendation bias.
- Trade-offs: both legacy recommendation assets and new viewer assets coexist temporarily until cleanup is completed.

### Owner

- Product + Frontend + Architect

---

## DEC-0017

### Date

2026-03-24

### Context

- `App` still contained the full matchup execution effect, loading state, and result bucket lifecycle after initial hook extraction.
- This logic mixed validation, async orchestration, and UI-specific state resets in one large effect block.

### Decision

- Extract matchup orchestration into `useMatchupResults` under `src/hooks/`.
- Keep `App` responsible for top-level navigation/input handlers while consuming hook outputs (`opponent`, `rankedBuckets`, `loading`, `showOtherOptions`).

### Consequences

- Positive: centralizes matchup side-effects in one testable boundary and further reduces `App` complexity.
- Trade-offs: error handling is now split across hook-driven matchup errors and `App`-initiated form/save validation paths.

### Owner

- Frontend + Architect

---

## DEC-0016

### Date

2026-03-24

### Context

- `src/App.tsx` had become a mixed orchestrator for UI state, data loading effects, and suggestion algorithms.
- Render decomposition (`AppView`) reduced JSX size, but effect-heavy logic in `App` remained difficult to reason about and test independently.

### Decision

- Extract stateful side-effect logic into focused hooks under `src/hooks/`:
  - `usePokemonNameIndex` for game-aware name index loading and type-map warmup.
  - `useTeamPreview` for async preview loading of saved team members.
  - `usePokemonSuggestions` for reusable prefix-first suggestion filtering.
- Keep `App` as the orchestration boundary for user actions and matchup execution while consuming hook outputs.

### Consequences

- Positive: clearer responsibility boundaries, smaller `App` surface, and improved testability for loading/suggestion logic.
- Trade-offs: adds a new abstraction layer that requires keeping hook contracts synchronized with `App` behavior.

### Owner

- Frontend + Architect

---

## DEC-0015

### Date

2026-03-24

### Context

- `src/App.tsx` still owned all render sections, state, and side effects after the validation-tooling baseline landed.
- The repo needed structural progress without taking on a full hook/state rewrite in the same change.

### Decision

- Decompose `src/App.tsx` incrementally by extracting render-layer sections first into `src/components/AppView/*`.
- Keep state ownership and side effects in `src/App.tsx` for this slice, then move coordination into hooks in a later pass.

### Consequences

- Positive: lower-risk refactor with unchanged user behavior and clearer UI boundaries.
- Trade-offs: `src/App.tsx` is smaller and easier to read, but it still owns too much state and effect logic.

### Owner

- Architect + Frontend

---

## DEC-0014

### Date

2026-03-24

### Context

- The repository had tests and deployment automation, but no enforced local or CI quality gates for linting, formatting, or coverage.
- Documentation still described outdated setup and file structure, which increased drift risk during planned foundation refactors.
- The next phase of work requires faster feedback loops before breaking `src/App.tsx` into smaller runtime boundaries.

### Decision

- Standardize on ESLint 9 flat config, Prettier, Husky, and lint-staged for local validation.
- Treat coverage as part of the default CI signal via `npm run test:coverage` with initial service-layer thresholds.
- Upgrade the GitHub Pages workflow so lint, format, typecheck, and coverage checks run before build and E2E execution.

### Consequences

- Positive: foundation refactors get faster feedback and lower regression risk.
- Trade-offs: local setup becomes stricter and contributors will hit validation failures earlier.

### Owner

- Architect + DevOps + Frontend

---

## DEC-0013

### Date

2026-03-14

### Context

- Users need recommendations tied to a specific game, not global latest-generation data.
- Existing flow used all Pokémon names and current type/chart assumptions, which can be incorrect for older games.
- Scope required strict game Pokédex membership and generation-specific type-rule handling.

### Decision

- Add a user-selectable game version in the UI and persist it locally (`pmh_game_v1`).
- Build Pokémon autocomplete/validation from selected game Pokédex using PokéAPI chain:
  - `/version/{version}`
  - `/version-group/{version_group}`
  - `/pokedex/{pokedex}`
- Apply generation-aware rule handling in services:
  - use `past_types` when resolving Pokémon typing for older generations,
  - apply key generation type-chart overrides (Fairy removal pre-Gen 6, Dark/Steel removal pre-Gen 2, key historical relation adjustments).

### Consequences

- Positive: recommendations are aligned with selected game roster and historical typing/rule context.
- Trade-offs: additional API calls for game Pokédex metadata and increased service complexity.

---

## DEC-0012

### Date

2026-03-14

### Context

- UX v2 requires one clear recommendation for in-battle speed on mobile.
- Existing UI emphasized grouped expandable cards and required manual comparison.
- MVP ranking scope is constrained to type effectiveness only.

### Decision

- Shift to a battle-first default screen with a single `PrimaryRecommendationCard` shown above secondary data.
- Implement `rankTeamAgainstOpponent(team, opponent)` returning `best`, `good`, `neutral`, `risky` buckets, with exactly one entry in `best`.
- Keep secondary options collapsed by default behind `Show other options (X)`.
- Keep team configuration as a separate secondary screen, reachable via `Edit Team` and team preview bar.

### Consequences

- Positive: lower cognitive load and faster switch decisions during gameplay.
- Trade-offs: less simultaneous detail on screen and additional tap needed to inspect alternatives.

### Owner

- Frontend + Architect

---

## DEC-0011

### Date

2026-03-14

### Context

- Team configuration inputs lacked autocomplete while opponent search already used the cached global Pokémon index.
- Product requested search/autocomplete directly in team entry boxes.

### Decision

- Reuse the existing in-memory name index and prefix-first suggestion logic for team slots.
- Implement team autocomplete with native HTML `datalist` per slot rather than introducing a custom combobox component.

### Consequences

- Positive: minimal implementation complexity, consistent suggestion behavior with opponent search, and no new dependency surface.
- Trade-offs: native datalist behavior is browser-defined and offers less control than a custom accessible combobox.

### Owner

- Frontend + Architect

---

## DEC-0010

### Date

2026-03-14

### Context

- Runtime UX ranked team members against one selected opponent, but team editing was implicit and not part of the active UI flow.
- Product direction requires explicit team entry first, then opponent-based matchup guidance.

### Decision

- Introduce a two-mode app flow: `configure` (team setup) and `matchups` (opponent selection + ranked results).
- Require team save with index-based validation before entering matchup mode.
- Keep single-opponent grouped output categories (`Best`, `Neutral`, `Risky`, `Avoid`) and automatic recompute on exact opponent match.
- Deprecate two-team flow in runtime documentation.

### Consequences

- Positive: clearer user journey aligned with product intent and reduced confusion from legacy two-team documentation.
- Trade-offs: users must complete a setup step before seeing matchup output.

### Owner

- Product Owner + Frontend + Architect

---

## DEC-0009

### Date

2026-03-14

### Context

- Name index retrieval used a fixed `GET /pokemon?limit=100000` request, larger than current dataset size.
- Rapid state transitions could trigger overlapping requests for the same Pokémon or name index.

### Decision

- Switch name index retrieval to a two-step flow: `GET /pokemon?limit=1` to read `count`, then `GET /pokemon?limit={count}`.
- Add in-flight request de-duplication for `getPokemon(name)` and `getPokemonNameIndex()` so concurrent identical requests share one network call.

### Consequences

- Positive: fewer duplicate network calls, smaller index payload request size, and better client responsiveness under rapid input changes.
- Trade-offs: name index fetch requires one additional lightweight request (`limit=1`) before full index retrieval.

### Owner

- Frontend + Architect

---

## DEC-0008

### Date

2026-03-14

### Context

- Devcontainer startup failed while installing `ghcr.io/devcontainers/features/node:1` on Debian `trixie` base.
- Logs showed apt signature errors with `Not live until` timestamps, causing feature install exit code 100.

### Decision

- Switch devcontainer base image to `mcr.microsoft.com/devcontainers/javascript-node:1-20-bookworm`.
- Remove the separate Node feature and keep only Copilot CLI and GitHub CLI features.

### Consequences

- Positive: more reliable container bootstrap with Node preinstalled and fewer build-time apt operations.
- Trade-offs: base image moves from `trixie` to `bookworm`, so package versions may be slightly older.

### Owner

- DevOps + Architect

---

## DEC-0007

### Date

2026-03-16

### Context

- Opponent selection was constrained to a static Emerald subset despite the data layer supporting all valid Pokemon names.
- Partial search needed to be responsive without triggering repeated per-keystroke detail API calls.

### Decision

- Build a client-side global Pokemon name index using `GET /pokemon?limit=100000`.
- Cache names in `localStorage` with a 7-day TTL and versioned key (`pkm_names_v1`).
- Use stale cached names when index refresh fails to preserve search availability.
- Trigger detailed Pokemon fetches only when the user input exactly matches an indexed name.

### Consequences

- Positive: fast local partial search, lower API call volume, broader opponent coverage.
- Trade-offs: larger initial index payload and possible temporary staleness when serving fallback cache.

### Owner

- Frontend + Architect

---

## DEC-0006

### Date

2026-03-16

### Context

- Project must be hosted on GitHub Pages (static only, no server).
- Team has no frontend framework preference.
- Tech lead selected stack based on performance and ecosystem maturity.

### Decision

- Frontend: React 18 with Vite as the build tool.
- No backend — all logic runs client-side in the browser.
- Deployment: GitHub Actions builds on push to main and publishes to gh-pages branch.

### Consequences

- Positive: zero hosting cost, fast builds (~5s), instant deploys, no server ops.
- Trade-offs: PokéAPI rate limiting is sole external risk; mitigated by localStorage caching.

### Owner

- Tech Lead

---

## DEC-0005

### Date

2026-03-16

### Context

- MVP requires authoritative Pokémon type and effectiveness data.
- Maintaining a static dataset would create ongoing maintenance burden.

### Decision

- Use PokéAPI v2 (https://pokeapi.co/docs/v2) as the sole data source.
- Call PokéAPI directly from the browser (CORS is supported).
- Cache type data in memory on first load; cache Pokémon data in localStorage per name.

### Consequences

- Positive: zero data maintenance, always up to date with new generations.
- Trade-offs: dependent on third-party uptime; rate limit of ~100 req/min mitigated by caching.

### Owner

- Architect

---

## DEC-0004

### Date

2026-03-16

### Context

- Governance docs contained contradictions across cadence and instruction ownership.
- Prompt files were using deprecated frontmatter.
- Root `.instructions.md` had become a compatibility pointer and duplicated policy intent.

### Decision

- Standardize on continuous-flow governance.
- Migrate prompt frontmatter from `mode` to `agent`.
- Remove universal role `applyTo` declarations to avoid role-collision in context.
- Delete root `.instructions.md` and keep canonical operating policy under `.github/`.

### Consequences

- Positive: cleaner instruction model, fewer conflicts, and valid prompt schema.
- Trade-offs: relies on `.github/` structure as the single governance source.

### Owner

- Product Owner + Team

---

## DEC-0003

### Date

2026-03-16

### Context

- Strict role gates were defined but not yet enforced in repository workflows.
- Team needs deterministic checks that prevent incomplete handoffs.

### Decision

- Add pull request template requiring acceptance, decision, QA, docs, and rollback evidence.
- Add feature intake issue template for PM-quality upstream inputs.
- Add CI workflow to block pull requests when required gate markers are missing.

### Consequences

- Positive: higher consistency and reduced chance of bypassing critical gates.
- Trade-offs: more PR authoring overhead and stricter workflow compliance required.

### Owner

- Product Owner + Team

---

## DEC-0002

### Date

2026-03-16

### Context

- Product Owner selected all roles active from week one.
- Team requires strict blocking quality gates and shared agent standards.
- Long-running collaboration needs deterministic handoffs and reusable workflows.

### Decision

- Adopt a role-based agentic operating model across PM, Architect, Backend, Frontend, QA, DevOps, and Docs.
- Use shared customization under `.github/` for team instructions, prompts, and skills.
- Enforce strict gate policy: no merge or release when required artifacts are missing.

### Consequences

- Positive: clear ownership, consistent outputs, and higher release safety.
- Trade-offs: more process overhead and stricter handoff discipline required.

### Owner

- Product Owner + Team

---

## DEC-0001

### Date

2026-03-16

### Context

- Project is starting from a near-empty repository.
- Long-running collaboration needs persistent context to avoid repetition and drift.

### Decision

- Adopt a lean documentation system with four core files: `README.md`, `PROJECT.md`, `SESSIONS.md`, `.instructions.md`.
- Use hybrid session cadence with weekly reset summaries.

### Consequences

- Positive: low overhead with strong continuity.
- Trade-offs: requires disciplined updates every session.

### Owner

- Team
