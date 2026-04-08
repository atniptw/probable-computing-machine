# Team Operating Instructions

This file defines shared, always-on behavior for Claude in this repository.

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

---

## Agent Coordination

### Active Roles

PM, Architect, Backend, Frontend, QA, DevOps, Docs

### Responsibility Matrix

| Role      | Responsibility                                                                               |
| --------- | -------------------------------------------------------------------------------------------- |
| PM        | Defines outcome, scope boundaries, and acceptance criteria. Resolves product trade-offs.     |
| Architect | Owns service boundaries and technical decisions. Approves architecture and contract changes. |
| Backend   | Implements APIs, domain logic, and persistence changes.                                      |
| Frontend  | Implements user-facing flows and accessibility.                                              |
| QA        | Validates acceptance criteria and regression safety.                                         |
| DevOps    | Ensures deployment safety, observability, and rollback readiness.                            |
| Docs      | Updates user/developer docs and release notes.                                               |

### Standard Handoff Sequence

1. PM: feature intake and acceptance criteria.
2. Architect: design and contract approval.
3. Backend and Frontend: implementation.
4. QA: validation and sign-off.
5. DevOps: release readiness and deployment checks.
6. Docs: publication and documentation closure.

### Escalation Rules

- Product ambiguity: PM decides.
- Technical architecture conflicts: Architect decides.
- Release risk conflicts: DevOps and QA can block until resolved.
- Any unresolved cross-role conflict: PM final call, then log in `DECISIONS.md`.

### Workflows

Use commands in `.claude/commands/` for repeatable workflows:

- `/feature-intake` — turn a request into a feature brief with acceptance criteria
- `/architecture-review` — review architecture and contracts before implementation
- `/release-readiness` — evaluate release readiness and rollback safety
- `/qa-signoff` — generate QA validation and release sign-off results

---

## Role Instructions

### PM

**Mission:** Translate product goals into clear, testable work with unambiguous acceptance criteria.

**Required Outputs:**

- Problem statement.
- User value statement.
- Acceptance criteria in checklist form.
- Out-of-scope list.

**Gate Rules:**

- No implementation starts without acceptance criteria.
- Ambiguity must be resolved before handoff.

---

### Architect

**Mission:** Ensure technical coherence, maintainability, and safe evolution of system boundaries.

**Required Outputs:**

- Architecture notes for any structural change.
- API/data contract definitions.
- Risks and mitigation notes.

**Gate Rules:**

- No implementation without approved contract.
- Breaking changes require explicit migration or compatibility plan.

---

### Backend

**Mission:** Deliver reliable, testable server-side functionality aligned with approved contracts.

**Required Outputs:**

- Implementation scoped to approved architecture.
- Unit and integration tests for changed behavior.
- Notes on failure modes and edge cases.

**Gate Rules:**

- Must pass tests for modified behavior.
- Must document contract changes before merge.

---

### Frontend

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

### QA

**Mission:** Verify expected behavior and prevent regressions through focused validation.

**Required Outputs:**

- Acceptance test checklist results.
- Regression risk assessment.
- Explicit pass/fail release recommendation.

**Gate Rules:**

- Release is blocked on unresolved critical defects.
- No sign-off without traceability to acceptance criteria.

---

### DevOps

**Mission:** Ensure reliable delivery with safe deployments, observability, and recovery plans.

**Required Outputs:**

- Deployment checklist.
- Monitoring and alerting readiness notes.
- Rollback steps for risky changes.

**Gate Rules:**

- No production release without rollback path.
- No release without minimum observability in place.

---

### Docs

**Mission:** Keep product and technical docs aligned with shipped behavior.

**Required Outputs:**

- Updated usage or architecture docs.
- Release note summary for meaningful changes.
- Links to related decisions.

**Gate Rules:**

- Work is not complete when docs are stale.
- Major behavior changes require release note updates.

---

## Security Guidelines (OWASP)

Apply a security-first mindset to all code generated, reviewed, or refactored.

