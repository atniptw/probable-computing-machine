# Development Guide

## Prerequisites

- Node.js 18+ — https://nodejs.org
- npm 9+ (bundled with Node)
- Git

## First-Time Project Setup

```bash
# From the repository root
npm install
```

## Daily Development

```bash
npm run dev
# App runs at http://localhost:5173 with hot reload
```

## Build

```bash
npm run build
# Outputs static files to dist/

npm run preview
# Serves dist/ locally at http://localhost:4173
```

## Project Structure

```
probable-computing-machine/
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── App.module.css
│   ├── components/
│   │   ├── AppView/
│   │   │   ├── BattleSelectorSection.tsx
│   │   │   ├── GameVersionSelect.tsx
│   │   │   ├── GymLeaderSelector.tsx
│   │   │   ├── GymTeamPanel.tsx
│   │   │   ├── SuggestionList.tsx
│   │   │   ├── TeamConfigurationSection.tsx
│   │   │   └── TeamEditorPanel.tsx
│   │   └── MatchupViewer/
│   │       ├── DefenseSection.tsx
│   │       ├── MatchupContainer.tsx
│   │       ├── MatchupViewer.module.css
│   │       ├── OffenseSection.tsx
│   │       └── PokemonCard.tsx
│   ├── data/
│   │   ├── games.ts
│   │   └── gyms/
│   │       └── emerald.ts
│   ├── hooks/
│   │   ├── useMatchupMatrix.ts
│   │   ├── useMoveNameIndex.ts
│   │   ├── usePokemonNameIndex.ts
│   │   ├── usePokemonSuggestions.ts
│   │   └── useTeamConfiguration.ts
│   ├── services/
│   │   ├── pokeapi.ts
│   │   └── ranking.ts
│   └── tests/
│       ├── battleSelectorSection.test.tsx
│       ├── calcEffectiveness.test.ts
│       ├── games.test.ts
│       ├── generationTypeRules.test.ts
│       ├── getMoveNameIndex.test.ts
│       ├── getPokemon.test.ts
│       ├── getPokemonNameIndex.test.ts
│       ├── gymComponents.test.tsx
│       ├── gyms.test.ts
│       ├── importBoundaries.test.ts
│       ├── matchupContainer.test.tsx
│       ├── pokeapi.contract.test.ts
│       ├── pokeapi.errors.test.ts
│       ├── ranking.test.ts
│       ├── teamEditorPanel.test.tsx
│       ├── useMatchupMatrix.test.ts
│       ├── usePokemonNameIndex.test.ts
│       ├── usePokemonSuggestions.test.ts
│       └── useTeamConfiguration.test.ts
├── src/utils/
│   └── format.ts
├── public/
├── docs/
├── .github/
│   └── workflows/
│       ├── deploy.yml
│       └── gate-evidence.yml
├── vite.config.ts
├── eslint.config.js
├── .prettierrc.json
└── package.json
```

## Vite Config (Required for GitHub Pages)

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === 'serve' ? '/' : '/probable-computing-machine/',
}))
```

Local dev uses `/` so `http://localhost:5173` works directly. Production builds still use the repository base path for GitHub Pages.

## GitHub Actions Deploy Workflow

```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npm run format:check
      - run: npm run tsc
      - run: npm run test:coverage
      - run: npm run build
      - run: npx playwright install --with-deps chromium
      - run: npm run e2e
      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v3
        with:
          path: ./dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/deploy-pages@v4
```

## GitHub Pages One-Time Setup

1. Go to repository **Settings → Pages**.
2. Set **Source** to **GitHub Actions**.
3. Confirm workflow permissions allow Pages deployment.
4. Push to `main` (or run workflow manually).
5. App will be live at: `https://atniptw.github.io/probable-computing-machine/`

## No Environment Variables Required

PokéAPI is a public API with no API key.

## Tests

Unit tests run with Vitest and coverage is part of the expected validation flow. End-to-end tests run with Playwright.

```bash
npm run lint
npm run format:check
npm run tsc
npm run test
npm run test:coverage
npm run e2e
```

Coverage thresholds are enforced in `vite.config.ts` for `src/data`, `src/services`, `src/hooks`, and `src/components` files:

- statements: 75
- branches: 80
- functions: 70
- lines: 75

### Hook Test Pitfalls

- Keep hook input props stable in `renderHook` callbacks. If an effect depends on a prop array/object/function and the test recreates it every render, it can cause infinite rerender loops.
- Ensure async mocks used by `useEffect` paths return promises consistently.
- Consider a run failed when Vitest reports unhandled errors, even when test assertions pass.

## Troubleshooting: App Not Reachable Locally

If the app starts but is not reachable from your browser:

1. Run `npm run dev` and confirm the script includes `--host` in `package.json`.
2. Confirm the devcontainer forwards port `5173` (and `4173` for preview).
3. Confirm `vite.config.ts` uses `base: '/'` for `serve` and repository base only for production builds.
4. Open `http://localhost:5173` directly after the server reports it is ready.

## Git Hooks

`npm install` runs the `prepare` script to register Husky hooks. The current pre-commit hook runs `lint-staged` so changed TypeScript, CSS, JSON, YAML, and Markdown files are formatted before commit, and staged TypeScript files are linted automatically.
