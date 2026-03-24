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
│   │   │   ├── BattleResultsPanel.tsx
│   │   │   ├── BattleSelectorSection.tsx
│   │   │   ├── GameVersionSelect.tsx
│   │   │   ├── SuggestionList.tsx
│   │   │   ├── TeamConfigurationSection.tsx
│   │   │   └── TeamEditorPanel.tsx
│   │   ├── TeamInput/
│   │   │   ├── TeamInput.jsx
│   │   │   ├── TeamSlots.jsx
│   │   │   ├── PokemonSlot.jsx
│   │   │   └── SubmitButton.jsx
│   │   └── MatchupResults/
│   │       ├── MatchupResults.jsx
│   │       ├── MatchupGrid.jsx
│   │       ├── MatchupCell.jsx
│   │       └── SummaryBar.jsx
│   ├── data/
│   │   └── games.ts
│   ├── services/
│   │   ├── pokeapi.ts
│   │   └── ranking.ts
│   └── tests/
│       ├── calcEffectiveness.test.ts
│       ├── games.test.ts
│       ├── getPokemon.test.ts
│       ├── getPokemonNameIndex.test.ts
│       └── ranking.test.ts
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

export default defineConfig({
  plugins: [react()],
  base: '/probable-computing-machine/',
})
```

The `base` path must match the repository name for GitHub Pages to serve assets correctly.

## GitHub Actions Deploy Workflow

```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: write
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      - run: npm ci
      - run: npm run build
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

## GitHub Pages One-Time Setup

1. Go to repository **Settings → Pages**.
2. Set **Source** to "Deploy from a branch".
3. Set **Branch** to `gh-pages`, folder `/ (root)`.
4. Save.
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

## Git Hooks

`npm install` runs the `prepare` script to register Husky hooks. The current pre-commit hook runs `lint-staged` so changed TypeScript, CSS, JSON, YAML, and Markdown files are formatted before commit, and staged TypeScript files are linted automatically.
