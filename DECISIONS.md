# Decisions Log

Use this file for lightweight ADR-style entries.

## Decision Template

### ID

DEC-XXXX

### Date

YYYY-MM-DD

### Context

- TBD

### Decision

- TBD

### Consequences

- Positive:
- Trade-offs:

### Owner

- TBD

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

### Owner

- Frontend + Architect

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
- Trade-offs: users must complete a setup step before seeing matchup output; legacy components remain in repository until a follow-up cleanup.

### Owner

- Product Owner + Frontend + Architect

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
