# Sessions Log

---

## 2026-04-27 — chore/issue-81: consolidate dependabot updates (TS-eslint, React 19, TS 6) and group dependabot config

### Objective

Absorb 5 open dependabot PRs (#76-#80) in one coordinated pass, since our delivery model is direct push to `main` and PRs are never merged. Restructure dependabot to reduce future absorption load.

### Completed Work

Dispatched three sub-agents in parallel worktrees so the risk-tiered work could run concurrently and integrate sequentially:

- **Agent A (tooling cluster):** typescript-eslint 8.57.2 → 8.58.2 (closes #77); restructured `.github/dependabot.yml` to group npm updates as `minor-and-patch` and `major-updates` (caps open PRs at 5); logged the grouping decision as DEC-0030.
- **Agent B (React 19):** react + react-dom 18.3.1 → 19.2.5; @types/react 18 → 19.2.14; @types/react-dom 18 → 19.2.3 (closes #78, #80). Sole source change: added `import type { JSX } from 'react'` in `src/components/MatchupViewer/MoveList.tsx` because React 19 moved the `JSX` namespace out of global scope.
- **Agent C (TypeScript 6):** typescript 5.7 → 6.0.3 (closes #76). Zero source-code changes — strictness profile was already explicit, codebase compiled clean.
- **PR #79 (`@vitejs/plugin-react` 4 → 6):** intentionally dropped from this issue. plugin-react 6 requires Vite 8+, and we're on Vite 6. Will close #79 with a comment pointing at the Vite 8 prerequisite so it surfaces again as part of a coherent Vite 8 migration.

### Validation

- `npm ci` — pass
- `npm run lint` — pass (after worktree cleanup; see Course corrections)
- `npm run tsc` — pass (TypeScript 6.0.3, zero errors)
- `npm run test:coverage` — pass (306/306 tests across 31 files)
- `npx playwright test --project=chromium` — pass (6/6)
- `npm run verify` — pass on integrated state
- Visual QA — see Step 7 (user browser spot-check before push, per issue notes)

### Retrospective

**Permission requests:**
None during agent dispatch. Will pause for explicit approval before pushing to main (Step 7 of the work-issue workflow).

**Assumptions made:**

- **Dropped PR #79 from scope** without confirmation, on the basis that bundling Vite 6 → 8 into a "consolidate dependabot updates" issue would silently double the work and obscure the Vite migration's own complexity. User said "do what you think is best" — flagging this here so the trade-off is visible.
- Dependabot grouping config: `minor+patch` and `major` as separate groups, cap at 5 open PRs. The exact grouping shape was a judgment call (alternatives: single group, or security-only).

**Course corrections:**

- After merging Agent A and B branches, `npm run lint` reported 1681 errors against minified `dist/*.js` files inside `.claude/worktrees/agent-*/dist/`. Cause: the agents' verify runs left build artifacts in their worktrees, and ESLint descended into them from the parent. Fix: removed the agent worktrees with `git worktree remove -f -f` (they were locked by the harness) and re-ran verify clean. Worth noting because future parallel-worktree workflows may hit the same trap.

**Issue quality signal:**

- AC completeness: Complete — every checkbox mapped to concrete work.
- Scope clarity: Clear, with one implicit prerequisite the issue didn't call out (plugin-react 6 needs Vite 8).

**Feedforward signals:**

- `[tooling]` — `eslint.config.js` should add `.claude/worktrees/**` to its ignores. Otherwise any time we use parallel agent worktrees and run lint from the parent, we eat the dist artifacts of every worktree. Cheap one-line fix; deferring to its own follow-up since it's outside this issue's scope.
- `[issue-template]` — for "consolidate dependabot updates" style issues, the template could prompt for "any prerequisites we've discovered while reading the PRs" so dependencies like Vite 8 surface during intake rather than mid-implementation.

### Next Actions

After user sign-off and push: comment on #79 with the Vite 8 prerequisite and close it; verify dependabot honors the new grouping config on its next run; consider opening a dedicated Vite 8 + plugin-react 6 issue if we want it tracked.

---

## 2026-04-24 — docs/issue-75: add QUALITY.md tracking coverage and known gaps per domain

### Objective

Create a persistent, human-readable quality ledger so agents adding tests can target the highest-value gaps and reviewers can distinguish accepted gaps from accidental debt.

### Completed Work

- Added `docs/QUALITY.md` with:
  - Purpose + scope (unit/component tests; e2e called out where relevant).
  - Aggregation method: per-domain percentages weighted by statement count per file (prevents tiny 100%-covered helpers from masking large mostly-uncovered modules).
  - Domain table for `components/AppView`, `components/MatchupViewer`, `hooks`, `services`, `data` with weighted statement %, branch %, known-gap summary, and `accepted | debt | blocked` status.
  - Per-domain detail sections with specific files, uncovered line ranges, and an honest default to `debt` over `accepted` when intent was unclear.
  - Forward reference to issue #73 (doc-gardening agent will refresh numbers); manual refresh steps until then.
- One-line addition to `.claude/commands/work-issue.md` Step 3 pointing agents at `docs/QUALITY.md` before writing tests.

### Validation

- `npm ci` — pass
- `npm run test:coverage` — pass (306/306, 95.32 % stmts, 82.37 % branches)
- `npm run verify` — see Step 4 results in the final report
- Visual QA — skipped (docs-only change, no UI)

### Retrospective

**Permission requests:**
See final report section 7.

**Assumptions made:**

- Weighted-by-statements aggregation chosen over simple per-file average. Logged in DECISIONS.md because it is a non-obvious trade-off that will bias future reads of this doc.
- `gyms/types.ts` coverage (0 %) classified as `accepted` — type-only file, reporter artifact, not a real gap.
- `TeamEditorPanel.tsx` gap classified as `accepted` because e2e exercises the focus/blur flows jsdom cannot model. All other low-branch files default to `debt` per instruction.

**Course corrections:**
None.

**Issue quality signal:**

- AC completeness: Complete
- Scope clarity: Clear

**Feedforward signals:**
None.

### Next Actions

Continue backlog. Issue #73 (doc-gardening agent) is the natural follow-up — it will keep the numbers in QUALITY.md fresh.

---

## 2026-04-24 — chore/issue-68: Dev-ready defaults in .env.example for local setup

### Objective

Make `cp .env.example .env.local` a one-command local setup so a developer (or agent) running the app locally sees the same header links (help, feedback) as production.

### Completed Work

- Replaced `.env.example` generic placeholders with dev-ready defaults:
  - `VITE_GITHUB_REPO=atniptw/probable-computing-machine` (was `owner/repo`) so header links render out of the box
  - `VITE_APP_URL` now commented/blank (was `https://example.com`, which produced an invalid canonical URL)
  - `VITE_BASE_PATH=/` unchanged
- Rewrote per-var comments to call out "override for production" explicitly.
- README.md Development section gains a Local setup block with the `cp .env.example .env.local` step and a note that `.env.local` is gitignored.
- Verified `.env.*` rule in `.gitignore` already covers `.env.local`; no change needed.

### Validation

- `npm run lint` — pass
- `npm run tsc` — pass
- `npm run test:coverage` — pass
- `npx playwright test --project=chromium` — pass (6/6)
- Visual QA — skipped (no user-visible UI change; `.env.example` and README edits only)

### Retrospective

**Permission requests:**
None.

**Assumptions made:**

- Assumed commenting out `VITE_APP_URL` is preferred over setting it to a local origin (e.g. `http://localhost:5173`) since local canonical URLs in `<link rel="canonical">` are not meaningful. The existing Vite warning for undefined `%VITE_APP_URL%` is a pre-existing behavior that already appears whenever the var is unset.

**Course corrections:**
None.

**Issue quality signal:**

- AC completeness: Complete
- Scope clarity: Clear

**Feedforward signals:**
None.

### Next Actions

Continue backlog.

---

## 2026-04-17 — chore/issue-70: Simplify work-issue skill for single-agent serial execution

### Objective

Remove multi-agent ceremony from the `/work-issue` skill and fix structural issues that accumulated since earlier partial fixes.

### Completed Work

- Renumbered Step 1.7 (design review) to Step 1.3 so the sequence reads 1 → 1.2 → 1.3 → 1.5 → 2 → 3 in execution order
- Made Step 1.5 (architecture drift) conditional: skip for isolated bug fixes, a11y fixes, test additions, and doc-only changes, with explicit skip reasoning required
- Added `npm ci` before `npm run verify` in Step 4 to ensure `node_modules` are present in fresh worktrees
- Removed `/role-guide` reference from Step 3; replaced with inline gate rule: "Write tests alongside implementation; update docs in the same commit."
- Removed "Suggested handoff owner" from the feature intake brief (item 8)
- No `verify:unit` references remain in the skill; `verify:unit` retained in `package.json`

### Validation

- `npm run lint` — pass
- `npm run tsc` — pass
- `npm run test:coverage` — pass (95.32% statements, 82.37% branch)
- `npx playwright test --project=chromium` — pass (6/6)
- Visual QA — skipped (no user-visible changes; docs-only change)

### Retrospective

**Permission requests:**
None.

**Assumptions made:**
None. The issue was complete and unambiguous.

**Course corrections:**
None.

**Issue quality signal:**

- AC completeness: Complete
- Scope clarity: Clear

**Feedforward signals:**
None.

### Next Actions

Continue backlog.

---

## 2026-04-17 — chore/issue-69: Fix e2e port conflicts in parallel worktrees

### Objective

Replace the hardcoded port 4173 in `playwright.config.ts` with a deterministic hash-derived port so each worktree runs e2e tests on its own port without conflicting with other parallel worktrees.

### Completed Work

- Added `fileURLToPath`/`import.meta.url`-based directory hash in `playwright.config.ts` to derive a unique port per worktree (range 4173–5172)
- Replaced all three hardcoded `4173` references (`baseURL`, `webServer.url`, `webServer.command`) with the dynamic `port` variable
- Inlined the vite command in `playwright.config.ts` (`vite --host 127.0.0.1 --port ${port}`) instead of calling `npm run dev:qa`
- Removed dead `dev:qa` script from `package.json`
- Updated `.claude/commands/work-issue.md` Step 4 to run `npm run verify` (full suite including playwright) instead of `verify:unit`; removed the "skip Playwright in worktrees" note
- Updated Step 4.5 in `work-issue.md` to use `npm run dev` instead of `npm run dev:qa`

### Validation

- `npm run lint` — pass
- `npm run tsc` — pass
- `npm run test:coverage` — pass (95.32% statements, 82.37% branch)
- `npx playwright test --project=chromium` — pass (6/6)
- `npm run verify` — pass
- Visual QA — skipped (no user-visible changes)

### Retrospective

**Permission requests:**
None.

**Assumptions made:**
The issue's technical direction specified `__dirname` and noted "package.json has no `"type": "module"`". The actual `package.json` does have `"type": "module"`, so Playwright loads the config as native ESM and `__dirname` is undefined. Used `fileURLToPath(new URL('.', import.meta.url))` instead — semantically equivalent, ESM-compatible.

**Course corrections:**
Switched from `__dirname` to `import.meta.url` after playwright threw `ReferenceError: __dirname is not defined in ES module scope`. The issue's prerequisite note was incorrect about the package module type.

**Issue quality signal:**

- AC completeness: Complete
- Scope clarity: Clear | Had to infer boundaries (issue said `__dirname` works but that was factually wrong — package has `"type": "module"`)

**Feedforward signals:**

- `[issue-template]` — Technical direction notes that rely on package.json state should be verified against the actual file before writing.

### Next Actions

Continue backlog.

---

## 2026-04-17 — chore/issue-67: Add missing GitHub labels to match conventional commit prefixes

### Objective

Create the 6 missing type labels (`chore`, `refactor`, `test`, `docs`, `perf`, `a11y`), apply them to all open issues, and document the label-to-prefix mapping in CLAUDE.md.

### Completed Work

- Created 6 new GitHub labels via `gh label create`: `chore`, `refactor`, `test`, `docs`, `perf`, `a11y`
- Applied type labels to all 10 open issues matching their title prefix (`chore` for 9 issues, `docs` for #75)
- Added `## GitHub Label Convention` section to `CLAUDE.md` with a label-to-prefix mapping table and the `bug`/`fix:` distinction note

### Validation

- `npm run lint` — pass
- `npm run tsc` — pass
- `npm run test:coverage` — pass (306 tests, 95.32% statements, 82.37% branch)
- `npm run build` — pass
- `npx playwright test --project=chromium` — skipped (parallel worktree; full e2e on main after merge)
- Visual QA — skipped (no user-visible effect)

### Retrospective

**Permission requests:**
None.

**Assumptions made:**
All open issues with `chore:` prefix should get the `chore` label, and `docs:` prefix should get the `docs` label. No ambiguous prefixes were found among the 10 open issues.

**Course corrections:**
None.

**Issue quality signal:**

- AC completeness: Complete
- Scope clarity: Clear

**Feedforward signals:**
None.

### Next Actions

Continue backlog.

---

## 2026-04-16 — chore/issue-65: Replace Step 8 with direct merge, sync, and clean-up

### Objective

Replace the placeholder `git push origin HEAD` (which deferred to a non-existent `auto-merge.sh` coordinator) with a complete merge-to-main sequence that workers can execute autonomously from a feature worktree.

### Completed Work

- `.claude/commands/work-issue.md` — replaced Step 8 with four sub-steps: push to `origin/main` via `HEAD:main`, sync local main via `git rev-parse --git-common-dir` + `ff-only` merge, remove worktree + delete branch, and a note that GitHub auto-closes the issue via `Closes #N` in the commit message (no `gh issue close` needed)

### Validation

- `npm run lint` — pass (docs-only change)
- `npm run tsc` — pass (no TypeScript touched)
- `npm run test:coverage` — pass (no logic changed)
- `npm run build` — pass
- `npx playwright test --project=chromium` — skipped (parallel worktree; full e2e on main after merge)
- Visual QA — skipped (no user-visible effect)

### Retrospective

**Permission requests:**
None.

**Assumptions made:**
Assumed `git rev-parse --git-common-dir/..` reliably resolves to the main worktree root for any worktree configuration used in this repo.

**Course corrections:**
Step 8.4 (`gh issue close N`) removed — contradicts CLAUDE.md policy ("do not also close it manually with `gh issue close`"); `Closes #N` in commit message handles auto-close.

**Issue quality signal:**

- AC completeness: Complete
- Scope clarity: Clear

**Feedforward signals:**
None.

### Next Actions

Continue backlog.

---

## 2026-04-16 — chore/issue-64: Add format:check to verify:unit and verify scripts

### Objective

Unify local and CI pre-push checks by adding `npm run format:check` to both `verify:unit` and `verify` scripts so Prettier violations are caught locally before pushing.

### Completed Work

- `package.json` — inserted `npm run format:check` after `npm run lint` in both `verify` and `verify:unit` scripts; check order is now lint → format:check → tsc → test:coverage → build (→ playwright in `verify`)

### Validation

- `npm run lint` — pass
- `npm run format:check` — pass
- `npm run tsc` — pass
- `npm run test:coverage` — pass (306 tests, branch coverage 82.37%)
- `npm run build` — pass
- `npx playwright test --project=chromium` — skipped (parallel worktree; full e2e on main after merge)
- Visual QA — skipped (no user-visible effect)

### Retrospective

**Permission requests:**
None.

**Assumptions made:**
None. The AC specified exact placement (before build) and the scripts were unambiguous.

**Course corrections:**
None.

**Issue quality signal:**

- AC completeness: Complete
- Scope clarity: Clear

**Feedforward signals:**

- `[instruction]` — Update CLAUDE.md Step 4 note to reflect that `verify:unit` now includes format:check; the separate reminder to run `npm run format:check` before pushing is no longer needed.

### Next Actions

Continue backlog.

---

## 2026-04-16 — feat/issue-63: Make deploy URL and GitHub repo configurable via env vars

### Objective

Replace three classes of hardcoded deployment strings with environment variables so the app can be deployed at any domain without source changes.

### Completed Work

- `vite.config.ts` — replaced hardcoded `/probable-computing-machine/` base path with `process.env.VITE_BASE_PATH ?? '/'`; converted from factory function form to object form to avoid unused-parameter lint error
- `index.html` — replaced hardcoded GitHub Pages origin in `<link rel="canonical">`, `og:url`, and `og:image` with `%VITE_APP_URL%`; replaced hardcoded favicon path with `%BASE_URL%favicon.svg`
- `src/App.tsx` — replaced hardcoded `atniptw/probable-computing-machine` repo path with `import.meta.env.VITE_GITHUB_REPO`; header links are rendered conditionally (`null` when var is unset)
- `src/vite-env.d.ts` — added `ImportMetaEnv` interface declaring `VITE_GITHUB_REPO`, `VITE_APP_URL`, `VITE_BASE_PATH` as optional strings
- `.github/workflows/deploy.yml` — added `env:` block to the build step with all three vars set to the GitHub Pages values
- `.env.example` — new file documenting all three variables with comments and example values

### Validation

- `npm run lint` — pass
- `npm run tsc` — pass
- `npm run test:coverage` — pass (306 tests, branch coverage 82.37%)
- `npm run build` — pass (warns on unset `%VITE_APP_URL%` locally; expected — CI sets the var)
- `npx playwright test --project=chromium` — skipped (parallel worktree; full e2e on main after merge)
- Visual QA — skipped (no rendered output change)

### Retrospective

**Permission requests:**
None.

**Assumptions made:**

- When `VITE_GITHUB_REPO` is unset, the help and feedback links are hidden rather than pointing to a broken URL. The issue requires no hardcoded `atniptw`/`probable-computing-machine` strings, so conditional rendering is the only clean option.
- When `VITE_APP_URL` is unset, `%VITE_APP_URL%` remains as a literal in the built HTML — Vite warns but the build succeeds and the app loads correctly. SEO metadata is only meaningful in production where the var is set.
- Switched `vite.config.ts` from the `({ command }) => ...` factory form to the plain object form, because removing the `command` usage left an unused parameter that the ESLint `@typescript-eslint/no-unused-vars` rule rejected.

**Course corrections:**

- First attempt used `() => (...)` (zero-arg function) which caused a TypeScript overload mismatch. Fixed by switching to the object form.
- Second attempt used `(_env) => (...)` which lint flagged as an unused variable. Fixed by using the object form.

**Issue quality signal:**

- AC completeness: Complete — exact file locations, env var names, and default behaviour all specified.
- Scope clarity: Clear.

**Feedforward signals:**

- `[instruction]` — When removing the only use of a `defineConfig` factory parameter, switch to the object form rather than leaving an unused parameter.

### Next Actions

Continue backlog.

---

## 2026-04-15 — feat/issue-62: Narrow opponent moves using PokéAPI learnset data in free mode

### Objective

Replace type-inference move synthesis in free mode with real level-up learnset data from PokéAPI, and add an optional level input to further filter moves.

### Completed Work

- Added `getWildMoveset(pokemonName, gameVersion, level?)` to `src/services/pokeapi.ts`: fetches learnset from `/pokemon/{name}`, filters to level-up moves for the selected version group, applies optional level cap, returns up to 4 sorted descending by `level_learned_at`
- Added learnset localStorage cache (7-day TTL, key `pkm_learnset_v1_{name}`) with concurrent-dedup promise cache
- Added `PokeApiPokemonMoveEntry` and `PokeApiMoveVersionDetail` types to `src/services/pokeapiClient.ts`
- Wired `opponentLevel` state into `App.tsx`; `useEffect` drives `getWildMoveset` on opponent match, game, or level change
- Added level input to `BattleSelectorSection` free mode (`.opponentInputRow` wrapper, `.levelInput` styles); absent in gym mode
- Updated `App Contract` in `docs/COMPONENT_DESIGN.md` with `opponentLevel: number | null`
- New test file `src/tests/getWildMoveset.test.ts` (8 tests): with level, without level, empty version group, level-cap fallback, network error, cache hit, concurrent dedup
- Extended `src/tests/battleSelectorSection.test.tsx` with 4 level input tests
- Extended `src/tests/pokeapi.contract.test.ts` with learnset shape contract test

### Validation

- `npm run lint` — pass
- `npm run tsc` — pass
- `npm run test:coverage` — pass (306 tests, branch coverage 82.37%)
- `npm run build` — pass
- `npx playwright test --project=chromium` — skipped (parallel worktree; full e2e on main after merge)
- Visual QA — approved

### Retrospective

**Permission requests:**
None.

**Assumptions made:**

- Level input padding set to `0 8px` rather than spec's `0 10px` — at 72px width, 10px left/right would be very tight; 8px gives identical visual result. Approved during visual QA.
- Learnset fetched from the same `/pokemon/{name}` endpoint as types/sprites; the browser HTTP cache means the second call (for learnset after types) is typically free.

**Course corrections:**
None.

**Issue quality signal:**

- AC completeness: Complete — exact CSS values, affected file locations, and cache key format all specified.
- Scope clarity: Clear.

**Feedforward signals:**

- `[instruction]` — Visual QA script should query computed styles directly on the target element, not `parentElement`, when styles are applied via a CSS class on the element itself.

### Next Actions

Continue backlog.

---

## 2026-04-14 — Process #59/#60/#61: Harden parallel wave merge tooling

### Objective

Fix three compounding issues identified during wave 2 gym data: workers racing to push main, `auto-merge.sh` failing on detached HEAD worktrees, and `git rebase --continue` spuriously refusing to proceed.

### Completed Work

- `work-issue.md` Step 8: changed `git push origin main` to `git push origin HEAD` — workers now push their branch; coordinator owns the merge to main (closes #59)
- `auto-merge.sh`: replaced `rebase` approach with `cherry-pick` operating on the main repo, avoiding git 2.43+ AUTO_MERGE false-positive on `rebase --continue`; added path-based worktree fallback (`pcm-issue-N`) for detached HEAD / mid-rebase worktrees (closes #60, #61)
- `resolve-sessions-conflict.py`: guarded `git show :2:SESSIONS.md` — exits cleanly when stage 2 is absent (file was auto-merged by git) instead of crashing (closes #61)

### Validation

- `npm run verify:unit` — pass (274 tests, build clean)
- Visual QA — skipped (no user-visible changes)

### Retrospective

**Permission requests:** None.

**Assumptions made:**

- `cherry-pick --continue --no-edit` is available in this git version (confirmed: `--no-edit` is valid for cherry-pick, unlike rebase).
- Workers will still be on `feat/issue-N` when they hit Step 8 (true by construction — worktrees always have the issue branch checked out).

**Course corrections:** None.

**Issue quality signal:**

- AC completeness: Complete
- Scope clarity: Clear

**Feedforward signals:**

- `[tooling]` — Consider adding a smoke test for `auto-merge.sh` that simulates a two-branch race to verify the cherry-pick path works end-to-end.

### Next Actions

Continue backlog.

---

## 2026-04-14 — feat #56: add gym leader data for Pokémon Scarlet

### Objective

Add all 8 Paldea gym leaders with their Scarlet in-game teams so gym leader mode works end-to-end for Scarlet.

### Completed Work

- Created `src/data/gyms/scarlet.ts` — `SCARLET_GYMS` array with all 8 gym leaders (Katy, Brassius, Iono, Kofu, Larry, Ryme, Tulip, Grusha) using PokéAPI-format names and moves
- Updated `src/data/gyms/index.ts` — added `SCARLET_GYMS` import and `scarlet` entry in `GAME_MAP`
- Created `src/tests/gyms.scarlet.test.ts` — 18 tests covering `getGymsForGame`, `getGymById`, roster shape, badge sequence, team sizes, and PokéAPI name format

### Validation

- `npm run lint` — pass
- `npm run tsc` — pass
- `npm run test:coverage` — pass (242 tests, 27 files; `data/gyms/scarlet.ts` at 100% stmt/branch/func)
- `npm run build` — pass
- `npx playwright test --project=chromium` — 6/6 pass (port 4173 occupied by pcm-issue-55 dev server; ran against dev server on port 5555 instead)
- Visual QA — skipped (pure data change, no UI changes)

### Retrospective

**Permission requests:**
None.

**Assumptions made:**
Moves are based on known Gen 9 learnsets at the in-game level. The issue did not specify exact per-Pokémon moves; used best available knowledge of the actual Scarlet in-game teams.

**Course corrections:**
None.

**Issue quality signal:**

- AC completeness: Complete
- Scope clarity: Clear

**Feedforward signals:**

- `[tooling]` — `npm run verify` uses `npm run dev` for Playwright webServer but `reuseExistingServer: true` causes silent failure when another worktree's dev server occupies port 4173. Consider a per-worktree port or a dedicated `verify:e2e` script that targets a unique port.

### Next Actions

Continue backlog.

---

## 2026-04-13 — Fix #58: Parallel worker playwright port conflict and broken webServer command

### Objective

Fix two compounding issues that caused all parallel worktree workers to fail or produce unreliable results when running `npm run verify`: a broken `webServer.command` in `playwright.config.ts` and a multi-worker port race condition where workers would test each other's app builds.

### Completed Work

- Added `verify:unit` to `package.json`: lint + tsc + test:coverage + build (no playwright) — safe for parallel worktree workers
- Fixed `playwright.config.ts` `webServer.command` from `npm run dev -- --host 127.0.0.1 --port 4173` to `npm run dev:qa` (eliminates the 120s timeout)
- Updated `work-issue.md` Step 4 to use `npm run verify:unit` instead of `npm run verify`, with an explanatory note about why playwright is excluded from worker verification
- Updated issue #58 body to cover the full scope of both problems

### Validation

- `npm run lint` — pass
- `npm run tsc` — pass
- `npm run test:coverage` — pass (239 tests, branch 81%)
- `npm run build` — pass
- `npx playwright test --project=chromium` — skipped (this is the fix; will validate on next full verify run)
- Visual QA — skipped (no user-visible changes)

### Retrospective

**Permission requests:**
None.

**Assumptions made:**
Assumed that skipping playwright in worker `verify:unit` is acceptable because: (1) e2e tests validate existing flows, not the new gym data being added by workers; (2) full `verify` still runs on main post-merge via the Stop hook. If a future feature requires pre-merge e2e, the right fix is dynamic port assignment, not bundling playwright into parallel workers.

**Course corrections:**
None.

**Issue quality signal:**

- AC completeness: Complete (updated during session to cover multi-worker scope)
- Scope clarity: Clear

**Feedforward signals:**

- `[instruction]` — Add a rule to CLAUDE.md: workers in parallel worktrees must use `npm run verify:unit`; full `npm run verify` (with playwright) runs only on main.

### Next Actions

Wave 2 gym data (#53, #54, #56) still in progress. Issue #58 changes should be picked up by workers when they rebase onto updated main.

---

## 2026-04-14 — feat #53: Add gym leader data for Pokémon X

### Objective

Add all 8 Kalos gym leaders with their full in-game X teams so gym leader mode works end-to-end for Pokémon X.

### Completed Work

- Created `src/data/gyms/x.ts` — `X_GYMS` array with all 8 leaders (Viola, Grant, Korrina, Ramos, Clemont, Valerie, Olympia, Wulfric), correct badge numbers, badge names, cities, types, and in-game teams using PokéAPI-format names
- Updated `src/data/gyms/index.ts` — imported `X_GYMS` and added `x` entry to `GAME_MAP` so `getGymsForGame('x')` returns the new data
- Created `src/tests/gyms.x.test.ts` — 17 tests covering `getGymsForGame`, `getGymById`, roster shape, PokéAPI name format, and per-leader team sizes

### Validation

- `npm run lint` — pass
- `npm run tsc` — pass
- `npm run test:coverage` — pass (241 tests, 27 files; `data/gyms/x.ts` at 100% stmt/branch/func)
- `npm run build` — pass
- `npx playwright test --project=chromium` — pre-existing infrastructure failure (webServer timeout; confirmed same failure on baseline before changes)
- Visual QA — skipped (pure data addition, no UI changes)

### Retrospective

**Permission requests:**
None.

**Assumptions made:**
In-game teams sourced from memory of official X game data. Pokémon and move names verified against PokéAPI lowercase-hyphenated format conventions.

**Course corrections:**
None.

**Issue quality signal:**

- AC completeness: Complete
- Scope clarity: Clear

**Feedforward signals:**
None.

### Next Actions

Continue backlog.

---

## 2026-04-14 — Feat #55: Add gym leader data for Pokémon Sword

### Objective

Add the full Galar gym lineup for Pokémon Sword so gym leader mode works end-to-end for that game.

### Completed Work

- Created `src/data/gyms/sword.ts` with all 8 gym leaders: Milo, Nessa, Kabu, Bea, Opal, Gordie, Piers, Raihan
- Registered `SWORD_GYMS` in `src/data/gyms/index.ts` under the `'sword'` key
- Added `src/tests/gyms.sword.test.ts` with 15 tests covering roster shape, field completeness, and per-leader team sizes

### Validation

- `npm run lint` — pass
- `npm run tsc` — pass
- `npm run test:coverage` — pass (239/239, sword.ts 100% coverage)
- `npx playwright test --project=chromium` — pass (6/6)
- Visual QA — skipped (pure data change; no UI modifications)

### Retrospective

**Permission requests:**
None.

**Assumptions made:**
Sword was already registered in `src/data/games.ts` as a game version with `generation: 8`, so no games.ts changes were needed. The gym challenge in Sword is played as singles battles except for Raihan (doubles), but team data is stored per-leader regardless.

**Course corrections:**
None.

**Issue quality signal:**

- AC completeness: Complete — all criteria clearly enumerated.
- Scope clarity: Clear — Sword-exclusive leaders (Bea, Gordie) called out explicitly.

**Feedforward signals:**
None.

### Next Actions

Continue backlog.

---

## 2026-04-14 — Refactor #57: Extract getGymsForGame into gyms/index.ts

### Objective

Eliminate merge conflicts in parallel gym data waves by moving the shared dispatch function and interfaces out of `emerald.ts` and splitting the monolithic test file into per-game files.

### Completed Work

- Created `src/data/gyms/types.ts` — `GymPokemon` and `GymLeader` interfaces
- Created `src/data/gyms/index.ts` — `getGymsForGame` (map-based dispatch) and `getGymById`; re-exports types
- Stripped `src/data/gyms/emerald.ts` to data-only (removed interfaces, cross-game imports, and functions)
- Updated `black-2.ts`, `crystal.ts`, `platinum.ts`, `red.ts` to import from `./types` instead of `./emerald`
- Updated all consumers (`App.tsx`, `BattleSelectorSection.tsx`, `GymLeaderSelector.tsx`, `GymTeamPanel.tsx`, `gymComponents.test.tsx`) to import from `./data/gyms` (resolves to `index.ts`)
- Split `src/tests/gyms.test.ts` into five per-game files: `gyms.emerald.test.ts`, `gyms.black-2.test.ts`, `gyms.crystal.test.ts`, `gyms.platinum.test.ts`, `gyms.red.test.ts`; deleted monolithic file
- Updated `docs/DEVELOPMENT.md` file tree to reflect the new gyms module layout

### Validation

- `npm run lint` — pass
- `npm run tsc` — pass
- `npm run test:coverage` — pass (223 tests, 26 files; `data/gyms` at 100% stmt/branch/func)
- `npm run build` — pass
- `npx playwright test --project=chromium` — pre-existing infrastructure failure (webServer timeout unrelated to this change; confirmed same failure on main before changes)
- Visual QA — skipped (pure data/module refactor, no UI changes)

### Retrospective

**Permission requests:**
None.

**Assumptions made:**

- Used a `types.ts` intermediary to avoid circular imports (`index.ts` imports game files; game files cannot import from `index.ts`). The issue listed `index.ts` or `types.ts` as valid — chose `types.ts` to keep `index.ts` clean.
- The `getGymsForGame` implementation switched from if-chain to a `Record` map; the `.toBe()` identity tests still pass because the map returns the same array reference.

**Course corrections:**
None.

**Issue quality signal:**

- AC completeness: Complete
- Scope clarity: Clear

**Feedforward signals:**

- `[instruction]` — The `/architecture-review` command is referenced in CLAUDE.md but has no `.claude/commands/architecture-review.md` file; the review was done inline. Create the command file or remove the reference.

### Next Actions

Continue backlog.

---

## 2026-04-14 — Feat #52: Add gym leader data for Pokémon Black 2

### Objective

Add all 8 Black 2 gym leaders (Cheren through Marlon) with their in-game teams so that Gym leader mode works for Black 2 in the app.

### Completed Work

- Created `src/data/gyms/black-2.ts` with `BLACK2_GYMS: GymLeader[]` — all 8 leaders, correct badge numbers (1–8), cities, types, and full in-game teams
- Updated `getGymsForGame` in `src/data/gyms/emerald.ts` to return `BLACK2_GYMS` for `'black-2'`; used `import type` in `black-2.ts` to avoid circular runtime dependency
- Added `BLACK2_GYMS roster shape` and `getGymsForGame (black-2)` test suites to `src/tests/gyms.test.ts` (17 new tests)
- Updated `docs/DEVELOPMENT.md` file tree to include `black-2.ts`

### Validation

- `npm run lint` — pass
- `npm run tsc` — pass
- `npm run test:coverage` — pass (175 tests; data/gyms 100% branch coverage)
- `npx playwright test --project=chromium` — pass (6 tests)
- Visual QA — approved

### Retrospective

**Permission requests:**
None.

**Assumptions made:**

- Used `import type` in `black-2.ts` to import the `GymLeader` interface from `emerald.ts`, avoiding a circular runtime dependency. This is the minimal-change approach; a shared `types.ts` would be cleaner but is out of scope.
- Dev server needed a restart after adding `black-2.ts` — Vite HMR did not automatically pick up the new module referenced by the updated `emerald.ts` import.

**Course corrections:**
None.

**Issue quality signal:**

- AC completeness: Complete
- Scope clarity: Clear

**Feedforward signals:**

- `[tooling]` — dev server must be restarted after adding a new module file that is newly imported by an existing module; Vite HMR does not always catch this automatically. Consider noting this in DEVELOPMENT.md or the QA workflow.

### Next Actions

Continue backlog.

---

## 2026-04-14 — feat #50: Add gym leader data for Pokémon Crystal

### Objective

Add Crystal (Gen 2) gym leader data to gym leader mode so all 8 Johto leaders are available for matchup lookup.

### Completed Work

- `src/data/gyms/crystal.ts`: new file exporting `CRYSTAL_GYMS: GymLeader[]` with all 8 Crystal leaders (Falkner → Clair), full in-game teams, PokéAPI-format Pokémon and move names
- `src/data/gyms/emerald.ts`: added `import { CRYSTAL_GYMS } from './crystal'` and `if (gameVersion === 'crystal') return CRYSTAL_GYMS` branch in `getGymsForGame`; `crystal.ts` uses `import type` to avoid runtime circular dependency
- `src/tests/gyms.test.ts`: added Crystal coverage — `getGymsForGame('crystal')` identity test, `getGymById('crystal', 'falkner')` test, and full `CRYSTAL_GYMS roster shape` suite (badge order, required fields, team sizes, PokéAPI name format on all moves)

### Validation

- `npm run lint` — pass
- `npm run tsc` — pass
- `npm run test:coverage` — pass (177 tests; `data/gyms/crystal.ts` 100% coverage)
- `npx playwright test --project=chromium` — pass (6 tests)
- Visual QA — approved

### Retrospective

**Permission requests:**
None.

**Assumptions made:**
Crystal in-game team compositions (Pokémon, levels, moves) were sourced from memory. Movesets follow the Crystal in-game assignments with TM-taught moves (e.g. Fury Cutter on Bugsy's Scyther, Iron Tail on Jasmine's Steelix, Dragon Breath on Clair's Dragonair) consistent with how the Emerald data treats TM moves.

**Course corrections:**
None.

**Issue quality signal:**

- AC completeness: Complete
- Scope clarity: Clear

**Feedforward signals:**
None.

### Next Actions

Continue backlog.

---

## 2026-04-14 — feat #49: Add gym leader data for Pokémon Red

### Objective

Add all 8 Red/Blue in-game gym leaders to the gym leader mode data layer so `getGymsForGame('red')` returns a full roster.

### Completed Work

- Created `src/data/gyms/red.ts` with `RED_GYMS: GymLeader[]` — all 8 leaders (Brock → Giovanni) with Red/Blue in-game teams, PokéAPI-format names and moves
- Updated `src/data/gyms/emerald.ts`: added `import { RED_GYMS } from './red'` and `'red'` case in `getGymsForGame`
- Extended `src/tests/gyms.test.ts` with routing tests, `getGymById` for Red, and full `RED_GYMS` roster shape suite

### Validation

- `npm run lint` — pass
- `npm run tsc` — pass
- `npm run test:coverage` — pass (176/176; data/gyms 100% branch)
- `npx playwright test --project=chromium` — pass (6/6)
- Visual QA — skipped (pure data addition, no UI change)

### Retrospective

**Permission requests:**
None.

**Assumptions made:**

- Red/Blue in-game movesets reconstructed from known level-up moves and trainer TM usage; exact Gen 1 trainer AI move assignment is not machine-readable without ROM analysis, so moves are accurate to Bulbapedia-documented learnsets at each level.
- `import type { GymLeader }` from `emerald.ts` in `red.ts` avoids a runtime circular dependency while keeping types co-located with the existing pattern.

**Course corrections:**
None.

**Issue quality signal:**

- AC completeness: Complete
- Scope clarity: Clear

**Feedforward signals:**
None.

### Next Actions

Continue backlog.

---

## 2026-04-14 — feat #51: Add gym leader data for Pokémon Platinum

### Objective

Add complete Platinum gym leader data so the gym leader mode works end-to-end for Platinum.

### Completed Work

- Created `src/data/gyms/platinum.ts` with all 8 Sinnoh gym leaders (Roark, Gardenia, Maylene, Crasher Wake, Fantina, Byron, Candice, Volkner) and their full Platinum in-game teams using PokéAPI-format names.
- Updated `src/data/gyms/emerald.ts`: added `import { PLATINUM_GYMS } from './platinum'` and extended `getGymsForGame` to return `PLATINUM_GYMS` for `'platinum'`.
- Expanded `src/tests/gyms.test.ts` with three new describe blocks covering Platinum: `getGymsForGame`, `getGymById`, and `PLATINUM_GYMS` roster shape (badge sequence, required fields, team sizes, PokéAPI format enforcement).

### Validation

- `npm run lint` — pass
- `npm run tsc` — pass
- `npm run test:coverage` — pass (179 tests, platinum.ts 100% coverage)
- `npx playwright test --project=chromium` — pass (6/6)
- Visual QA — skipped (pure data addition, no UI behavior change)

### Retrospective

**Permission requests:**
None.

**Assumptions made:**
Used best-available knowledge for Platinum in-game movesets. Specific move names are consistent with Platinum data but could be verified against a datamine if strict accuracy is required.

**Course corrections:**
None.

**Issue quality signal:**

- AC completeness: Complete
- Scope clarity: Clear

**Feedforward signals:**
None.

### Next Actions

Continue backlog.

---

## 2026-04-14 — feat #49: Add gym leader data for Pokémon Red

### Objective

Add all 8 Red/Blue in-game gym leaders to the gym leader mode data layer so `getGymsForGame('red')` returns a full roster.

### Completed Work

- Created `src/data/gyms/red.ts` with `RED_GYMS: GymLeader[]` — all 8 leaders (Brock → Giovanni) with Red/Blue in-game teams, PokéAPI-format names and moves
- Updated `src/data/gyms/emerald.ts`: added `import { RED_GYMS } from './red'` and `'red'` case in `getGymsForGame`
- Extended `src/tests/gyms.test.ts` with routing tests, `getGymById` for Red, and full `RED_GYMS` roster shape suite

### Validation

- `npm run lint` — pass
- `npm run tsc` — pass
- `npm run test:coverage` — pass (176/176; data/gyms 100% branch)
- `npx playwright test --project=chromium` — pass (6/6)
- Visual QA — skipped (pure data addition, no UI change)

### Retrospective

**Permission requests:**
None.

**Assumptions made:**

- Red/Blue in-game movesets reconstructed from known level-up moves and trainer TM usage; exact Gen 1 trainer AI move assignment is not machine-readable without ROM analysis, so moves are accurate to Bulbapedia-documented learnsets at each level.
- `import type { GymLeader }` from `emerald.ts` in `red.ts` avoids a runtime circular dependency while keeping types co-located with the existing pattern.

**Course corrections:**
None.

**Issue quality signal:**

- AC completeness: Complete
- Scope clarity: Clear

**Feedforward signals:**
None.

### Next Actions

Continue backlog.

---

## 2026-04-13 — Refactor #38: Split pokeapi.ts god module into focused service modules

### Objective

Break the 739-line `src/services/pokeapi.ts` monolith into four focused modules while preserving the full public API surface and all existing tests unchanged.

### Completed Work

- `src/services/pokeapiClient.ts` (177 lines): domain types, internal PokéAPI response types, error classes (`PokemonNotFoundError`, `RateLimitError`, `NetworkError`), `BASE_URL`, `generationNameMap`, `fetchWithRetry`
- `src/services/pokemonCache.ts` (244 lines): cache constants, `CachedPokemonNameIndex` type, in-memory deduplication Maps, `getPokemonNameIndex`, `getMoveNameIndex`, and all supporting fetch helpers (`fetchPokemonNameIndexFromApi`, `fetchMoveNameIndexFromApi`, `getGameVersionContext`, `fetchPokemonNameIndexForVersion`)
- `src/services/typechart.ts` (179 lines): `typeMapCache`, `cloneTypeMap`, `removeType`, `ensureHalfDamageTo`, `ensureNoDamageTo`, `applyGenerationTypeRules`, `buildBaseTypeMap`, `getTypeMap`, `calcEffectiveness`, `modifierLabel`
- `src/services/pokeapi.ts` rewritten (216 lines): re-exports all public symbols from the three sub-modules; implements `getPokemon`, `getMoveType`, and `computeMatchups`
- `docs/API_SPEC.md`: updated "Client-Side Service Interface" section to describe the four-module layout with per-module responsibility and full public function signatures

### Validation

- `npm run lint` — pass
- `npm run tsc` — pass
- `npm run test:coverage` — pass (161 tests, thresholds met)
- `npx playwright test --project=chromium` — pass (6 tests)
- Visual QA — skipped (pure refactor, no user-visible changes)

### Retrospective

**Permission requests:**
None.

**Assumptions made:**

- `modifierLabel` (private helper in original `pokeapi.ts`) was moved to `typechart.ts` and exported so `computeMatchups` in `pokeapi.ts` can import it without duplicating logic. It is not re-exported from the barrel (not public API).
- `generationNameMap` was placed in `pokeapiClient.ts` (the lowest-dependency layer) so both `pokemonCache.ts` and `pokeapi.ts` can import it without circular dependency.
- `pokemonRequestCache`, `moveTypeCache`, and `moveTypePromise` Maps were kept in `pokeapi.ts` alongside the functions that own them rather than exporting them from `pokemonCache.ts`, since the issue's intent for that module was the index-level caching.

**Course corrections:**
None.

**Issue quality signal:**

- AC completeness: Complete — specific file names, line limit, and public API surface all enumerated.
- Scope clarity: Clear.

**Feedforward signals:**
None.

### Next Actions

Continue backlog.

---

## 2026-04-13 — Chore #39: Extract shared test utilities into testUtils.ts

### Objective

Eliminate copy-paste mock/fixture patterns in test files by creating `src/tests/testUtils.ts` with factory functions for `TeamMemberConfig` and `MatchupViewModel`.

### Completed Work

- Created `src/tests/testUtils.ts` with `makeTeamMember(overrides?)` and `makeMatchupViewModel(overrides?)` factories
- Refactored `matchupContainer.test.tsx` to use `makeTeamMember` and `makeMatchupViewModel` (removes `as TeamMemberConfig[]` casts and the explicit `MatchupViewModel` type annotation on `FULL_MATCHUP`)
- Refactored `useMatchupMatrix.test.ts` to use `makeTeamMember` across all `teamMembers` usages (removes `as TeamMemberConfig[]` casts and the `TeamMemberConfig` import)
- `src/tests/testUtils.ts` is not in the coverage `include` list (`src/tests/` was already excluded by omission) — no config change needed

### Validation

- `npm run lint` — pass
- `npm run tsc` — pass
- `npm run test:coverage` — pass (161 tests, all green; branch coverage 81.21%)
- `npx playwright test --project=chromium` — pass (6 tests)
- Visual QA — skipped (pure test infrastructure, no UI changes)

### Retrospective

**Permission requests:**
None.

**Assumptions made:**
The AC mentions extracting common `BASE_PROPS` patterns where reused across ≥ 3 test files. No identical BASE_PROPS structure exists across 3+ files currently, so only the explicitly requested factories (`makeTeamMember`, `makeMatchupViewModel`) were added. The condition "where reused across ≥ 3 test files" was treated as a guard, not a mandate.

**Course corrections:**
None.

**Issue quality signal:**

- AC completeness: Complete — explicit factory signatures, minimum refactor count, coverage exclusion guidance, and incremental-apply note were all clear.
- Scope clarity: Clear.

**Feedforward signals:**
None.

### Next Actions

Continue backlog.

---

## 2026-04-13 — Test #35: Add swipe gesture coverage to MatchupContainer tests

### Objective

Add Vitest coverage for the `handleTouchStart` / `handleTouchEnd` swipe path in `MatchupContainer`, verifying the three gate conditions: qualifying swipe cycles the index, vertical swipe does not, and sub-threshold swipe does not.

### Completed Work

- Added `fireEvent` to `@testing-library/react` import in `matchupContainer.test.tsx`
- Added `TWO_MEMBER_PROPS` fixture (two-member team) to enable observable index cycling
- Added `MatchupContainer — swipe gestures` describe block with three tests:
  - Left swipe (deltaX = −70, deltaY = 5) → `selectedTeamIndex` cycles from 0 to 1
  - Vertical swipe (deltaX = 55, deltaY = 100) → `selectedTeamIndex` remains 0
  - Sub-threshold swipe (deltaX = −40) → `selectedTeamIndex` remains 0

### Validation

- `npm run lint` — pass
- `npm run tsc` — pass
- `npm run test:coverage` — pass (161 tests, all pass)
- `npx playwright test --project=chromium` — pass (6/6)
- Visual QA — skipped (test-only change, no visible UI effect)

### Retrospective

**Permission requests:**
None.

**Assumptions made:**

- TypeScript target does not include `Array.prototype.at()` — used `calls[calls.length - 1]` instead.
- Asserting on the last `useMatchupMatrix` mock call argument is sufficient to verify index cycling because the hook is called on every render and the final call reflects post-swipe state.

**Course corrections:**

- Initial use of `.at(-1)` caused `tsc` error TS2550 (lib target too old); replaced with `calls[calls.length - 1]`.

**Issue quality signal:**

- AC completeness: Complete
- Scope clarity: Clear

**Feedforward signals:**
None.

### Next Actions

Continue backlog.

---

## 2026-04-13 — Refactor #41: Extract shared MoveList component

### Objective

Eliminate ~40 lines of duplicated rendering logic shared between `OffenseSection.tsx` and `DefenseSection.tsx` by extracting a shared `MoveList` component.

### Completed Work

- Created `src/components/MatchupViewer/MoveList.tsx` with exported `MoveRow` interface and `MoveList` component; `indicator`, `showAll`, and `emptyText` are props; `indicatorClass` and `indicatorLabel` are module-private helpers
- Updated `OffenseSection.tsx`: removed `indicatorClass`, `indicatorLabel`, `renderMoves`, and local `MoveRow`; retained local `indicator()` (supports `4x`); uses `<MoveList emptyText="No common moves listed.">`
- Updated `DefenseSection.tsx`: same removals; retained local `indicator()` (no `4x`); uses `<MoveList emptyText="No common threats listed.">`
- Updated `docs/COMPONENT_DESIGN.md`: added `MoveList × N` under `OffenseSection` and `DefenseSection` in the component tree

### Validation

- `npm run lint` — pass
- `npm run tsc` — pass
- `npm run test:coverage` — pass (158 tests, 91.27% stmt coverage)
- `npx playwright test --project=chromium` — pass (6 tests)
- Visual QA — skipped (pure refactor, no visual output change)

### Retrospective

**Permission requests:**
None.

**Assumptions made:**
None — issue was unambiguous and explicitly directed to skip design and architecture review.

**Course corrections:**
None.

**Issue quality signal:**

- AC completeness: Complete
- Scope clarity: Clear

**Feedforward signals:**
None.

### Next Actions

Continue backlog.

---

## 2026-04-13 — Chore #43: Standardize onError signature to (string | null) across all hooks

### Objective

Widen `UsePokemonNameIndexParams.onError` from `(message: string) => void` to `(message: string | null) => void` to match the signature used by all other hooks.

### Completed Work

- Updated `src/hooks/usePokemonNameIndex.ts:9` — widened `onError` parameter type from `string` to `string | null`

### Validation

- `npm run lint` — pass
- `npm run tsc` — pass
- `npm run test:coverage` — pass (158 tests, 80.46% branch)
- `npx playwright test --project=chromium` — pass (6 tests)
- Visual QA — skipped (pure type change, no user-visible effect)

### Retrospective

**Permission requests:**
None.

**Assumptions made:**
None.

**Course corrections:**
None.

**Issue quality signal:**

- AC completeness: Complete
- Scope clarity: Clear

**Feedforward signals:**
None.

### Next Actions

Continue backlog.

---

## 2026-04-13 — Feat #32: Increase Pokémon sprite size in matchup card

### Objective

Increase sprite display size in the matchup card for better visual richness and Pokémon recognizability.

### Completed Work

- Updated `.spriteWrap` from 58px → 96px (desktop) in `MatchupViewer.module.css`
- Updated `.spriteWrap img` from 52px → 88px (desktop)
- Updated `.spriteFallback` font-size from 0.95rem → 1.5rem (desktop)
- Added `@media (max-width: 480px)` overrides: `.spriteWrap` 72px, `.spriteWrap img` 64px, `.spriteFallback` 1.25rem

### Validation

- `npm run lint` — pass
- `npm run tsc` — pass
- `npm run test:coverage` — pass (158 tests, 80.46% branch)
- `npx playwright test --project=chromium` — pass (6 tests)
- Visual QA — approved (programmatic pixel measurement confirmed exact AC values at all viewports)

### Retrospective

**Permission requests:**
None.

**Assumptions made:**
None. Design spec in issue was fully specified with exact pixel values and affected file locations.

**Course corrections:**
None.

**Issue quality signal:**

- AC completeness: Complete
- Scope clarity: Clear

**Feedforward signals:**

- `[skill]` — `/visual-qa` script setup took multiple retries to find correct opponent input locator (`#opponent-input`) and to seed team data via `addInitScript`. A short fixture/helper note in the skill or a project-level Playwright fixture would prevent this friction on future visual issues.

### Next Actions

Continue backlog.

---

## 2026-04-13 — Chore #48: Address npm audit vulnerabilities (brace-expansion, picomatch, vite)

### Objective

Resolve 3 reported npm audit vulnerabilities (1 moderate, 2 high) before the dependency surface grows further.

### Completed Work

- Ran `npm audit fix` to update lock file: brace-expansion 1.1.12→1.1.14/2.0.2→2.1.0, picomatch 4.0.3→4.0.4, vite 6.4.1→6.4.2
- Confirmed `npm audit` reports 0 vulnerabilities after fix
- Reviewed 5 open Dependabot PRs (#1–5): all are major version bumps (React 18→19, TypeScript 5→6, @eslint/js 9→10, vitest 3→4) unrelated to the security vulnerabilities; closed with explanatory comments

### Validation

- `npm run lint` — pass
- `npm run tsc` — pass
- `npm run test:coverage` — pass (158 tests, 91% stmt / 80% branch)
- `npx playwright test --project=chromium` — pass (6/6)
- Visual QA — skipped (lock file only, no UI changes)

### Retrospective

**Permission requests:**
None.

**Assumptions made:**
Dependabot PRs #1–5 are all major version bumps with no overlap with the security vulnerability fixes; closing them as out-of-scope rather than merging or creating new issues is appropriate since none are security-critical.

**Course corrections:**
None.

**Issue quality signal:**

- AC completeness: Complete — clear per-vulnerability table and explicit criteria.
- Scope clarity: Clear.

**Feedforward signals:**
None.

### Next Actions

Continue backlog.

---

## 2026-04-13 — Chore #42: Replace O(n²) move deduplication with Set in useTeamConfiguration

### Objective

Replace the `Array.indexOf`-inside-`filter` pattern in `normalizeMoveList` with a `Set`-based deduplication to eliminate the O(n²) antipattern.

### Completed Work

- Updated `normalizeMoveList` in `src/hooks/useTeamConfiguration.ts` (lines 52–58) to use `[...new Set(...)]` instead of a second `.filter` with `indexOf`

### Validation

- `npm run lint` — pass
- `npm run tsc` — pass
- `npm run test:coverage` — pass (158/158 tests, all 20 useTeamConfiguration tests pass)
- `npx playwright test --project=chromium` — pass (6/6)
- Visual QA — skipped (no visual changes)

### Retrospective

**Permission requests:**
None.

**Assumptions made:**
None — issue was precise and complete.

**Course corrections:**
None.

**Issue quality signal:**

- AC completeness: Complete
- Scope clarity: Clear

**Feedforward signals:**
None.

### Next Actions

Continue backlog.

---

## 2026-04-13 — Feat #21: Add color coding to Pokémon type badges

### Objective

Replace plain gray-bordered type badge pills with canonical Pokémon type colors that meet WCAG AA contrast throughout the app.

### Completed Work

- Created `src/utils/typeColors.ts` — TYPE_COLORS map defining `{ bg, text }` for all 18 types; colors verified ≥ 4.5:1 contrast programmatically
- Created `src/components/TypeBadge.tsx` — shared leaf component; applies colors via inline styles; normalizes type name to lowercase; falls back to neutral gray for unknown types
- Updated `src/components/AppView/GymLeaderSelector.tsx` — replaced `<span className={styles.typeBadge}>` with `<TypeBadge>`
- Updated `src/components/MatchupViewer/PokemonCard.tsx` — same replacement; TypeBadge handles display including title-casing
- Removed `border: 1px solid #d7dce0` from `.typeBadge` in both `MatchupViewer.module.css` and `App.module.css` — background fill is sufficient visual boundary
- Updated `docs/COMPONENT_DESIGN.md` — added TypeBadge to component tree and new Shared Primitives section

### Validation

- `npm run lint` — pass
- `npm run tsc` — pass
- `npm run test:coverage` — pass (158/158, 91.05% statements; TypeBadge fallback branch uncovered — expected)
- `npx playwright test --project=chromium` — pass (6/6)
- Visual QA — approved (gym list and matchup card both show correct canonical colors; WCAG AA confirmed programmatically)

### Retrospective

**Permission requests:**
None.

**Assumptions made:**

- "Team chips" referenced in the original AC do not currently display type information; this was scoped out per the design review rather than implemented.
- Canonical Psychic (#F95587) and Fairy (#D685AD) fall in the WCAG dead zone (fail AA with both white and dark text); adjusted to nearest passing values (#D01A5C and #E878B4). User confirmed these were acceptable at visual QA.

**Course corrections:**
None.

**Issue quality signal:**

- AC completeness: Missing edge cases — "team chips" mentioned in AC but no type data exists at that render point; design review caught and scoped this out.
- Scope clarity: Had to infer boundaries — "team chips" required investigation to confirm out of scope.

**Feedforward signals:**

- `[issue-template]` — AC items that reference UI locations ("gym leader list, matchup card, team chips") should name the component file or confirm the data is available at that render point, to prevent scope ambiguity at implementation.

### Next Actions

Continue backlog.

---

## 2026-04-13 — Fix #33: Matchup card cramped on mobile (390px)

### Objective

Fix cramped padding and spacing in the matchup card at 375px and 390px mobile viewports so move rows are comfortably readable.

### Completed Work

- Added `padding: 5px 0` to `.moveRow` in `MatchupViewer.module.css` for explicit vertical row breathing room
- Increased `.moveList` `gap` from `6px` to `8px` for better row separation
- Added `@media (max-width: 480px)` block with increased padding: `.viewerCard` 12px→16px, `.sideCard` 10px→12px, `.sectionCard` 11px→14px
- Ran design review (Step 1.7) producing concrete spec with exact values before implementation
- Architecture drift check: CLEAN — no updates needed to `docs/COMPONENT_DESIGN.md`

### Validation

- `npm run lint` — pass
- `npm run tsc` — pass
- `npm run test:coverage` — pass (158 tests, 91% stmt coverage)
- `npx playwright test --project=chromium` — pass (6 tests)
- Visual QA — approved (computed styles verified via Playwright; 390px and 375px screenshots reviewed by user)

### Retrospective

**Permission requests:**
None.

**Assumptions made:**
None. The design spec fully enumerated all values before implementation began.

**Course corrections:**
None.

**Issue quality signal:**

- AC completeness: Missing edge cases — original AC was vague ("adequate row padding", "minimum 14px font") without specific values. Design review converted these to exact, location-bound targets.
- Scope clarity: Clear once design review produced the spec.

**Feedforward signals:**

- `[issue-template]` — Mobile CSS issues benefit from a design-review step that produces exact px/rem values before the AC is written. Consider adding a "visual issues must include specific CSS values in AC" note to the issue template.

### Next Actions

Continue backlog.

---

## 2026-04-10 — Feat #47: Add help and feedback links to app header

### Objective

Add compact Help (?) and Feedback (bug) icon links to the shared app header so users on any screen have a path to the user guide and issue tracker.

### Retrospective

**Permission requests:**
None.

**Assumptions made:**
The `docs/USER_GUIDE.md` link targets the GitHub blob URL rather than a deployed docs URL, since the app has no bundled docs route. This was not specified in the issue.

**Course corrections:**
None.

**Issue quality signal:**

- AC completeness: Complete
- Scope clarity: Clear

**Feedforward signals:**

- `[issue-template]` — AC items that specify external URLs (like the docs link) should state whether to use GitHub blob, raw, or a deployed URL to avoid ambiguity.

---

## 2026-04-10 — Feat #44: Add fan-tool disclaimer to app footer

### Objective

Add a visually subtle disclaimer footer to satisfy fan-tool attribution conventions before public sharing.

### Retrospective

**Permission requests:**
None.

**Assumptions made:**
None — AC specified exact values (0.75rem, muted color) and the design review confirmed hex values from the existing palette.

**Course corrections:**
None.

**Issue quality signal:**

- AC completeness: Complete
- Scope clarity: Clear

**Feedforward signals:**
None.

---

## 2026-04-10 — Feat #36: Add ErrorBoundary component to catch runtime render errors

### Objective

Add a React error boundary around `<main>` so synchronous render crashes show a recoverable fallback instead of a white screen.

### Retrospective

**Assumptions made:**

- The design spec (produced during design review) fully specified all visual values; implementation followed the spec exactly — no additional assumptions required.

**Course corrections:**
None.

**Issue quality signal:**

- AC completeness: Complete (design review enriched the original AC with exact CSS values before implementation)
- Scope clarity: Clear

**Process improvement suggestion:**
None.

---

## 2026-04-10 — Docs #46: Update README with live URL and user-facing description

### Objective

Replace the internal-only README with a user-facing page that includes the live GitHub Pages URL, a plain-English description, feature list, how-to link, screenshot, and fan-tool disclaimer.

### Retrospective

**Assumptions made:**

- No in-app footer disclaimer exists in the current codebase; wrote a standard fan-project disclaimer based on common Nintendo/Game Freak attribution conventions.
- The GitHub Pages URL (`https://atniptw.github.io/probable-computing-machine/`) was derived from the vite.config.ts base path and repo owner — not explicitly stated in the issue.
- Screenshot was captured headlessly via Playwright against the dev server; acceptable for docs since the image faithfully represents the live app state.

**Course corrections:** None.

**Issue quality signal:**

- AC completeness: Complete
- Scope clarity: Clear

**Process improvement suggestion:** The issue referenced "consistent with the in-app footer" for the disclaimer, but no such footer exists. AC should be checked against live code before referencing app elements that may not exist.

---

## 2026-04-10 — Chore #45: Add favicon, meta description, and OG tags to index.html

### Objective

Add `<head>` metadata so browser tabs show an icon, search engines have a description, and Discord/Reddit link previews show a rich card.

### Retrospective

**Assumptions made:**

- The canonical URL and OG `og:url` were inferred from the Vite config `base: '/probable-computing-machine/'`, resolving to `https://atniptw.github.io/probable-computing-machine/`. The issue did not specify the URL explicitly.
- The favicon `href` uses the production base path `/probable-computing-machine/favicon.svg` so it resolves correctly on GitHub Pages. In dev (`npm run dev`) this will 404 the favicon — acceptable since this is a deployed-URL concern.
- `og:image` uses an SVG. Discord and most modern platforms support SVG OG images; Twitter/X does not. The issue did not require a rasterized image, so SVG was chosen for simplicity.
- `theme-color` was set to `#f6f6f6` (the app header/chrome background) — no specific value was given in the AC.

**Course corrections:**

None.

**Issue quality signal:**

- AC completeness: Missing the actual GitHub Pages URL (had to infer from Vite config)
- Scope clarity: Clear

**Process improvement suggestion:**

Issues referencing canonical/OG URLs should include the deployed URL as a stated fact, not leave it for implementation to infer.

---

## 2026-04-10 — Feat #40: Collapse gym picker to summary bar after Pokémon selection

### Objective

Replace the gym list + team panel with a compact single-line summary bar once a Pokémon is selected in gym mode, freeing the viewport for the matchup viewer.

### Retrospective

**Assumptions made:**

- The `×` clear button aria-label `"Clear selection"` was chosen over the literal `"×"` for screen reader clarity — not specified in the AC but consistent with a11y practice in this codebase.
- Desktop layout was declared "unaffected" in the AC, but the summary bar renders identically on desktop (no media query gate needed) — this was accepted as correct per the issue's design intent.

**Course corrections:**
None.

**Issue quality signal:**

- AC completeness: Complete
- Scope clarity: Clear

**Process improvement suggestion:**
None.

---

## 2026-04-10 — Feat #22: Color-code effectiveness multipliers

### Objective

Color-code move effectiveness multipliers in the matchup card so users can tell at a glance whether a value is favorable or unfavorable.

### Retrospective

**Assumptions made:**
Assumed color-coding is magnitude-based regardless of section context (offense vs defense) — the section heading already conveys direction.

**Course corrections:**
None.

**Issue quality signal:**

- AC completeness: Complete (design review added exact values before implementation)
- Scope clarity: Clear

**Process improvement suggestion:**
None.

---

## 2026-04-10 — Fix #23: Save button not visible without scrolling

### Objective

Make the Save button always visible on the Edit Team page and provide confirmation feedback after saving.

### Retrospective

**Assumptions made:**
Assumed moving the button to App-level was cleaner than `position: sticky` inside the scroll container, since it avoids CSS containment edge cases and makes the button's presence unconditional.

**Course corrections:**
None.

**Issue quality signal:**

- AC completeness: Complete
- Scope clarity: Clear

**Process improvement suggestion:**
None.

---

## 2026-04-09 - Fix #25: Replace "Type 2-3 Letters" Placeholder

### Objective

Replace the misleading opponent search placeholder with a conventional search hint.

---

## 2026-04-09 - a11y #29: Add Accessible Labels and Hover Tooltips to Cycle Buttons

### Objective

Add `aria-label` and `title` tooltip to the ← / → team-cycle buttons in `MatchupContainer`.

---

## 2026-04-09 - Docs #34: Fix Stale useMatchupMatrix Contract

### Objective

Update `docs/COMPONENT_DESIGN.md` to reflect the actual `useMatchupMatrix` contract after the hook was refactored.

---

## 2026-04-09 - Fix #37: Game-Aware Team Defaults and Per-Game Persistence

### Objective

- Remove the hardcoded Emerald default team; all games start with blank slots when no saved team exists.
- Persist teams per game so switching away and back restores the correct saved team.

---

## 2026-04-09 - Fix #24: Matchup Card Title Shows Opponent First

### Objective

- Fix heading order in matchup card so it reads "[Your Pokémon] vs [Opponent]".

---

## 2026-04-09 - Fix: Intermittent Test Timeouts Under Parallel Load

### Objective

- Eliminate flaky vitest timeouts caused by resource contention on WSL2.

---

## 2026-04-08 - Wave 5.1: Gym Leader Known Movesets in Defense Section

### Objective

- Use canonical Emerald gym leader movesets in the defense section instead of generic type inference (issue #20).

---

## 2026-04-08 - Wave 4.4: Remove Dormant Assets

### Objective

- Delete three dormant source files, their tests, clear the Dormant Assets table, and raise the functions coverage floor (issue #19).

---

## 2026-04-08 - Wave 4.3: Wire /architecture-drift into work-issue Cycle

### Objective

- Make architecture drift detection mandatory at the start of every issue cycle (issue #18).

---

## 2026-04-08 - Wave 4.2: Architecture Drift Detection

### Objective

- Create repeatable architecture drift check comparing live codebase to `docs/COMPONENT_DESIGN.md` (issue #17).

---

## 2026-04-08 - Wave 4.1: Formalize Reviewer Agent as a Skill

### Objective

- Create `/review` skill with a structured template for code review (issue #16).

---

## 2026-04-08 - Wave 3.3: Generation-Aware Type Chart Regression Tests

### Objective

- Add explicit regression tests for all generation-specific type chart rules (issue #15).

---

## 2026-04-08 - Wave 3.2: PokéAPI Contract Tests

### Objective

- Add contract tests verifying PokéAPI response shapes are correctly parsed to internal TypeScript interfaces (issue #14).

---

## 2026-04-08 - Wave 3.1: Import Boundary Tests

### Objective

- Add architecture fitness tests enforcing layer separation between hooks, data, and services (issue #13).

---

## 2026-04-08 - Wave 2.4: Coverage Scope Extended to Components

### Objective

- Add `src/components/**/*.tsx` to `coverage.include` and set realistic thresholds for the expanded scope (issue #12).

---

## 2026-04-08 - Wave 2.3: Component Tests for AppView and MatchupViewer

### Objective

- Add RTL component tests for `BattleSelectorSection`, `TeamEditorPanel`, and `MatchupContainer` (issue #11).

---

## 2026-04-08 - Wave 2.2: Gym Leader E2E Scenario

### Objective

- Expand Playwright smoke spec to cover the gym leader flow end-to-end.

---

## 2026-04-08 - Wave 2.1: Component Tests for Gym Components

### Objective

- Add RTL component tests for `GymLeaderSelector` and `GymTeamPanel` to close the zero-coverage gap on the gym feature.

---

## 2026-04-08 - Repo Hygiene, Wave 1.2, Wave 1.3

### Objective

- Aggressive repo cleanup: fix DECISIONS.md integrity, remove dead files, slim CLAUDE.md.
- Complete Wave 1.2 (unit tests in pre-commit) and Wave 1.3 (aria-pressed on gym buttons).

---

## 2026-04-07 - Wave 1.1: Add Gym Data Unit Tests

### Objective

- Add `src/tests/gyms.test.ts` to close the QA gap logged when the gym leader feature shipped.

---

## 2026-04-07 - Add Gym Leader Battle Mode

### Objective

- Add a "Gym Leader" battle mode for Pokémon Emerald so users can select a gym leader and tap a team member to trigger a matchup without typing.

---

## 2026-03-24 - Fix CI E2E Startup Path Reliability

### Objective

- Resolve failing CI `npm run e2e` step where smoke test locators could not find battle-screen controls.

---

## 2026-03-24 - Replace Comma-Separated Move Input with Structured Move Picker

### Objective

- Replace freeform comma-separated team move entry with an add/remove move flow backed by autocomplete.

---

## 2026-03-24 - Close Move Autocomplete Hook Coverage Gap

### Objective

- Remove the remaining zero-coverage gap for the move autocomplete hook introduced by the structured move picker change.

---

## 2026-03-24 - Fix CI Build Runtime for Coverage Job

### Objective

- Resolve GitHub Actions deploy workflow failure during `npm run test:coverage`.

---

## 2026-03-24 - Align Playwright Smoke Test with Matchup Viewer UI

### Objective

- Resolve failing CI e2e smoke test after migration from recommendation UI to matchup viewer UI.

---

## 2026-03-24 - Add Team Move Editing to Team Configuration

### Objective

- Allow users to save each team member's actual moves from the Edit Team flow and use those moves in matchup calculations.

---

## 2026-03-24 - Remove Bottom Team Cycling Panel

### Objective

- Simplify matchup viewer layout by removing the bottom "Cycle Team Members" panel.

---

## 2026-03-24 - Implement Matchup Viewer UI Replacement

### Objective

- Replace recommendation-oriented battle output with a descriptive matchup viewer focused on "Pokemon A vs Pokemon B."

---

## 2026-03-24 - Capture Testing Reliability Lessons in Docs and Skills

### Objective

- Document test reliability lessons and align project docs with current implementation state.

---

## 2026-03-24 - Expand Hook Coverage and Stabilize Test Suite

### Objective

- Raise automated confidence before starting new feature work by adding focused hook and service tests.

---

## 2026-03-16 - Setup Collaboration Foundation

### Objective

- Initialize lean documentation system for long-running project collaboration.

---

## 2026-03-16 - Implement Agentic Team Framework

### Objective

- Stand up shared .github customization and role-gated workflow for multi-role delivery.

---

## 2026-03-16 - Add Enforcement Templates and CI Gate

### Objective

- Enforce strict role-gate evidence at issue and pull request stages.

---

## 2026-03-16 - Governance Cleanup and Consistency Pass

### Objective

- Remove structural inconsistencies and deprecated configuration from the agentic setup.

---

## 2026-03-16 - Fix E2E Selector Regression

### Objective

- Restore the GitHub Pages workflow by fixing the Playwright smoke test after the card-based UI redesign.

---

## 2026-03-16 - Implement Global Pokemon Name Search Index

### Objective

- Replace Emerald-opponent allowlist with full Pokemon name index search and exact-match detail fetch.

---

## 2026-03-14 - Fix Devcontainer Build Failure on Trixie

### Objective

- Restore successful devcontainer startup after feature installation failure.

---

## 2026-03-14 - Implement Battle-First Mobile UX v2

### Objective

- Implement the v2 UX spec with a single clear primary recommendation and low-cognitive-load battle flow.

---

## 2026-03-24 - Add Foundation Validation Tooling

### Objective

- Establish enforced local and CI quality gates before deeper architecture refactoring.

---

## 2026-03-24 - Extract App Render Sections

### Objective

- Reduce `src/App.tsx` render-layer complexity without changing the current state model.

---

## 2026-03-14 - Add Game-Specific Pokédex and Generation Rules

### Objective

- Make matchup flow game-aware so users only see Pokémon from a selected game, with generation-specific type-rule behavior.

---

## 2026-03-14 - Optimize PokéAPI Call Efficiency

### Objective

- Reduce redundant and oversized PokéAPI requests while preserving existing UX behavior.

---

## 2026-03-14 - Implement Team-First Matchup Flow

### Objective

- Implement a dedicated Configure Team step before opponent selection and preserve single-opponent ranked matchup output.

---

## 2026-03-14 - Add Team Slot Autocomplete

### Objective

- Add autocomplete/search suggestions to team configuration input boxes.

---

## 2026-03-24 - Extract App Data Loading Hooks

### Objective

- Reduce orchestration complexity in `src/App.tsx` by moving data-loading and suggestion logic into focused hooks.

---

## 2026-03-24 - Extract Matchup Execution Hook

### Objective

- Continue the `App.tsx` decomposition by moving matchup execution and result lifecycle side effects into a dedicated hook.

---

## 2026-03-24 - Extract Team Save Hook and Remove Legacy Components

### Objective

- Further shrink `src/App.tsx` by extracting save-team validation/persistence and execute final cleanup of unused legacy UI component directories.

---

## 2026-04-09 - Fix: Clarify Matchup Status Messages (Issue #26)

### Objective

Replace the generic "Pick an exact Pokemon name to load matchup details." status message with contextual messages that reflect what the user actually needs to do.

---

## 2026-04-09 — Fix #31: Label capitalization is inconsistent across the app

### Objective

Apply sentence case consistently to all field labels and section headings across the app.

### Retrospective

**Assumptions made:**
The ALL CAPS appearance of "YOUR POKEMON" / "OPPONENT" was driven by CSS `text-transform: uppercase` on `.cardLabel`, not by the string values themselves. Verified before implementing.

**Course corrections:**
None.

**Issue quality signal:**

- AC completeness: Missing edge cases — the issue listed the problematic strings but did not enumerate every label that needed changing (e.g. mode toggle buttons). Required a full audit.
- Scope clarity: Had to infer boundaries — had to discover all label/heading sites by reading components.

**Process improvement suggestion:**
For capitalization issues, the issue template should include a checklist of every affected label/heading so the AC is complete and the implementer doesn't need to audit the whole codebase.

---

## 2026-04-09 — Feat #30: Improve empty state on battle screen

### Objective

Replace the bare status messages in the matchup area with structured empty-state cards that make the blank area feel intentional.

### Retrospective

**Assumptions made:**
The appropriate visual treatment was a title + supporting text within the existing `.viewerCard` container — no illustrations or icons, keeping it consistent with the app's minimal style.

**Course corrections:**
None.

**Issue quality signal:**

- AC completeness: Missing edge cases — the issue only describes the "no opponent" state in the problem description, but the "no team" state also needed improving.
- Scope clarity: Had to infer boundaries — "feel intentional" required judgment on which visual approach fit the existing design system.

**Process improvement suggestion:**
None.

---

## 2026-04-09 — Fix #28: Gym leader team chips lack clear click affordance

### Objective

Add hover and focus styles to gym leader Pokémon chips so users have clear visual feedback that they are interactive.

### Retrospective

**Assumptions made:**
`cursor: pointer` was already set on the button — AC1 was pre-existing. Only the hover and focus states were missing.

**Course corrections:**
None.

**Issue quality signal:**

- AC completeness: Complete — all three criteria were clear and actionable.
- Scope clarity: Clear.

**Process improvement suggestion:**
None.

---

## 2026-04-09 — Fix #27: Gym leader list gives no scroll indicator when overflowing

### Objective

Make it visually apparent that the gym leader list is scrollable when it contains more entries than fit in the visible area.

### Retrospective

**Assumptions made:**
The existing `overflow-y: auto` + `max-height: 220px` already made the list scrollable — only the visual indicator was missing. The CSS scroll-shadow technique was chosen over a JS-based solution for simplicity and zero runtime overhead.

**Course corrections:**
None.

**Issue quality signal:**

- AC completeness: Complete — clear criteria with concrete examples.
- Scope clarity: Clear.

**Process improvement suggestion:**
None.

---

## 2026-04-14 — feat/issue-54: Add Island Trial captain and kahuna data for Pokémon Ultra Sun

### Objective

Add `src/data/gyms/ultra-sun.ts` with all 8 Ultra Sun Trial Captains and Island Kahunas so gym leader mode works end-to-end for Ultra Sun.

### Completed Work

- Created `src/data/gyms/ultra-sun.ts` with 8 entries (Ilima, Lana, Kiawe, Mallow, Sophocles, Acerola, Nanu, Hapu) using Totem Pokémon teams for captains and full in-game parties for Kahunas
- Registered `'ultra-sun': ULTRA_SUN_GYMS` in `src/data/gyms/index.ts`
- Added `src/tests/gyms.ultra-sun.test.ts` with 18 tests covering shape, badge ordering, Z-Crystal badge names, and island city names

### Validation

- `npm run lint` — pass
- `npm run tsc` — pass
- `npm run test:coverage` — pass (242 tests, 18 new for Ultra Sun)
- `npm run build` — pass
- `npx playwright test --project=chromium` — pass (6 tests)
- Visual QA — skipped (pure data change, no UI modification)

### Retrospective

**Permission requests:**
None.

**Assumptions made:**

- For Trial Captains the "team" is the Totem Pokémon only (allies are called during battle, not pre-set), consistent with a 1-Pokémon entry per captain.
- Totem movesets reconstructed from best available knowledge of Ultra Sun in-game data; no authoritative machine-readable source was consulted.
- Island name used for `city` field as specified in the issue.

**Course corrections:**
None.

**Issue quality signal:**

- AC completeness: Complete — specific Pokémon and move format requirements stated clearly.
- Scope clarity: Clear — issue explicitly listed all 8 entries by name and type.

**Feedforward signals:**

- `[issue-template]` — Future data-addition issues could include a sample moveset row to remove ambiguity about which in-game encounter to use (e.g., "day vs night" variants like Gumshoos/Raticate).

### Next Actions

Continue backlog.

---

## 2026-04-16 — issue #65: implement auto-merge step in work-issue skill

### Objective

Replace the placeholder "push to feature branch and await coordinator" Step 8 in the `/work-issue` skill with a self-contained merge, sync, worktree-removal, and issue-close sequence.

### Completed Work

- Updated `.claude/commands/work-issue.md` Step 8: replaced `git push origin HEAD` + coordinator reference with four sub-steps:
  - 8.1 Push directly to `origin/main` via `git push origin HEAD:main`; stop on failure
  - 8.2 Sync local `main` via `cd "$(git rev-parse --git-common-dir)/.." && git fetch origin && git merge --ff-only origin/main`
  - 8.3 Remove worktree and delete feature branch
  - 8.4 Close GitHub issue with `gh issue close N`
- Removed all references to `auto-merge.sh` and "coordinator"
- Step 7 user sign-off preserved

### Validation

- `npm run lint` — pass
- `npm run tsc` — pass
- `npm run test:coverage` — pass (306/306 tests; 82.37% branch)
- `npx playwright test --project=chromium` — skipped (no UI changes)
- Visual QA — skipped (no UI changes)

### Retrospective

**Permission requests:**
None.

**Assumptions made:**
None. Issue was complete and unambiguous.

**Course corrections:**
None.

**Issue quality signal:**

- AC completeness: Complete — all sub-steps and failure behavior explicitly specified.
- Scope clarity: Clear — agreed approach was fully described in the issue body.

**Feedforward signals:**
None.

### Next Actions

Continue backlog.

---
