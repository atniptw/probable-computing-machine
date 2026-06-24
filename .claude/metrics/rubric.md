# Scoring Rubric — v1 (frozen 2026-06-24)

> This file defines a **fixed bar**. Do not edit it casually. When the bar genuinely needs
> to change, bump the version, add a dated changelog entry at the bottom, and note it in the
> next session log — so a shift in the metrics can be attributed to a deliberate rubric
> change rather than to a change in the agent's capability.

## Difficulty band (set by the reviewer)

Judge the _task as specified_, not how it actually went (a poorly-handled S is still an S).

- **S** — single-file or single-concern change; obvious approach; no contract/boundary
  impact. (typo fix, copy change, one-line config, adding a missing test assertion)
- **M** — multi-file but bounded; one new function/hook/component; established pattern to
  follow; some judgment but no architectural decisions. (most feature slices, a new service
  function with tests)
- **L** — crosses boundaries or introduces them; new contract, new architecture decision,
  data migration, or several interacting strands; meaningful ambiguity to resolve.

## Autonomy: classifying each intervention

Every intervention is exactly one of:

### Correction (counts as burden)

The **user** stepped in _unprompted_ to redirect, undo, or rescope my work. Source: the
Step 5 "Course corrections" list. One redirect = one count.

### Handoff — I stopped and asked. Classify each as avoidable or necessary:

**Avoidable (counts as burden)** — the answer was derivable from any of:

- the repository itself (code, tests, existing data),
- `CLAUDE.md`, `role-guide`, or another skill,
- an established convention in the codebase,
- a sane, low-regret default I could have taken and noted,
- a `memory/` entry or prior session log.

**Necessary (NOT penalized)** — the question genuinely needed the user because **all** hold:

- it changed the outcome materially,
- there was no defensible default (the choices were truly divergent / hard to reverse),
- it could not be answered from the sources listed under "avoidable."

This is exactly the `AskUserQuestion` bar. A necessary question at the right moment is
**good** autonomy, not a failure.

> Tie-breaker: if a handoff is genuinely borderline, count it **necessary**. We do not want
> to train the agent to stop asking — only to stop asking _needlessly_.

### Wrong call (counts as burden)

I decided something **without** asking and it turned out wrong — caught by the user, by
review, or by tests. Cross-check the Step 5 "Assumptions made" list: an assumption that
later proved wrong is a wrong call. A correct assumption is not.

### Permission prompts are NOT handoffs

Pausing for an approval that _policy_ requires (e.g. push to main, delete a branch) is not
an autonomy failure — it's the trust boundary working as designed. Those live in
`approval-log.md`, not here. Only count a handoff when I asked because I _didn't know what
to do_, not because I needed _permission to do it_.

## Quality fields

- `review_rounds` — number of times `/review` returned blocking findings that sent the work
  back. A clean first review = `0`.
- `verify_first_try` — `yes` only if the **first** Step-4 `npm run verify` passed with no
  fixes needed afterward. Any green-after-fix = `no`.

---

## Changelog

- **v1 (2026-06-24)** — initial rubric.
