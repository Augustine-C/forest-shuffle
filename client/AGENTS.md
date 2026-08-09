# Client Guidelines

## Scope and Structure

This directory contains the React 19 browser client. `src/App.tsx` coordinates connection and session state, `src/components/` contains the lobby, game board, and card UI, and `src/services/socket.ts` owns the Socket.IO client. Put reusable images in `src/assets/`; files that must be served unchanged belong in `public/`.

Keep transport details out of presentational components. When adding a server event, update the socket-facing types and shared domain types before wiring it into UI state.

## Commands

Run all commands from `client/`:

```bash
npm ci            # install the locked dependency set
npm run dev       # start Vite, normally on port 5173
npm run lint      # check TypeScript and React lint rules
npm run build     # strict type-check and production build
npm run preview   # serve the built client locally
```

The API socket is derived from the browser hostname and port `3000`; start the server separately for interactive testing.

## UI Conventions

Use function components and hooks. Name components and their files in `PascalCase` (`Game.tsx`) and helpers, props, and state in `camelCase`. Follow the existing 2-space indentation, single quotes, and semicolons. Prefer typed props and event payloads; do not introduce new `any` values when a shared or local interface can express the data.

Keep component-specific styles close to the component or in `App.css`; reserve `index.css` for application-wide defaults. Preserve responsive behavior for desktop and phone-sized local-network play.

## Validation

There is no automated client test runner yet. Before submitting UI work, run `npm run lint` and `npm run build`, then exercise create, join, reconnect, draw, and play flows against the server. Include before/after screenshots in pull requests for visible changes.
