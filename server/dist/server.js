"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const gameState_1 = require("./game/gameState");
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
const httpServer = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});
// Serve static files from client dist
const clientDist = path_1.default.join(__dirname, '../../client/dist');
app.use(express_1.default.static(clientDist));
const games = new Map(); // RoomID -> GameState
const roomMetadata = new Map();
// Helper to generate room code
const generateRoomCode = () => Math.random().toString(36).substring(2, 6).toUpperCase();
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
    socket.on('create_game', ({ playerName }) => {
        const roomCode = generateRoomCode();
        // Initialize GameState
        const gameState = new gameState_1.GameState();
        gameState.addPlayer(socket.id, playerName);
        games.set(roomCode, gameState);
        roomMetadata.set(roomCode, { status: 'LOBBY' });
        socket.join(roomCode);
        // Return success
        socket.emit('game_created', { roomCode, currentPlayerId: socket.id });
        // Broadcast player list definition: we need to array-ify the values
        const playersList = Array.from(gameState.players.values());
        io.to(roomCode).emit('player_list_update', playersList);
        console.log(`Game created: ${roomCode} by ${playerName}`);
    });
    socket.on('join_game', ({ roomCode, playerName }) => {
        const game = games.get(roomCode);
        const meta = roomMetadata.get(roomCode);
        if (!game || !meta) {
            socket.emit('error', 'Room not found');
            return;
        }
        if (meta.status !== 'LOBBY') {
            socket.emit('error', 'Game already started');
            return;
        }
        game.addPlayer(socket.id, playerName);
        socket.join(roomCode);
        socket.emit('game_joined', { roomCode, currentPlayerId: socket.id });
        const playersList = Array.from(game.players.values());
        io.to(roomCode).emit('player_list_update', playersList);
        console.log(`${playerName} joined ${roomCode}`);
    });
    const getSerializedState = (game) => ({
        players: Array.from(game.players.values()),
        clearing: game.clearing,
        activePlayerIndex: game.activePlayerIndex,
        deckCount: game.deck.length
    });
    socket.on('start_game', ({ roomCode }) => {
        const game = games.get(roomCode);
        const meta = roomMetadata.get(roomCode);
        if (game && meta) {
            meta.status = 'PLAYING';
            try {
                game.startGame(); // Deals cards
            }
            catch (e) {
                console.error("Error starting game:", e);
            }
            io.to(roomCode).emit('game_start', { gameState: getSerializedState(game) });
            console.log(`Game ${roomCode} started. Deal complete.`);
        }
    });
    socket.on('draw_card', ({ roomCode }) => {
        const game = games.get(roomCode);
        const meta = roomMetadata.get(roomCode);
        if (!game || (meta === null || meta === void 0 ? void 0 : meta.status) !== 'PLAYING')
            return;
        // Verify active player
        const activePlayerId = Array.from(game.players.keys())[game.activePlayerIndex];
        if (activePlayerId !== socket.id) {
            socket.emit('error', 'Not your turn!');
            return;
        }
        game.playerDrawsTwo();
        io.to(roomCode).emit('game_state_update', getSerializedState(game));
    });
    socket.on('play_card', ({ roomCode, cardId, costCardIds, targetTreeIndex, targetSlot }) => {
        const game = games.get(roomCode);
        const meta = roomMetadata.get(roomCode);
        if (!game || (meta === null || meta === void 0 ? void 0 : meta.status) !== 'PLAYING')
            return;
        // Verify active player
        const activePlayerId = Array.from(game.players.keys())[game.activePlayerIndex];
        if (activePlayerId !== socket.id) {
            socket.emit('error', 'Not your turn!');
            return;
        }
        try {
            game.playCard(socket.id, cardId, costCardIds, targetTreeIndex, targetSlot);
            io.to(roomCode).emit('game_state_update', getSerializedState(game));
        }
        catch (e) {
            console.error("Error playing card:", e);
            socket.emit('error', 'Invalid play');
        }
    });
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        // In a real app, handle cleanup
    });
});
const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    const { networkInterfaces } = require('os');
    const nets = networkInterfaces();
    for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
            if (net.family === 'IPv4' && !net.internal) {
                console.log(`Network access: http://${net.address}:${PORT}`);
            }
        }
    }
});
