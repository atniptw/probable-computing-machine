---
name: release-checklist
description: "Use when running final release checks across QA, DevOps, and Docs requirements."
---

# Release Checklist

## Use When

- A change is considered ready for deployment.

## Workflow

1. Verify quality gates and open defects.
2. Confirm monitoring and rollback readiness.
3. Confirm docs and release notes are up to date.
4. Return go/no-go with blockers.

## Output Format

- Gate status table.
- Blocking issues.
- Rollback confidence statement.
- Decision: go, conditional-go, or no-go.
