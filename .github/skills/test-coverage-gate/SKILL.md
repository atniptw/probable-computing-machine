---
name: test-coverage-gate
description: 'Use when validating test evidence and minimum coverage before merge.'
---

# Test Coverage Gate

## Use When

- Backend or frontend behavior changes are ready for review.
- QA needs quick evidence that tests are meaningful.

## Workflow

1. List changed components or modules.
2. Map tests to changed behavior.
3. Run full test suite and coverage command for the repository.
4. Check for missing edge-case coverage.
5. Verify there are no unhandled test-run errors.
6. Issue gate decision.

## Minimum Evidence

- Command output for unit/integration test execution.
- Command output for coverage execution.
- Coverage threshold status for the configured gate files.
- Confirmation that unhandled errors are absent.

## Output Format

- Behavior-to-test mapping.
- Coverage gaps.
- Risk notes.
- Decision: pass, conditional, or fail.

## Decision Rules

- `pass`: thresholds met, behavior mapped, no unhandled errors.
- `conditional`: thresholds met but targeted behavior has meaningful gaps.
- `fail`: threshold miss, unhandled errors, or missing core behavior coverage.
