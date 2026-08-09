import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { GameState } from './game/gameState';

const app = express();
app.use(cors());

const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Serve static files from client dist
const clientDist = path.resolve(process.cwd(), '../client/dist');
app.use(express.static(clientDist));

const games = new Map<string, GameState>(); // RoomID -> GameState
const roomMetadata = new Map<string, { status: 'LOBBY' | 'PLAYING' | 'ENDED' }>();

// Helper to generate room code
const generateRoomCode = () => Math.random().toString(36).substring(2, 6).toUpperCase();
const generatePlayerId = () => Math.random().toString(36).substring(2, 10);

const getPlayerList = (game: GameState) => Array.from(game.players.values()).map(player => ({
    id: player.id,
    name: player.name,
    isHost: player.isHost,
    hand: [],
    handCount: player.hand.length,
    forest: [],
    cave: []
}));

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('create_game', ({ playerName }) => {
        const roomCode = generateRoomCode();
        const playerId = generatePlayerId();

        // Initialize GameState
        const gameState = new GameState();
        gameState.addPlayer(playerId, socket.id, playerName, true);

        games.set(roomCode, gameState);
        roomMetadata.set(roomCode, { status: 'LOBBY' });

        socket.join(roomCode);

        // Return success
        socket.emit('game_created', { roomCode, currentPlayerId: playerId });

        // Broadcast player list
        io.to(roomCode).emit('player_list_update', getPlayerList(gameState));

        console.log(`Game created: ${roomCode} by ${playerName} (${playerId})`);
    });

    socket.on('join_game', ({ roomCode: requestedRoomCode, playerName }) => {
        const roomCode = String(requestedRoomCode).trim().toUpperCase();
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
        if (game.players.size >= 5) {
            socket.emit('error', 'Room is full');
            return;
        }

        const playerId = generatePlayerId();
        game.addPlayer(playerId, socket.id, playerName, false);
        socket.join(roomCode);

        socket.emit('game_joined', { roomCode, currentPlayerId: playerId });
        io.to(roomCode).emit('player_list_update', getPlayerList(game));

        console.log(`${playerName} (${playerId}) joined ${roomCode}`);
    });

    socket.on('rejoin_game', ({ roomCode, playerId }) => {
        const game = games.get(roomCode);
        const meta = roomMetadata.get(roomCode);

        if (!game || !meta) {
            socket.emit('error', 'Game session not found');
            return;
        }

        const player = game.players.get(playerId);
        if (!player) {
            socket.emit('error', 'Player not found in this game');
            return;
        }

        // Update player with new socket ID
        player.socketId = socket.id;
        socket.join(roomCode);

        console.log(`Player ${player.name} (${playerId}) rejoined room ${roomCode}`);

        // Sync state back to player
        if (meta.status === 'LOBBY') {
            socket.emit('game_joined', { roomCode, currentPlayerId: playerId, isHost: player.isHost });
            socket.emit('player_list_update', getPlayerList(game));
        } else {
            // Sync host info even if game already started for UI consistency
            socket.emit('game_joined', { roomCode, currentPlayerId: playerId, isHost: player.isHost });
            socket.emit('game_start', { gameState: getSerializedState(game, playerId) });
        }
    });

    const getSerializedState = (game: GameState, viewerId: string) => ({
        players: Array.from(game.players.values()).map(player => ({
            id: player.id,
            name: player.name,
            isHost: player.isHost,
            hand: player.id === viewerId ? player.hand : [],
            handCount: player.hand.length,
            forest: player.forest,
            cave: player.cave
        })),
        clearing: game.clearing,
        activePlayerIndex: game.activePlayerIndex,
        deckCount: game.deck.length,
        winterCardsDrawn: game.winterCardsDrawn,
        gameEnded: game.gameEnded,
        finalScores: game.gameEnded ? Object.fromEntries(game.calculateScores()) : undefined
    });

    const emitGameEvent = (roomCode: string, game: GameState, event: 'game_start' | 'game_state_update') => {
        game.players.forEach(player => {
            const state = getSerializedState(game, player.id);
            io.to(player.socketId).emit(event, event === 'game_start' ? { gameState: state } : state);
        });
    };

    const isAuthorizedPlayer = (game: GameState, playerId: string) =>
        game.players.get(playerId)?.socketId === socket.id;

    socket.on('start_game', ({ roomCode, playerId }) => {
        const game = games.get(roomCode);
        const meta = roomMetadata.get(roomCode);
        const player = game?.players.get(playerId);
        if (game && meta && player?.socketId === socket.id && player.isHost && meta.status === 'LOBBY') {
            meta.status = 'PLAYING';
            try {
                game.startGame(); // Deals cards
            } catch (e) {
                console.error("Error starting game:", e);
            }
            emitGameEvent(roomCode, game, 'game_start');
            console.log(`Game ${roomCode} started. Deal complete.`);
        }
        else socket.emit('error', 'Only the host can start a lobby game');
    });

    socket.on('draw_card', ({ roomCode, playerId, clearingCardIds = [] }) => {
        const game = games.get(roomCode);
        const meta = roomMetadata.get(roomCode);
        if (!game || meta?.status !== 'PLAYING') return;
        if (!isAuthorizedPlayer(game, playerId)) {
            socket.emit('error', 'Player session does not match this connection');
            return;
        }

        // Verify active player
        const activePlayerId = Array.from(game.players.keys())[game.activePlayerIndex];
        if (activePlayerId !== playerId) {
            socket.emit('error', 'Not your turn!');
            return;
        }

        try {
            game.playerDrawsTwo(clearingCardIds);
            if (game.gameEnded) meta.status = 'ENDED';
            emitGameEvent(roomCode, game, 'game_state_update');
        } catch (error) {
            socket.emit('error', (error as Error).message);
        }
    });

    socket.on('play_card', ({ roomCode, playerId, cardId, costCardIds, speciesIndex, targetTreeIndex, targetSlot, asSapling = false }) => {
        const game = games.get(roomCode);
        const meta = roomMetadata.get(roomCode);
        if (!game || meta?.status !== 'PLAYING') return;
        if (!isAuthorizedPlayer(game, playerId)) {
            socket.emit('error', 'Player session does not match this connection');
            return;
        }

        // Verify active player
        const activePlayerId = Array.from(game.players.keys())[game.activePlayerIndex];
        if (activePlayerId !== playerId) {
            socket.emit('error', 'Not your turn!');
            return;
        }

        try {
            game.playCard(activePlayerId, cardId, costCardIds, speciesIndex, targetTreeIndex, targetSlot, asSapling);
            if (game.gameEnded) meta.status = 'ENDED';
            emitGameEvent(roomCode, game, 'game_state_update');
        } catch (e) {
            console.error("Error playing card:", e);
            socket.emit('error', (e as Error).message || 'Invalid play');
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
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
