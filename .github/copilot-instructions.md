# Team Operating Instructions

This file defines shared, always-on behavior for agents in this repository.

## Team Model

- Product Owner is the source of priority and acceptance criteria.
- Work flows through role gates: PM -> Architect -> Backend/Frontend -> QA -> DevOps -> Docs.
- No role may bypass its upstream gate.

## Delivery Model

- Use continuous flow with explicit ownership at every handoff.
- Keep work small and traceable to a single acceptance target.
- Block merges when gate evidence is missing.

## Required Artifacts Per Meaningful Change

- Session update in `SESSIONS.md`.
- Decision entry in `DECISIONS.md` when trade-offs were made.
- Validation evidence (tests, QA notes, or release checks).

## Role Handoff Contract

Every handoff must include:

1. Expected output artifact.
2. Verification performed.
3. Known risks and open questions.
4. Named next owner.

## Hard Stops

- Do not merge without acceptance criteria.
- Do not release without rollback plan.
- Do not close work when docs are stale.
- Do not leave blocker ownership undefined.

## Definition of Done

- Acceptance criteria met.
- Role gate validations complete.
- Docs and logs updated.
- Next owner acknowledged or work marked complete.
