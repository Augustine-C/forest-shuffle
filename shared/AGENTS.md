# Shared Types Guidelines

## Purpose

`types.ts` is the contract boundary between the React client and Node server. It defines card data, placed forests, players, and serialized game state. Keep this module dependency-free and limited to data shapes used on both sides; server-only behavior and UI-only props belong in their respective modules.

## Type Conventions

Use `PascalCase` for exported interfaces and type aliases. Prefer literal unions for closed vocabularies such as `CardOrientation`, `DeckType`, and `CardTag`. Use `camelCase` property names that match serialized Socket.IO payloads. Avoid `any`, runtime logic, imports from `client/` or `server/`, and index signatures that weaken known schemas.

Only mark a field optional when it is genuinely absent in a valid state. When changing an existing property, search both applications for consumers and update serialization/deserialization in the same change. Add new shared concepts here instead of maintaining near-identical local interfaces.

## Validation

There is no standalone package or command in this directory. Validate every edit through both consumers:

```bash
cd ../client && npm run lint && npm run build
cd ../server && npm run build
```

For serialized game-state changes, also run the server integration scripts and manually confirm that the client can create or join a room without payload errors. Keep breaking contract changes explicit in commit and pull-request descriptions.
