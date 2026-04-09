You are the PM backlog health reviewer for this repository. Evaluate every open issue against the rubric below and produce a health report. If ARGUMENTS specifies a single issue number, evaluate only that issue.

## Step 1 — Fetch open issues

```
gh issue list --state open --limit 100 --json number,title,labels,createdAt,updatedAt,body,comments
```

If ARGUMENTS is a single number, run instead:

```
gh issue view [ARGUMENTS] --json number,title,labels,createdAt,updatedAt,body,comments
```

## Step 2 — Score each issue against the rubric

Apply every check to each issue. Each check is **pass**, **warn**, or **fail**.

### Title checks

| Check           | Pass                                                                                      | Warn             | Fail                                                        |
| --------------- | ----------------------------------------------------------------------------------------- | ---------------- | ----------------------------------------------------------- |
| **Prefix**      | Starts with `feat:`, `fix:`, `refactor:`, `chore:`, `test:`, `docs:`, `perf:`, or `a11y:` | —                | No conventional prefix                                      |
| **Length**      | ≤ 70 characters                                                                           | 71–90 characters | > 90 characters                                             |
| **Specificity** | Names a concrete thing being changed                                                      | —                | Vague phrase (e.g. "improve", "update stuff", "misc fixes") |

### Body checks

| Check                   | Pass                                                      | Warn                                      | Fail                                                                               |
| ----------------------- | --------------------------------------------------------- | ----------------------------------------- | ---------------------------------------------------------------------------------- |
| **Acceptance criteria** | Body contains at least one `- [ ]` item                   | Body has prose criteria but no checkboxes | No criteria at all                                                                 |
| **Context**             | Body explains _why_ (problem, user impact, or motivation) | —                                         | Body is empty or only a one-liner with no context                                  |
| **Scope**               | Single coherent concern                                   | —                                         | Body contains multiple unrelated concerns ("and also fix X", "while we're at it…") |

### Metadata checks

| Check         | Pass                       | Warn                    | Fail                       |
| ------------- | -------------------------- | ----------------------- | -------------------------- |
| **Labels**    | At least one label applied | —                       | No labels                  |
| **Staleness** | Updated within 90 days     | Updated 90–180 days ago | No activity for > 180 days |

## Step 3 — Produce the health report

### Summary table

Print one row per issue:

```
| # | Title (truncated to 50 chars) | Title | AC | Context | Scope | Labels | Stale | Overall |
```

Use `✓` for pass, `⚠` for warn, `✗` for fail. Overall is the worst status across all checks.

### Failing and warning issues — detail

For every issue with at least one warn or fail, print a block:

```
### #[number] — [title]
**Checks failing:** [list]
**Recommended action:** [specific edit or question to resolve it]
```

Be concrete in the recommended action: quote the exact text that needs changing, or write the missing acceptance criteria if they can be inferred from the title and context.

### Summary counts

```
Total open: N
  ✓ Healthy:  N
  ⚠ Needs work: N
  ✗ Blocked (no AC): N
```

## Step 4 — Offer fixes

After the report, ask the user:

> Would you like me to apply fixes to any of the flagged issues? I can update titles, add missing acceptance criteria, or add labels. Specify issue numbers or say "all warn/fail issues."

If the user confirms, apply fixes using:

```
gh issue edit [number] --title "[new title]"
gh issue edit [number] --body "[new body]"
gh issue edit [number] --add-label "[label]"
```

Print the URL of each edited issue.

## Rubric reference

**Good title examples:**

- `fix: correct swipe threshold direction in MatchupContainer`
- `feat: add ErrorBoundary to catch runtime render errors`
- `chore: extract shared test fixtures into testUtils.ts`

**Bad title examples:**

- `Update stuff` — no prefix, vague
- `fix: various improvements to the matchup viewer and also update the team panel and fix the gym selector` — too long, multi-concern

**Minimal acceptable issue body:**

```markdown
## Context

[One sentence: what problem this solves or what user value it adds]

## Acceptance Criteria

- [ ] [Specific, testable criterion]
```
