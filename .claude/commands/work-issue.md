Work the GitHub issue identified by ARGUMENTS from intake through push. Execute every step in order. Do not skip or reorder steps. State which step you are on before beginning it.

## Step 1 — Read the issue

```
gh issue view [ARGUMENTS]
```

Summarize: title, acceptance criteria, notes. If no acceptance criteria exist, produce a feature intake brief inline before continuing:

1. Problem statement.
2. Target user.
3. User value.
4. In scope.
5. Out of scope.
6. Acceptance criteria checklist.
7. Risks and dependencies.
8. Suggested handoff owner.

Post the brief and wait for explicit user approval before proceeding.

## Step 1.2 — Mark issue in progress

```
gh issue edit [ARGUMENTS] --add-label "in progress"
```

If the label does not exist, create it first:

```
gh label create "in progress" --color "0075ca" --description "Actively being worked"
```

## Step 1.7 — Design review (visual issues only)

Run `/design-review [ARGUMENTS]` if the issue touches visible UI layout, color, typography, spacing, or interactive states. The command will audit all affected locations, produce a concrete design spec with exact values, and update the issue before implementation begins.

Skip for: pure logic, data, or test changes; a11y attribute-only fixes; refactors with no visual output change; docs-only changes. State explicitly which applies and why you are skipping or not.

Do not begin Step 3 (Implementation) for a qualifying visual issue until the Design Spec is appended to the issue.

## Step 1.5 — Architecture drift check

Run `/architecture-drift`. If the verdict is `DRIFT DETECTED`, resolve all findings (update `docs/COMPONENT_DESIGN.md` to match the live codebase) and commit the fix before proceeding to Step 2. Do not carry pre-existing drift into the implementation.

## Step 2 — Architecture review (conditional)

Run `/architecture-review` if the change touches any of: new hooks or services, PokéAPI data contracts, localStorage keys, new component boundaries, or cross-role dependencies.

Skip for isolated bug fixes, a11y fixes, test additions, and doc-only changes. State explicitly which applies and why you are skipping or not.

## Step 3 — Implementation

Implement in role order: Backend/Frontend → QA (tests) → Docs. Apply gate rules from `/role-guide` at each phase. Include `Closes #N` in each commit message body that closes the issue.

## Step 4 — Verification

Run all of the following. Do not proceed to Step 5 if any fails.

```
npm run verify
```

This runs lint, format:check, tsc, test:coverage, build, and playwright e2e.

## Step 4.5 — Visual QA review (UI changes only)

If the change affects any visible UI behavior:

1. Start the dev server:

```
npm run dev
```

2. Run `/visual-qa [issue number]` to pre-screen visual acceptance criteria via screenshots. The command will:
   - Automatically verify what it can (colors, layout, text, element presence)
   - Flag items that need your judgment or can't be checked programmatically
   - Present a focused brief of what still needs your eyes

3. Wait for explicit user confirmation (**Approved** or **Blocked**) before proceeding to Step 5.

Skip this step only for changes with no user-visible effect (pure logic, data, or test changes).

## Step 5 — Update logs

Append a session entry to `SESSIONS.md` using this structure:

```
## [date] — [issue prefix + number]: [short title]

### Objective
[One sentence: what was being solved]

### Completed Work
[Bullet list of actual changes made]

### Validation
- `npm run lint` — pass | fail
- `npm run tsc` — pass | fail
- `npm run test:coverage` — pass | fail (note branch %)
- `npx playwright test --project=chromium` — pass | fail
- Visual QA — approved | blocked | skipped (reason)

### Retrospective

**Permission requests:**
List every action you paused and asked the user to explicitly approve before
proceeding (e.g. "Asked before pushing to main", "Asked before deleting branch X").
These reveal where trust boundaries currently sit — recurring requests are
candidates for explicit instructions or auto-approved defaults.
If none: "None."

**Assumptions made:**
List anything the implementation had to assume that was not stated in the issue
(e.g. "assumed no min-length guard existed and skipped inline helper text").
If the issue was complete and unambiguous: "None."

**Course corrections:**
List any moment where the user had to redirect, clarify scope, or undo a wrong
choice. Quote or paraphrase the correction so patterns are visible over time.
If none: "None."

**Issue quality signal:**
- AC completeness: Complete | Missing edge cases | Too vague
- Scope clarity: Clear | Had to infer boundaries | Ambiguous

**Feedforward signals:**
Tag each gap or pattern found so it can be batched into the right improvement:
- `[instruction]` — a rule to add or update in CLAUDE.md or role-guide
- `[skill]` — a command or skill that should be created or updated
- `[tooling]` — wrong script, missing step, or broken default in the workflow
- `[issue-template]` — the issue template or AC format needs updating
If none: "None."

### Next Actions
[What comes next, or "Continue backlog."]
```

If a trade-off was made, add a `DEC-XXXX` entry to the top of `DECISIONS.md` using max existing ID + 1. Verify the ID is unique.

## Step 6 — Code review

Run `/review` passing the full diff since `origin/main`:

```
git diff origin/main..HEAD
```

Resolve all blocking findings and re-run Step 4 before proceeding.

## Step 7 — User sign-off

Present to the user:

- Reviewer verdict
- Acceptance criteria pass/fail status
- Any open risks or minor findings

Wait for explicit user approval before proceeding to Step 8.

## Step 8 — Merge, sync, and clean up

After explicit user approval in Step 7, perform the full merge and clean-up from the feature worktree.

### 8.1 — Push to main

```
git push origin HEAD:main
```

If this fails (remote has diverged / not fast-forward), **stop immediately** and surface the error to the user. Do not proceed with the remaining sub-steps.

### 8.2 — Sync the local main branch

Resolve the main worktree root (works correctly from any worktree) and fast-forward the local `main` branch:

```bash
cd "$(git rev-parse --git-common-dir)/.."
git fetch origin && git merge --ff-only origin/main
```

### 8.3 — Remove the worktree and feature branch

From the main worktree root, replace `feat/issue-N` with the actual branch name:

```bash
git worktree remove ../feat/issue-N
git branch -D feat/issue-N
```

> **Note:** GitHub auto-closes issues when a commit containing `Closes #N` is pushed to main. Do not run `gh issue close` manually — it is redundant and contradicts CLAUDE.md policy.
