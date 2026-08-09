# Forest Shuffle

A browser-based multiplayer implementation of Forest Shuffle built with React, TypeScript, Express, and Socket.IO.

## Playable card sets

The runtime card database supports the base game, Alpine expansion, and Woodland Edge expansion. Hosts can enable either or both expansions in the lobby.

The digital appendix under `help/game-rules/` is broader than the runtime database: Exploration cards and promotional cards are retained there as rules reference material only. They are not offered in the lobby, dealt, rendered, or scored by the application.

## Development

Install and start the server:

```bash
cd server
npm ci
npm run dev
```

In another terminal, start the client:

```bash
cd client
npm ci
npm run dev
```

Open the Vite URL (normally `http://localhost:5173`). The client connects to the server on port `3000` using the browser hostname, so other devices on the same network can join with the host machine's address.

## Validation

```bash
cd client && npm run lint && npm run build
cd ../server && npm run build && npm test
```

Server tests cover card-data integrity, core game flow, effects/scoring integration, winter-card termination, and invalid action rejection.

## Current Scope

Implemented functionality includes room creation/joining, host-controlled setup, reconnectable player sessions, private hands and caves, turn enforcement, sequential deck/clearing draws, card payment and placement, face-down saplings, shrubs, shared slots, effects and bonuses, permanent triggers, winter replacement draws and game end, and explicit scoring for the supported card database.

Games are held in server memory and are lost when the server restarts. See `TODOs.md` for the remaining rule and validation work.
