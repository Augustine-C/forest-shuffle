# Repository Guidelines

## Project Structure & Module Organization

This repository is a TypeScript implementation of Forest Shuffle split into three application areas:

- `client/`: React 19 + Vite UI. Components live in `src/components/`, socket setup in `src/services/`, and styles/assets alongside the consuming code.
- `server/`: Express and Socket.IO server. Core rules, card handling, effects, and scoring live in `src/game/`; generated or source game data is under `src/game/data/`.
- `shared/`: types imported by both applications.
- `help/`: reference JavaScript/CSS, card conversion utilities, images, and rule PDFs. Treat this as supporting material, not production application code.

Keep game-rule changes in focused modules under `server/src/game/`; avoid duplicating shared interfaces in client and server.

## Build, Test, and Development Commands

Install dependencies separately because each application has its own lockfile:

```bash
cd client && npm ci
cd ../server && npm ci
```

Run local development in two terminals with `npm run dev` from `server/` (port 3000) and `client/` (Vite, normally port 5173). Use `npm run build` in each directory to type-check and compile. In `client/`, `npm run lint` runs ESLint and `npm run preview` serves the production build.

Run the server's complete scripted checks with:

```bash
cd server
npm test
```

## Coding Style & Naming Conventions

TypeScript strict mode is enabled. Use 2 spaces in client code and follow the surrounding file in older server modules; prefer single quotes, semicolons, and explicit domain types over `any`. Name React components and classes in `PascalCase`, functions and variables in `camelCase`, and constants in descriptive `camelCase` unless truly global constants warrant `UPPER_SNAKE_CASE`. Component filenames use `PascalCase.tsx`; game modules use `camelCase.ts`.

## Testing Guidelines

Add deterministic assertions near the game engine and name runnable scripts `test*.ts`. Cover normal play plus invalid turns, payment, placement, effects, scoring, and winter-card termination. Before submitting, run both builds, client lint, and `npm test` in `server/`.

## Commit & Pull Request Guidelines

History currently uses short imperative summaries (`init`, `update`) and does not establish a formal convention. Use a more specific imperative subject, for example `Fix split-card placement scoring`. Keep commits scoped to one concern. Pull requests should explain gameplay impact, list verification commands, link related issues, and include screenshots for visible UI changes. Call out card-data or rules-source changes explicitly.
