# Agent Performance Metrics

A closed loop for telling whether the coding agent is **getting better** — especially at
working **autonomously** — instead of guessing.

```
agent works an issue
   └─ Step 5 retro (prose, auditable)  ─┐
   └─ Step 6 review (quality verdict)  ─┤→ Step 9 scorecard (one structured row) → ledger.jsonl
                                         │
   render-report.py  ───────────────────┴→ REPORT.md  (trend you actually read)
                                              └─ notes column → /retro distillation → feedforward
```

## Why a structured ledger when Step 5 already has a retro?

The Step 5 retro is **prose** — great for one issue, useless for spotting a trend across
40 issues. The scorecard extracts the quantitative signals into one append-only row per
issue so the report can show movement over time. The prose retro stays the source of
truth; the scorecard's counts must **trace back to it** (that's the honesty guard).

## The core idea: improvement is a trend _within a difficulty band_

Raw averages lie — a hard UI issue always needs more review rounds than a one-line chore.
So every row is tagged `S` / `M` / `L`, and "getting better" is read **per band**:
last-10 vs prior-10.

Two trend lines per band:

- **Quality** — `review_rounds` (↓), `verify_first_try` (↑), `fixups_after_push` (↓)
- **Autonomy burden** — `corrections + avoidable_handoffs + wrong_calls` (↓)

**Getting better at autonomy = the autonomy-burden line drops while the quality line holds
or improves.** That coupling is deliberate: I can't lower interventions by recklessly
guessing, because wrong guesses raise `wrong_calls`. And asking a genuinely necessary
question is _not_ penalized — `necessary_handoffs` is tracked but never counted as burden.

## Row schema (`ledger.jsonl`, one JSON object per line)

| field                | type         | meaning                                                                   |
| -------------------- | ------------ | ------------------------------------------------------------------------- |
| `ts`                 | ISO-8601 UTC | when the row was written                                                  |
| `issue`              | int          | GitHub issue number                                                       |
| `difficulty`         | `S`/`M`/`L`  | normalizer — set by the reviewer per `rubric.md`                          |
| `review_rounds`      | int ≥0       | reviewer send-backs before clean sign-off                                 |
| `verify_first_try`   | bool         | `npm run verify` green on the first Step-4 run                            |
| `corrections`        | int ≥0       | times the **user** redirected me unprompted (Step 5 "Course corrections") |
| `avoidable_handoffs` | int ≥0       | questions/blocks I raised that were derivable myself (per `rubric.md`)    |
| `necessary_handoffs` | int ≥0       | questions I raised that genuinely needed the user — **not** penalized     |
| `wrong_calls`        | int ≥0       | decisions I made without asking that turned out wrong                     |
| `commit`             | str          | sign-off commit SHA on main (lets the report derive `fixups_after_push`)  |
| `notes`              | str          | what went wrong / what to distill — feeds `/retro`                        |

`fixups_after_push` is **not stored** — `render-report.py` derives it live by counting
later commits that reference `#<issue>`, so the ledger stays append-only and the count
never goes stale.

## Honesty guards (read this before trusting the numbers)

1. **The reviewer scores, the implementer doesn't grade its own homework.** Step 6 (`/review`)
   sets `difficulty`, `review_rounds`, and applies the avoidable-vs-necessary rubric.
2. **The rubric is frozen and versioned** (`rubric.md`). If the bar moves, that's a dated,
   deliberate event — so a metric shift reads as "capability changed," not "goalposts moved."
3. **Counts must trace to the Step 5 prose retro**, which you can audit. The scorecard is a
   summary of that retro, not a separate unverifiable claim.
4. **Known conflict of interest:** autonomy counts (`corrections`, `avoidable_handoffs`,
   `wrong_calls`) need full-session context that only the implementer has. The reviewer
   sanity-checks them against the prose retro, but the real backstop is the human
   spot-checking rows against transcripts periodically. Treat single rows as soft and
   **trust the trend, not the point.**

## Usage

```bash
# Append a row (Step 9 of work-issue; values come from Steps 5 + 6)
python3 .claude/metrics/score-issue.py \
  --issue 91 --difficulty M --review-rounds 1 --verify-first-try yes \
  --corrections 0 --avoidable-handoffs 0 --necessary-handoffs 1 --wrong-calls 0 \
  --commit "$(git rev-parse HEAD)" \
  --notes "Clean run; one necessary question on gym level sourcing."

# Regenerate the human-readable trend report
python3 .claude/metrics/render-report.py
```
