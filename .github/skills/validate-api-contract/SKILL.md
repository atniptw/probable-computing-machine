---
name: validate-api-contract
description: "Use when checking an API change for contract clarity, compatibility, and implementation readiness."
---

# Validate API Contract

## Use When

- A new endpoint or payload is introduced.
- Existing API behavior changes.
- Backend and frontend need contract alignment before coding.

## Workflow

1. List endpoints, methods, request, response, and error formats.
2. Confirm compatibility with existing clients.
3. Identify breaking changes and migration plan.
4. Return approval decision with required fixes.

## Output Format

- Contract summary.
- Compatibility notes.
- Breaking changes.
- Required actions.
- Final decision: approve, approve-with-conditions, or reject.
