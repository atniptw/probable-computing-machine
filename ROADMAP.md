# Improvement Roadmap

Structured around the harness engineering model: **Guides** (feedforward controls that shape behavior before it happens) and **Sensors** (feedback controls that detect problems after). Three sensor dimensions: Maintainability, Architecture Fitness, and Behavior.

---

## Current Harness State

| Dimension                    | Status   | Notes                                                                     |
| ---------------------------- | -------- | ------------------------------------------------------------------------- |
| Guides                       | Strong   | `CLAUDE.md`, role instructions, 8 `docs/` files, `DECISIONS.md`           |
| Maintainability sensors      | Good     | ESLint, Prettier, TypeScript, pre-commit lint-staged, coverage thresholds |
| Architecture fitness sensors | Weak     | No structural or contract tests                                           |
| Behavior sensors             | Partial  | Hooks and services well-covered; zero component tests; 1 smoke E2E        |
| Inferential controls         | Emerging | Reviewer agent added but ad-hoc                                           |

---

## Wave 1 — Close Immediate Gaps

_Low effort. Closes known holes without changing architecture._

### 1.1 Add gym data unit tests

**What:** `src/tests/gyms.test.ts` covering `getGymsForGame`, `getGymById`, and roster shape for all 8 leaders.

**Why:** The gym feature shipped without any tests on its static data. Logged as a QA follow-up. A future data entry error (wrong name, wrong level) would be caught nowhere.

**Harness type:** Behavior sensor.

---

### 1.2 Run unit tests in pre-commit hook

**What:** Add `vitest run --run` to `.husky/pre-commit` so tests execute before every commit, not just in CI.

**Why:** Currently pre-commit only runs lint and format. A broken test can be committed and only fails in CI. "Keep quality left" — catch regressions at the earliest possible point.

**Harness type:** Computational sensor, shifted left.

**Trade-off:** Adds ~3–5s to every commit. Acceptable for a suite this size.

---

### 1.3 Fix accessibility gaps on gym buttons

**What:** Add `aria-pressed={selectedGymId === gym.id}` to `GymLeaderSelector` buttons and `aria-pressed={isSelected}` to `GymTeamPanel` buttons.

**Why:** Flagged by the code reviewer. Screen reader users cannot determine which gym or Pokemon is selected.

**Harness type:** Behavior sensor (a11y correctness).

---

## Wave 2 — Behavior Harness

_Medium effort. The biggest coverage gap: 12 UI components with zero unit tests._

### 2.1 Add component tests for new gym components

**What:** React Testing Library tests for `GymLeaderSelector` and `GymTeamPanel`.

**Why:** The two components we just shipped have no test coverage. Start here before adding tests for older components.

**Cover:**

- Gym list renders all leaders with correct names and type labels.
- Clicking a gym leader calls `onSelect` with the right ID.
- Selected gym is visually indicated.
- Empty state renders the no-data message for non-Emerald games.
- Clicking a team Pokemon calls `onPokemonSelect` with the correct name.

**Harness type:** Behavior sensor.

---

### 2.2 Expand e2e smoke test to cover gym leader flow

**What:** Add a gym leader scenario to `e2e/matchup-smoke.spec.ts`:

- Toggle to Gym Leader mode.
- Select a gym.
- Click a team Pokemon.
- Assert the matchup viewer renders for that Pokemon.

**Why:** The free-battle flow is covered by e2e. The gym flow is not. If the wiring between gym selection and the matchup hook breaks, nothing catches it.

**Harness type:** Behavior sensor, end-to-end.

---

### 2.3 Add component tests for AppView and MatchupViewer

**What:** RTL tests for `BattleSelectorSection`, `TeamEditorPanel`, `MatchupContainer`, and their children.

**Why:** The coverage scope currently excludes `src/components/` entirely. The entire UI layer is black-boxed to the test suite. Prioritize components with branching render logic first.

**Harness type:** Behavior sensor.

---

### 2.4 Add components to coverage scope and raise thresholds

**What:** Extend `coverage.include` in `vite.config.ts` to `src/components/**/*.tsx` once component tests exist. Then raise thresholds incrementally.

**Why:** Coverage thresholds are meaningless if the most complex user-facing layer is excluded from measurement.

**Harness type:** Computational sensor (enforcement).

---

## Wave 3 — Architecture Fitness Harness

_Medium effort. Tests that enforce structural rules, not just behavior._

### 3.1 Import boundary tests

**What:** A test file (or a custom ESLint rule) that asserts architectural constraints:

- `src/hooks/` does not import from `src/components/`.
- `src/data/` does not import from `src/hooks/` or `src/services/`.
- `src/services/` does not import from `src/hooks/` or `src/components/`.

**Why:** These rules exist implicitly (they're in CLAUDE.md and the docs) but nothing enforces them. As the codebase grows, a bad import can silently violate the architecture and only becomes visible during a painful refactor.

**Harness type:** Architecture fitness sensor.

---

### 3.2 PokéAPI contract tests

**What:** Tests that assert the shapes returned by the real PokéAPI (or a realistic fixture) match the TypeScript interfaces in `pokeapi.ts`. Cover: Pokemon detail shape, name index shape, type map shape, move type shape.

**Why:** `API_SPEC.md` documents the contract, but nothing verifies it. If PokéAPI changes a field name or nests data differently, the app silently breaks. TypeScript only catches this if the types are updated — contract tests catch it even if the types lag.

**Harness type:** Architecture fitness sensor.

---

### 3.3 Generation-aware type chart explicit tests

**What:** Targeted tests that verify specific Gen 1 and Gen 6 type chart differences (e.g. Ghost immunities in Gen 1, Fairy type in Gen 6) produce the correct effectiveness values.

**Why:** Generation-aware logic is the most complex part of the app and the easiest place for a subtle regression to hide. Currently tested only implicitly through `calcEffectiveness` and `useMatchupMatrix`.

**Harness type:** Behavior sensor (domain logic).

---

## Wave 4 — Inferential Controls

_Longer-term. AI-assisted review as a structured, repeatable part of the harness._

### 4.1 Formalize the reviewer agent as a skill

**What:** Create a `.claude/commands/review.md` skill with a consistent prompt template that:

- Summarizes the diff in structured sections (bugs, contract violations, a11y, security).
- Classifies findings as blocking or minor.
- Returns a structured verdict (ship / fix first).

**Why:** The reviewer agent we added to the loop is currently a one-off prompt. Making it a skill means the same criteria and structure are applied every time, regardless of who runs it or how much context has drifted.

**Harness type:** Inferential sensor, formalized.

---

### 4.2 Architecture drift detection

**What:** A periodic check (manual or scheduled) that compares the current component and hook graph against the documented architecture in `docs/COMPONENT_DESIGN.md`. Flag when reality and docs diverge.

**Why:** The Ashby's Law point in the article: reducing variation in output requires committing to topology constraints and detecting when those constraints erode over time.

**Harness type:** Architecture fitness sensor, inferential.

---

## Sequencing

```
Now         Wave 1 (1.1, 1.2, 1.3) — small, close known gaps
Next        Wave 2.1, 2.2 — behavior tests for what just shipped
Then        Wave 2.3, 2.4 — broader component coverage
Later       Wave 3 — structural enforcement
Future      Wave 4 — inferential controls
```

Wave 1 items can be done in any order. Waves 2–4 are roughly sequential: you need behavior tests before you can meaningfully raise coverage thresholds, and you need a stable architecture before drift detection is useful.
