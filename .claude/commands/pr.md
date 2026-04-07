You are acting as Docs and DevOps for PR creation. Your goal is a PR that passes gate-evidence CI on the first attempt.

## Pre-flight (fix before proceeding if any fail)

1. `npm run lint` — zero warnings
2. `npm run tsc` — zero errors
3. `npm run test` — all pass
4. `SESSIONS.md` — session entry exists for this work
5. `DECISIONS.md` — new DEC-XXXX entry exists if a trade-off was made, OR prepare "no new decision" text

## Find the DEC reference

Check `DECISIONS.md` for the highest current DEC-XXXX ID. Reference it, or write "no new decision — [rationale]" in the Decision Log section.

## Create the PR using this exact body

Fill every section. Do not remove or rename any header.

```
## Summary

- [1–3 bullets: what changed and why]

## Acceptance Criteria

- [Link to acceptance criteria source: issue, session entry, or feature brief]
- [Each criterion and its pass/fail status]

## Decision Log

- [DEC-XXXX reference OR "no new decision — [brief rationale]"]

## QA Evidence

- Tests run: npm run lint, npm run tsc, npm run test
- Results: [pass counts or summary]
- Risks: [known gaps or deferred coverage]

## Docs Impact

- [Files updated, or "no docs impact — [reason]"]

## Release and Rollback

- Deployment impact: [what changes in the deployed GitHub Pages build]
- Rollback plan: Revert the merge commit on main; GitHub Actions redeploys the previous build automatically.

## Required Checks

- [x] I linked acceptance criteria.
- [x] I linked decision evidence or justified none.
- [x] I provided QA evidence.
- [x] I described docs impact.
- [x] I documented rollback considerations.
```

Run:
```
gh pr create --title "[imperative title, under 60 chars]" --body "$(cat <<'EOF'
[filled body above]
EOF
)"
```

## After PR creation

1. Confirm the PR URL returned without error.
2. Wait for Gate Evidence Check to complete. If it fails, read the workflow log, fix the body with `gh pr edit [number] --body "..."`, and re-check.
3. Update `SESSIONS.md` with the PR URL.
