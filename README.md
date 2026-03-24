# probable-computing-machine

Foundational project workspace for a new web app.

## Quick Start

```bash
npm install       # install dependencies (auto-runs on devcontainer open)
npm run dev       # start dev server → open http://localhost:5173
```

Port 5173 is automatically forwarded when opened in a devcontainer — VS Code will show an "Open in Browser" notification.

## Current Status

- Stage: MVP battle UX implemented with game-specific Pokédex filtering
- Product: Pokémon type matchup advisor (static web app)
- Stack: React 18 + Vite, hosted on GitHub Pages
- Collaboration cadence: continuous flow with explicit role handoffs

## Collaboration Workflow

1. Use PM intake to define acceptance criteria before implementation.
2. Require architecture and contract validation before coding.
3. Route implementation through Backend/Frontend with test evidence.
4. Require QA, DevOps, and Docs gates before release closure.

## Core Docs

- [PROJECT.md](PROJECT.md): project scope, success criteria, and questionnaire answers
- [SESSIONS.md](SESSIONS.md): append-only session log and handoffs
- [DECISIONS.md](DECISIONS.md): decision log with rationale
- [.github/copilot-instructions.md](.github/copilot-instructions.md): shared team operating instructions

## Agentic Team System

- [.github/copilot-instructions.md](.github/copilot-instructions.md): shared always-on team rules
- [.github/AGENTS.md](.github/AGENTS.md): role ownership and handoff protocol
- [.github/instructions/](.github/instructions/): role-specific constraints and gate rules
- [.github/prompts/](.github/prompts/): repeatable PM/architecture/QA/release workflows
- [.github/skills/README.md](.github/skills/README.md): reusable multi-step skills catalog

## Next Immediate Actions

1. Add focused tests for `src/components/AppView/*` to cover rendering contracts and error/empty states.
2. Continue reducing orchestration complexity in `src/App.tsx` where extraction improves clarity.
3. Evaluate mobile UX refinements for quick team edits during rapid battle lookups.

## Testing Reliability Notes

- Avoid inline arrays/objects/functions in hook test callbacks when they are effect dependencies. Unstable references can create rerender loops and hanging suites.
- For async effect collaborators, mocks must always return promises. Returning `undefined` can produce unhandled errors that do not always fail individual assertions.
- Treat unhandled Vitest errors as gate failures even if all assertions pass.

## Validation Commands

```bash
npm run check          # typecheck + production build (pre-flight sanity check)
npm run lint
npm run format:check
npm run tsc
npm run test:coverage
npm run build
npm run e2e
```
