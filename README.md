# Forest Shuffle

A browser-based multiplayer implementation of Forest Shuffle built with React, TypeScript, Express, and Socket.IO.

## Playable card sets

The runtime card database supports the base game, Alpine expansion, and Woodland Edge expansion. Hosts can enable either or both expansions in the lobby.

The digital appendix under `help/game-rules/` is broader than the runtime database: Exploration cards and promotional cards are retained there as rules reference material only. They are not offered in the lobby, dealt, rendered, or scored by the application.

Rules reference: [English rules](help/game-rules/rules.md) · [中文规则](help/game-rules/rules.zh-CN.md) · [card appendix](help/game-rules/appendix.md)

## Development

Install each application's locked dependencies once:

```bash
npm run setup
```

Start the server and Vite development client together:

```bash
npm run dev
```

Open the Vite URL (normally `http://localhost:5173`). Vite proxies Socket.IO traffic to the game server on port `3000`, including when another device joins through the host machine's network address.

## Production

Build both applications, then run the combined server:

```bash
npm run build
npm start
```

Open `http://localhost:3000`. Express serves the built React client and Socket.IO from the same process, port, and origin. Set `PORT` to override port `3000`.

## Validation

```bash
npm run lint
npm run build
npm test
```

Server tests cover card-data integrity, core game flow, effects/scoring integration, winter-card termination, and invalid action rejection.

## Current Scope

Implemented functionality includes room creation/joining, host-controlled setup, reconnectable player sessions, private hands and caves, turn enforcement, sequential deck/clearing draws, card payment and placement, face-down saplings, shrubs, shared slots, effects and bonuses, permanent triggers, winter replacement draws and game end, and explicit scoring for the supported card database.

Games are held in server memory and are lost when the server restarts. See `TODOs.md` for the remaining rule and validation work.