- **Access Control:** Deny by default. Enforce least privilege. Validate URLs for SSRF with allow-lists. Prevent path traversal.
- **Cryptography:** Use Argon2/bcrypt for passwords. Always use HTTPS. Never hardcode secrets — read from environment variables or a secrets manager.
- **Injection:** Use parameterized queries for all database access. Use context-aware output encoding for frontend (prefer `.textContent` over `.innerHTML`; use DOMPurify when HTML is required).
- **Configuration:** Disable verbose errors in production. Set security headers (CSP, HSTS, X-Content-Type-Options). Keep dependencies updated and run `npm audit`.
- **Authentication:** Regenerate session IDs on login. Use `HttpOnly`, `Secure`, and `SameSite=Strict` on cookies. Implement rate limiting on auth flows.
- **Transparency:** When mitigating a security risk, state what you are protecting against.

---

## Playwright Test Guidelines

### Code Quality

- **Locators:** Use role-based locators (`getByRole`, `getByLabel`, `getByText`). Use `test.step()` to group interactions.
- **Assertions:** Use auto-retrying web-first assertions (`await expect(locator).toHaveText()`). Avoid `toBeVisible()` unless testing visibility changes specifically.
- **Timeouts:** Rely on Playwright's built-in auto-waiting. No hard-coded waits.

### Test Structure

- Imports: `import { test, expect } from '@playwright/test';`
- Group related tests under `test.describe()`.
- Use `beforeEach` for shared setup (e.g., page navigation).
- Naming: `Feature - Specific action or scenario`

### File Organization

- Store test files in `e2e/` (this project's convention).
- Naming: `<feature-or-page>.spec.ts`
- One file per major feature or page.

### Assertion Best Practices

- `toMatchAriaSnapshot` — verify accessibility tree structure.
- `toHaveCount` — assert element counts.
- `toHaveText` / `toContainText` — text matching.
- `toHaveURL` — navigation verification.

### Execution

1. Run: `npx playwright test --project=chromium`
2. Debug failures and identify root causes before retrying.
3. Ensure tests pass consistently before marking done.

---

## Documentation Update Rules

Update documentation in the same commit as code changes. Never commit code changes without updating relevant docs.

**Always update when:**

- New features or capabilities are added → update README.md Features section.
- APIs, interfaces, or contracts change → update `docs/` accordingly.
- Breaking changes occur → document what changed, provide before/after examples.
- Configuration or environment variables change → update examples and README.md.
- Code examples in docs become outdated → fix them.

**Quality standards:**

- Use clear, concise language with working code examples.
- Keep docs close to code when possible.
- Review documentation accuracy in code reviews.

---

## Autonomous Loop Sequence

When working on a feature autonomously from intake to shipped, follow this sequence without waiting for human check-ins at each step:

1. **Feature Intake** — Run `/feature-intake`. Do not begin implementation until acceptance criteria exist.
2. **Architecture Review (conditional)** — Run `/architecture-review` if the change touches new hooks/services, data contracts (PokéAPI shapes, localStorage keys), new component boundaries, or cross-role dependencies. Skip for isolated bug fixes or doc-only changes.
3. **Implementation** — Implement in role order: Backend/Frontend → QA (tests) → Docs. Apply gate rules from the Role Instructions section at each phase.
4. **Verification** — Before review, all of the following must pass locally:
   ```
   npm run lint
   npm run tsc
   npm run test
   ```
   For changes touching UI behavior, also run `npx playwright test --project=chromium`.
   Do not proceed to review if any check fails.
5. **Update Logs** — Append a session entry to `SESSIONS.md`. If a trade-off was made, append a `DEC-XXXX` entry to `DECISIONS.md` (use the next sequential ID).
6. **Code Review** — Launch a `general-purpose` agent as a reviewer. Provide it with the full diff (`git diff HEAD~1`) and ask it to: identify bugs or logic errors, flag any broken acceptance criteria, check for security issues, and report anything that must be fixed before shipping. Resolve all blocking issues the reviewer raises, then re-run verification.
7. **User Sign-off** — Present the reviewer's verdict and the running app to the user for final sign-off before pushing.
8. **Push** — `git push origin main`. Every commit that lands on main must be functional.

---

## Task Tracking Within a Session

For features spanning more than two implementation steps, use TaskCreate to track progress:

- Create a task at session start summarizing the feature goal.
- Update to `in_progress` when beginning each major phase.
- Update to `completed` when the change is pushed and CI is green.
- Remove stale tasks at session end.

Skip task tracking for single-step bug fixes or doc-only changes.
