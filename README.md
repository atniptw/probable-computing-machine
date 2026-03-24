# probable-computing-machine

Foundational project workspace for a new web app.

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

1. Add hook-focused unit tests for `useTeamConfiguration` and `useMatchupResults` failure/reset paths.
2. Continue shrinking `src/App.tsx` by extracting remaining screen-navigation orchestration when it improves clarity.
3. Evaluate mobile UX refinements for quick team edits during rapid battle lookups.

## Validation Commands

```bash
npm run lint
npm run format:check
npm run tsc
npm run test:coverage
npm run build
npm run e2e
```
