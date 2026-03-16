# Decisions Log

Use this file for lightweight ADR-style entries.

## Decision Template

### ID

DEC-XXXX

### Date

YYYY-MM-DD

### Context

- 

### Decision

- 

### Consequences

- Positive:
- Trade-offs:

### Owner

- 

---

## DEC-0001

### Date

2026-03-16

### Context

- Project is starting from a near-empty repository.
- Long-running collaboration needs persistent context to avoid repetition and drift.

### Decision

- Adopt a lean documentation system with four core files: `README.md`, `PROJECT.md`, `SESSIONS.md`, `.instructions.md`.
- Use hybrid session cadence with weekly reset summaries.

### Consequences

- Positive: low overhead with strong continuity.
- Trade-offs: requires disciplined updates every session.

### Owner

- Team

---

## DEC-0002

### Date

2026-03-16

### Context

- Product Owner selected all roles active from week one.
- Team requires strict blocking quality gates and shared agent standards.
- Long-running collaboration needs deterministic handoffs and reusable workflows.

### Decision

- Adopt a role-based agentic operating model across PM, Architect, Backend, Frontend, QA, DevOps, and Docs.
- Use shared customization under `.github/` for team instructions, prompts, and skills.
- Enforce strict gate policy: no merge or release when required artifacts are missing.

### Consequences

- Positive: clear ownership, consistent outputs, and higher release safety.
- Trade-offs: more process overhead and stricter handoff discipline required.

### Owner

- Product Owner + Team

---

## DEC-0003

### Date

2026-03-16

### Context

- Strict role gates were defined but not yet enforced in repository workflows.
- Team needs deterministic checks that prevent incomplete handoffs.

### Decision

- Add pull request template requiring acceptance, decision, QA, docs, and rollback evidence.
- Add feature intake issue template for PM-quality upstream inputs.
- Add CI workflow to block pull requests when required gate markers are missing.

### Consequences

- Positive: higher consistency and reduced chance of bypassing critical gates.
- Trade-offs: more PR authoring overhead and stricter workflow compliance required.

### Owner

- Product Owner + Team

---

## DEC-0004

### Date

2026-03-16

### Context

- Governance docs contained contradictions across cadence and instruction ownership.
- Prompt files were using deprecated frontmatter.
- Root `.instructions.md` had become a compatibility pointer and duplicated policy intent.

### Decision

- Standardize on continuous-flow governance.
- Migrate prompt frontmatter from `mode` to `agent`.
- Remove universal role `applyTo` declarations to avoid role-collision in context.
- Delete root `.instructions.md` and keep canonical operating policy under `.github/`.

### Consequences

- Positive: cleaner instruction model, fewer conflicts, and valid prompt schema.
- Trade-offs: relies on `.github/` structure as the single governance source.

### Owner

- Product Owner + Team
