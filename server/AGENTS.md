# Server Guidelines

## Scope and Architecture

`src/server.ts` owns Express setup, Socket.IO event handling, room lifecycle, and game-state serialization. Domain logic belongs in `src/game/`: `gameState.ts` coordinates turns, `deck.ts` handles deck construction, and the effects, matching, and scoring modules implement focused rules. Card sources are exposed through `cardDefinitions.ts` and JSON under `src/game/data/`.

Keep Socket.IO handlers thin: validate room/player state, call a game-domain method, and emit a serialized result. Do not put scoring or placement rules directly in `server.ts`.

## Commands

Run from `server/`:

```bash
npm ci
npm run dev
npm run build
npx ts-node src/game/testGameState.ts
npx ts-node src/game/testIntegration.ts
npx ts-node src/game/verifyCardData.ts
```

Prefer `npm test` to run the full suite, including action-validation checks. `npm run dev` starts port `3000` by default; override it with `PORT`. After `npm run build`, `npm start` runs the compiled server.

## Code and Game-Rule Conventions

Strict TypeScript is required. Use `PascalCase` for classes/interfaces, `camelCase` for functions and values, and explicit union types for finite game states. Follow the local formatting of the file being edited; server modules generally use 4 spaces, single quotes, and semicolons. Reuse types from `../shared/types.ts` where the client consumes the same shape.

Effects and scoring changes must preserve card identity, orientation, payment, placement slot, and active-player checks. Treat `data/*.json` as generated/reference-derived data and review large changes carefully.

## Validation

Add deterministic cases to a `test*.ts` script for every rule correction. Cover success and rejection paths, including invalid turns and targets. Run the build plus all relevant scripts; manually verify the create/join/reconnect flow when changing socket events or serialization.
