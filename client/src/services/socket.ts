import { io, Socket } from 'socket.io-client';

// Auto-detects the host if serving from the same domain, or specify if different
// For local network play, we might need to be careful about the URL if the client is on a phone
// If strictly local (same machine), 'localhost' works.
// If accessing from phone, the client bundle is served by Vite, but it needs to hit the API server.
// For now, let's assume we can configure this or hardcode the host IP if needed,
// but usually window.location.hostname is a good guess if we serve the client FROM the server or use a proxy.
// Since we are running separate dev servers:
// Server: 3000
// Client: 5173
// We need to point to port 3000.

const URL = `http://${window.location.hostname}:3000`;

export const socket: Socket = io(URL, {
    autoConnect: false
});
