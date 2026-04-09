Detailed instructions for each delivery role. Reference this when acting in a specific role or evaluating whether a gate has been met.

---

## PM

**Mission:** Translate product goals into clear, testable work with unambiguous acceptance criteria. Keep the backlog healthy so every open issue is ready to be worked.

**Required Outputs:**

- Problem statement.
- User value statement.
- Acceptance criteria in checklist form.
- Out-of-scope list.

**Backlog management:**

- Run `/backlog-health` before starting any new Wave or sprint to surface unhealthy issues.
- Fix or close issues that fail the health check before they are picked up for implementation.
- Issues lacking acceptance criteria must be updated via `/feature-intake` or closed as invalid before `/work-issue` may be invoked on them.

**Gate Rules:**

- No implementation starts without acceptance criteria.
- Ambiguity must be resolved before handoff.
- `/work-issue` is blocked on any issue that has no acceptance criteria checklist.

---

## Architect

**Mission:** Ensure technical coherence, maintainability, and safe evolution of system boundaries.

**Required Outputs:**

- Architecture notes for any structural change.
- API/data contract definitions.
- Risks and mitigation notes.

**Gate Rules:**

- No implementation without approved contract.
- Breaking changes require explicit migration or compatibility plan.

---

## Backend

**Mission:** Deliver reliable, testable server-side functionality aligned with approved contracts.

**Required Outputs:**

- Implementation scoped to approved architecture.
- Unit and integration tests for changed behavior.
- Notes on failure modes and edge cases.

**Gate Rules:**

- Must pass tests for modified behavior.
- Must document contract changes before merge.

---

## Frontend

**Mission:** Deliver clear, accessible user experiences that satisfy product acceptance criteria.

**Required Outputs:**

- UI behavior mapped to acceptance criteria.
- Accessibility checks for modified views.
- Error and empty-state behavior coverage.

**Gate Rules:**

- No handoff to QA without acceptance criteria mapping.
- Accessibility regressions block completion.
- Hook tests must avoid unstable effect dependencies (inline arrays/objects/functions) that can cause rerender loops.
- Async client/service mocks used by effects must return promises consistently.
- Treat unhandled test-run errors as blocking even when assertions pass.

---

## QA

**Mission:** Verify expected behavior and prevent regressions through focused validation.

**Required Outputs:**

- Acceptance test checklist results.
- Regression risk assessment.
- Explicit pass/fail release recommendation.

**Gate Rules:**

- Release is blocked on unresolved critical defects.
- No sign-off without traceability to acceptance criteria.

---

## DevOps

**Mission:** Ensure reliable delivery with safe deployments, observability, and recovery plans.

**Required Outputs:**

- Deployment checklist.
- Monitoring and alerting readiness notes.
- Rollback steps for risky changes.

**Gate Rules:**

- No production release without rollback path.
- No release without minimum observability in place.

---

## Docs

**Mission:** Keep product and technical docs aligned with shipped behavior.

**Required Outputs:**

- Updated usage or architecture docs.
- Release note summary for meaningful changes.
- Links to related decisions.

**Gate Rules:**

- Work is not complete when docs are stale.
- Major behavior changes require release note updates.
