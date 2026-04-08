# Project Charter

## Project Summary

- Type: static web app hosted on GitHub Pages
- Mission: help Pokémon players understand type matchups when playing newer generations they haven't mastered yet.
- Documentation style: lean

## Goals

- Ship an MVP where a player can input their team and an opponent's team and immediately see which matchups are strong, weak, or neutral.
- Make the tool fast enough to use mid-battle.
- Keep the UI simple enough that no explanation is needed to use it.

## Non-Goals

- User accounts or saved teams.
- Mobile app or browser extension.
- Competitive tier ratings or team builder recommendations.
- Support for fan-made or ROM hack Pokémon games.

## Target User

- Primary user: casual Pokémon player experiencing a new generation for the first time.
- Core job to be done: quickly figure out which of my Pokémon can beat which of the opponent's during a battle.
- Primary pain point: not knowing type effectiveness charts for newer generations by memory.

## Success Criteria

- User can input two teams of up to 6 Pokémon each and see matchup results.
- Matchup accuracy matches PokéAPI type effectiveness data exactly.
- Results render within 2 seconds on first load; under 500ms on subsequent queries.
- App is accessible at the GitHub Pages URL with no server required.
- All major architecture and product choices are logged in `DECISIONS.md`.

## Constraints

- Data source: PokéAPI v2 (https://pokeapi.co/docs/v2) — free, CORS-enabled, ~100 req/min rate limit.
- Hosting: GitHub Pages (static files only, no server-side logic).
- Stack: React 18 + Vite, no backend.
- Time constraints: no hard deadline.
- Budget: zero — all tooling and hosting must be free tier.

## Out of Scope (Initial Phase)

- User accounts, authentication, or saved teams.
- Mobile app, PWA, or browser extension.
- Team recommendations or competitive tier lists.
- Custom Pokémon or fan-game support.

## Tech Stack

- Frontend: React 18 + Vite
- Hosting: GitHub Pages
- Deployment: GitHub Actions (push to main → auto-deploy)
- Data: PokéAPI v2 (client-side fetch, localStorage cache)

## Design Documentation

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md): system design and caching strategy
- [docs/DATA_MODEL.md](docs/DATA_MODEL.md): Pokémon, team, and matchup data structures
- [docs/API_SPEC.md](docs/API_SPEC.md): PokéAPI endpoints and client-side interface
- [docs/COMPONENT_DESIGN.md](docs/COMPONENT_DESIGN.md): React component tree and state
- [docs/DATA_FLOW.md](docs/DATA_FLOW.md): input → fetch → compute → render flow
- [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md): local setup, build, and deploy steps
- [docs/USER_GUIDE.md](docs/USER_GUIDE.md): how to use the app
