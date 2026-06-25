Drive autonomous, dependency-ordered execution of a set of GitHub issues — the "let me loose" driver. This skill is **user-initiated** (invoking it is your consent to start); it then runs without per-issue approval, pausing only at the genuine stop conditions below.

ARGUMENTS: optional. A wave label (e.g. `wave-a`), a space-separated list of issue numbers, or empty (defaults to all open `v2` issues, in wave order).

## Autonomy model (Tier 1)

- **Reviewer-agent gate replaces human sign-off** for non-visual issues. An issue may be pushed to `main` once the Step 6 reviewer gives a **clean** sign-off and Step 4 `npm run verify` passes. Do **not** wait for human approval on these.
- **Visual issues always stop for human visual QA** (see stop conditions). Tier 1 never auto-merges a user-visible UI change.
- Everything is reversible (`git revert`) and gated by `verify` + reviewer — that is what makes unattended push safe.

## Step 1 — Build the ordered plan

1. Resolve the issue set from ARGUMENTS (default: `gh issue list --state open --label v2 --json number,title,labels`).
2. Order by **wave**: `wave-a` → `wave-b` → `wave-c` → `wave-d` → `wave-e`. A wave starts only after the previous wave is fully merged (later waves import earlier waves' code).
3. **Intra-wave dependencies:** if an issue is a keystone the rest of its wave imports (for the V2 backlog this is **#91 / A1 — the type changes**), run it **alone and merge it first**, then run the wave's remaining issues in parallel.
4. Post the plan (ordered list, which run solo vs parallel) before starting.

## Step 2 — Execute each issue

For a **solo** issue: run the `/work-issue N` pipeline inline.

For a **parallel** set within a wave: dispatch one sub-agent per issue with `isolation: "worktree"`, following the parallel-dispatch contract in `/work-issue` Step 3 and CLAUDE.md:

- Each sub-agent runs `/work-issue N`, uses `git -C` / `npm --prefix` / absolute paths (no `cd && cmd`), runs `npm run verify:unit` before committing, and **must** write its SESSIONS retro (Step 5) and scorecard inputs — those durable artifacts are the only record of a sub-agent's work.
- The integrator (this driver) merges branches in dependency order via `auto-merge.sh`, runs the single full `npm run verify` on merged state, and owns all pushes.

Apply the Tier 1 gate: reviewer clean + verify green → merge/push. After landing, **confirm CI is green** (`issue-finish.sh` does this via `ci-check.sh`; otherwise run `bash .claude/ci-check.sh`) — local verify is not the CI gate. Only then score the issue (Step 9). If CI fails, fix forward before continuing the wave. Batch per-issue scorecards (commit them once at the end of the wave) so each issue's CI run isn't cancelled by an immediate metrics push.

## Step 3 — Stop conditions (hand back to the human)

Stop and report — do **not** push past these:

1. **A visual issue is reached** (touches user-visible UI — the whole of wave D). Complete implementation up to Step 4, then pause: tell the user to run `/visual-qa N` and sign off. Do not auto-merge.
2. **A genuine product/ambiguity decision** with no defensible default (a "necessary handoff" per `.claude/metrics/rubric.md`). Ask, don't guess.
3. **Reviewer returns BLOCK** you cannot clear after **two** fix attempts.
4. **`npm run verify` fails** after two fix attempts.
5. **A merge conflict in any file other than `SESSIONS.md`** (SESSIONS conflicts auto-resolve).

Otherwise, keep going — the goal is to see how far the run gets. Fix-and-retry technical problems within the attempt budget rather than stopping.

## Step 4 — Report continuously and at the end

- After each issue lands: post one line — `✓ #N merged — <summary> [scored: difficulty, autonomy_burden]`.
- On any stop: post `⏸ #N — <which stop condition> — <what you need from me>`.
- At the end (set exhausted or a hard stop): regenerate `python3 .claude/metrics/render-report.py`, then post a run summary — issues merged, issues stopped (and why), and the headline trend from `REPORT.md`.

## Notes

- This is the observability contract: the user learns what happened from `SESSIONS.md`, `REPORT.md`, `DECISIONS.md`, and git history — so be thorough in those, especially in sub-agents whose live transcript the user never sees.
- Known risk to watch on the first run: the `PostToolUse`/`Stop` hooks in `settings.json` `cd` into the **main** repo, so edits made inside a worktree may be linted/tested against main, not the worktree. If hook output looks wrong during a parallel run, flag it.
