import { io, Socket } from 'socket.io-client';

// Production uses the page origin. During development, Vite proxies Socket.IO
// traffic to the game server so the client can use the same configuration.
export const socket: Socket = io({
    autoConnect: false
});
