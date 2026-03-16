# Agent Coordination Guide

## Active Roles

- PM
- Architect
- Backend
- Frontend
- QA
- DevOps
- Docs

## Responsibility Matrix

### PM

- Defines outcome, scope boundaries, and acceptance criteria.
- Resolves product trade-offs.

### Architect

- Owns service boundaries and technical decisions.
- Approves architecture and contract changes.

### Backend

- Implements APIs, domain logic, and persistence changes.

### Frontend

- Implements user-facing flows and accessibility.

### QA

- Validates acceptance criteria and regression safety.

### DevOps

- Ensures deployment safety, observability, and rollback readiness.

### Docs

- Updates user/developer docs and release notes.

## Standard Handoff Sequence

1. PM: feature intake and acceptance criteria.
2. Architect: design and contract approval.
3. Backend and Frontend: implementation.
4. QA: validation and sign-off.
5. DevOps: release readiness and deployment checks.
6. Docs: publication and documentation closure.

## Escalation Rules

- Product ambiguity: PM decides.
- Technical architecture conflicts: Architect decides.
- Release risk conflicts: DevOps and QA can block until resolved.
- Any unresolved cross-role conflict: PM final call, then log in `DECISIONS.md`.

## Instructions, Prompts, and Skills Usage

- Use role instructions in `.github/instructions/` for role-specific constraints.
- Use prompts in `.github/prompts/` for repeatable workflows.
- Use skills in `.github/skills/` for reusable multi-step checks.
