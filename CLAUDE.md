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
- Decision entry in `DECISIONS.md` when trade-offs were made. New entries go at the **top** of the file using the next sequential ID (max existing ID + 1). Verify the ID is unique before committing.
- Validation evidence (tests, QA notes, or release checks).
- When a commit closes a GitHub issue, include `Closes #N` in the commit message body. GitHub auto-closes the issue on push to main — do not also close it manually with `gh issue close`.

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
- No untracked files in `src/` or doc root (`*.md`, `*.ts`, `*.tsx`).
- When delivery model changes (e.g. PR workflow → direct push), remove CI workflows and templates that enforce the old model in the same commit.
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
- `/review` — structured code review: bugs, contract violations, a11y, security, verdict
- `/release-readiness` — evaluate release readiness and rollback safety
- `/qa-signoff` — generate QA validation and release sign-off results

---

## Role Instructions

Detailed mission, required outputs, and gate rules for each role: `/role-guide`

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

Use role-based locators (`getByRole`, `getByLabel`), web-first assertions (`await expect(locator).toHaveText()`), and no hard-coded waits. Store specs in `e2e/`, one file per feature, named `<feature>.spec.ts`. Run: `npx playwright test --project=chromium`.

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

## Autonomous Loop

To work an issue from intake to push, invoke `/work-issue [number]`. Do not begin implementation on any issue without first invoking this skill.

---

## Task Tracking Within a Session

For features spanning more than two implementation steps, use TaskCreate to track progress:

- Create a task at session start summarizing the feature goal.
- Update to `in_progress` when beginning each major phase.
- Update to `completed` when the change is pushed and CI is green.
- Remove stale tasks at session end.

Skip task tracking for single-step bug fixes or doc-only changes.
