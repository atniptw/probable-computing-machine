# Architecture

## System Overview

Static single-page application. No server. All logic runs in the browser. Data fetched from PokéAPI v2 at runtime and cached locally.

```
User Browser
  └── React App (GitHub Pages)
        └── PokéAPI v2 (https://pokeapi.co/api/v2/)
              ├── /type/{id}        — type effectiveness data
              └── /pokemon/{name}   — Pokémon name + type assignments
```

## Tech Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| UI framework | React 18 | Component model fits team selector + results view |
| Build tool | Vite | Fast cold start, modern ESM output, small bundles |
| Styling | CSS Modules | Zero dependency, scoped styles |
| Data fetching | native `fetch()` | No library needed for simple REST calls |
| Caching | `localStorage` | Persist Pokémon data between sessions |
| Hosting | GitHub Pages | Free, auto-deploy via GitHub Actions |
| CI/CD | GitHub Actions | Build on push to `main`, publish `dist/` to `gh-pages` |

## Deployment Flow

```
Push to main
  → GitHub Actions: npm ci → npm run build → publish dist/ to gh-pages
  → App live at https://atniptw.github.io/probable-computing-machine/
```

## Caching Strategy

| Data | Cache location | TTL |
|------|---------------|-----|
| All type effectiveness | In-memory (module-level) | Session lifetime |
| Pokémon (name → types) | `localStorage` | 7 days |

Type data is fetched once on app startup. Pokémon data is fetched on first lookup and persisted.

## Performance Targets

- First matchup result: < 2 seconds (fresh load, no cache)
- Subsequent results: < 500ms (cache hit)
- Lighthouse performance score: ≥ 85

## Error Handling

| Error | Behavior |
|-------|----------|
| Invalid Pokémon name | Inline error on the input field |
| PokéAPI 404 | Show "Pokémon not found" next to the slot |
| PokéAPI 429 rate limit | Show retry banner; retry after 1s |
| Network offline | Show offline notice; disable submit |

## Security Considerations

- Zero user data collected or stored on a server.
- `localStorage` stores only Pokémon name → type mappings (non-sensitive).
- No authentication surface.
- PokéAPI is a public read-only API with no auth token required.
