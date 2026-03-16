---
name: test-coverage-gate
description: "Use when validating test evidence and minimum coverage before merge."
---

# Test Coverage Gate

## Use When

- Backend or frontend behavior changes are ready for review.
- QA needs quick evidence that tests are meaningful.

## Workflow

1. List changed components or modules.
2. Map tests to changed behavior.
3. Check for missing edge-case coverage.
4. Issue gate decision.

## Output Format

- Behavior-to-test mapping.
- Coverage gaps.
- Risk notes.
- Decision: pass, conditional, or fail.
