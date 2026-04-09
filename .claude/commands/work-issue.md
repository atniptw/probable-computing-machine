Work the GitHub issue identified by ARGUMENTS from intake through push. Execute every step in order. Do not skip or reorder steps. State which step you are on before beginning it.

## Step 1 — Read the issue

```
gh issue view [ARGUMENTS]
```

Summarize: title, acceptance criteria, notes. If no acceptance criteria exist, stop and run `/feature-intake` before continuing.

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
npm run lint
npm run tsc
npm run test
npx playwright test --project=chromium
```

## Step 4.5 — Visual QA review (UI changes only)

If the change affects any visible UI behavior:

1. Start the dev server:

```
npm run dev -- --host 127.0.0.1 --port 4173
```

2. Run `/visual-qa [issue number]` to pre-screen visual acceptance criteria via screenshots. The command will:
   - Automatically verify what it can (colors, layout, text, element presence)
   - Flag items that need your judgment or can't be checked programmatically
   - Present a focused brief of what still needs your eyes

3. Wait for explicit user confirmation (**Approved** or **Blocked**) before proceeding to Step 5.

Skip this step only for changes with no user-visible effect (pure logic, data, or test changes).

## Step 5 — Update logs

Append a session entry to `SESSIONS.md` covering: objective, decisions made, completed work with validation evidence, blockers, next actions.

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

## Step 8 — Push

```
git push origin main
```
