# Forest Shuffle

A browser-based multiplayer implementation of Forest Shuffle built with React, TypeScript, Express, and Socket.IO. The current milestone targets a complete two-player game using the basic deck.

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

Implemented functionality includes room creation/joining, host-controlled start, reconnectable player sessions, private hands, turn enforcement, deck and clearing draws, card payment and placement, face-down saplings, tree-card clearing reveals, matching-color bonuses, winter replacement draws and game end, and initial effects/scoring support.

The rules engine is still incomplete. Choice-based card effects, ongoing triggers, shared-slot cards, and full coverage of all scoring text remain active development areas. Games are held in server memory and are lost when the server restarts.
