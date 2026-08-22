import express, { type Request, type Response } from 'express';
import { createServer } from 'http';
import { Server, type Socket } from 'socket.io';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { GameState, type GameSnapshotV1 } from './game/gameState';
import { serializeGameState } from './game/serialization';
import { Persistence, type AccountRecord, type StoredGame } from './persistence';
import { createAccountSession, hashPassword, hashSessionToken, parseCookies, publicAccount, registerAccount, sessionCookieName, sessionDurationMs, validateCredentials, verifyPassword } from './auth';

const findApplicationRoot = (startDirectory: string): string => {
    let directory = startDirectory;
    while (true) {
        if (fs.existsSync(path.join(directory, 'client')) && fs.existsSync(path.join(directory, 'server'))) return directory;
        const parent = path.dirname(directory);
        if (parent === directory) throw new Error(`Could not locate application root from ${startDirectory}`);
        directory = parent;
    }
};

const applicationRoot = findApplicationRoot(__dirname);
const defaultDatabasePath = path.join(applicationRoot, 'server', 'data', 'forest-shuffle.sqlite');
const cookieHeader = (token: string, maxAgeSeconds: number, secure: boolean) =>
    `${sessionCookieName}=${encodeURIComponent(token)}; Max-Age=${maxAgeSeconds}; Path=/; HttpOnly; SameSite=Lax${secure ? '; Secure' : ''}`;
const getRequestAccount = (request: Request, persistence: Persistence) => {
    const token = parseCookies(request.headers.cookie)[sessionCookieName];
    return token ? persistence.getAccountForSession(hashSessionToken(token)) : undefined;
};
const sendApiError = (response: Response, error: unknown, status = 400) =>
    response.status(status).json({ error: (error as Error).message || 'Request failed' });

export function createForestShuffleServer(databasePath = process.env.FOREST_SHUFFLE_DB_PATH || defaultDatabasePath) {
    const persistence = new Persistence(databasePath);
    const app = express();
    app.use(cors());
    app.use(express.json({ limit: '32kb' }));

    app.post('/api/auth/register', async (request, response) => {
        try {
            const account = await registerAccount(persistence, request.body?.username, request.body?.password, request.body?.displayName);
            const session = createAccountSession(persistence, account.id);
            response.setHeader('Set-Cookie', cookieHeader(session.token, Math.floor(sessionDurationMs / 1000), request.secure));
            response.status(201).json({ account: publicAccount(account) });
        } catch (error) { sendApiError(response, error); }
    });

    app.post('/api/auth/login', async (request, response) => {
        try {
            const username = String(request.body?.username ?? '').trim().toLowerCase();
            const password = String(request.body?.password ?? '');
            const account = persistence.getAccountByUsername(username);
            if (!account || !(await verifyPassword(password, account))) throw new Error('Invalid username or password');
            const session = createAccountSession(persistence, account.id);
            response.setHeader('Set-Cookie', cookieHeader(session.token, Math.floor(sessionDurationMs / 1000), request.secure));
            response.json({ account: publicAccount(account) });
        } catch (error) { sendApiError(response, error, 401); }
    });

    app.post('/api/auth/logout', (request, response) => {
        const token = parseCookies(request.headers.cookie)[sessionCookieName];
        if (token) persistence.deleteSession(hashSessionToken(token));
        response.setHeader('Set-Cookie', cookieHeader('', 0, request.secure));
        response.status(204).end();
    });

    app.get('/api/auth/me', (request, response) => {
        const account = getRequestAccount(request, persistence);
        if (!account) return sendApiError(response, new Error('Not signed in'), 401);
        response.json({ account: publicAccount(account) });
    });

    app.patch('/api/account/profile', (request, response) => {
        const account = getRequestAccount(request, persistence);
        if (!account) return sendApiError(response, new Error('Not signed in'), 401);
        try {
            const displayName = String(request.body?.displayName ?? '').trim();
            if (displayName.length < 1 || displayName.length > 32) throw new Error('Display name must be 1-32 characters');
            persistence.updateDisplayName(account.id, displayName);
            response.json({ account: { ...publicAccount(account), displayName } });
        } catch (error) { sendApiError(response, error); }
    });

    app.patch('/api/account/password', async (request, response) => {
        const account = getRequestAccount(request, persistence);
        if (!account) return sendApiError(response, new Error('Not signed in'), 401);
        try {
            const currentPassword = String(request.body?.currentPassword ?? '');
            const newPassword = String(request.body?.newPassword ?? '');
            if (!(await verifyPassword(currentPassword, account))) throw new Error('Current password is incorrect');
            validateCredentials(account.username, newPassword);
            const passwordData = await hashPassword(newPassword);
            persistence.updatePassword(account.id, passwordData.salt, passwordData.hash);
            response.status(204).end();
        } catch (error) { sendApiError(response, error); }
    });

    app.get('/api/games', (request, response) => {
        const account = getRequestAccount(request, persistence);
        if (!account) return sendApiError(response, new Error('Not signed in'), 401);
        response.json({ games: persistence.listGames(account.id) });
    });

    const httpServer = createServer(app);
    const io = new Server(httpServer, { cors: { origin: true, credentials: true } });
    const games = new Map<string, StoredGame>();
    for (const record of persistence.loadUnfinishedGames()) games.set(record.roomCode, record);

    const accountRoom = (accountId: string) => `account:${accountId}`;
    const audienceRoom = (roomCode: string) => `game:${roomCode}:audience`;
    const privateRoom = (roomCode: string, accountId: string) => `game:${roomCode}:account:${accountId}`;
    const getGame = (value: unknown) => {
        const roomCode = String(value ?? '').trim().toUpperCase();
        const cached = games.get(roomCode);
        if (cached) return cached;
        const loaded = persistence.loadGame(roomCode);
        if (loaded) games.set(roomCode, loaded);
        return loaded;
    };
    const getPlayerList = (record: StoredGame) => Array.from(record.game.players.values()).map(player => ({
        id: player.id, name: player.name, isHost: player.isHost, hand: [], handCount: player.hand.length, forest: [], cave: []
    }));
    const emitGamesList = (accountId: string) => io.to(accountRoom(accountId)).emit('games_list_update', persistence.listGames(accountId));
    const emitListsForGame = (record: StoredGame) => record.memberships.forEach((_playerId, accountId) => emitGamesList(accountId));
    const emitPlayerList = (record: StoredGame) => io.to(audienceRoom(record.roomCode)).emit('player_list_update', getPlayerList(record));
    const emitGameEvent = (record: StoredGame, event: 'game_start' | 'game_state_update') => {
        record.memberships.forEach((playerId, accountId) => {
            const state = serializeGameState(record.game, playerId);
            io.to(privateRoom(record.roomCode, accountId)).emit(event, event === 'game_start' ? { gameState: state } : state);
        });
    };
    const persistMutation = (record: StoredGame, mutation: () => void) => {
        const priorSnapshot = record.game.toSnapshot();
        const prior = { status: record.status, updatedAt: record.updatedAt, completedAt: record.completedAt };
        try {
            mutation();
            if (record.game.gameEnded) {
                record.status = 'ENDED';
                record.completedAt ||= new Date().toISOString();
            }
            record.updatedAt = new Date().toISOString();
            persistence.saveGame(record);
        } catch (error) {
            record.game = GameState.fromSnapshot(priorSnapshot as GameSnapshotV1);
            Object.assign(record, prior);
            throw error;
        }
    };
    const openForSocket = (socket: Socket, record: StoredGame, account: AccountRecord) => {
        const playerId = record.memberships.get(account.id);
        if (!playerId) throw new Error('You are not a player in this game');
        socket.join(audienceRoom(record.roomCode));
        socket.join(privateRoom(record.roomCode, account.id));
        const player = record.game.players.get(playerId)!;
        socket.emit('game_joined', { roomCode: record.roomCode, currentPlayerId: playerId, isHost: player.isHost, status: record.status });
        if (record.status === 'LOBBY') socket.emit('player_list_update', getPlayerList(record));
        else socket.emit('game_start', { gameState: serializeGameState(record.game, playerId) });
    };

    io.use((socket, next) => {
        const token = parseCookies(socket.handshake.headers.cookie)[sessionCookieName];
        const account = token ? persistence.getAccountForSession(hashSessionToken(token)) : undefined;
        if (!account) return next(new Error('Authentication required'));
        socket.data.account = account;
        next();
    });

    io.on('connection', socket => {
        const account = socket.data.account as AccountRecord;
        socket.join(accountRoom(account.id));
        socket.emit('games_list_update', persistence.listGames(account.id));
        const handle = (work: () => void) => { try { work(); } catch (error) { socket.emit('error', (error as Error).message); } };

        socket.on('create_game', () => handle(() => {
            let roomCode = '';
            do roomCode = Math.random().toString(36).substring(2, 6).toUpperCase();
            while (games.has(roomCode) || persistence.hasGame(roomCode));
            const playerId = randomUUID();
            const game = new GameState();
            game.addPlayer(playerId, '', persistence.getAccountById(account.id)!.displayName, true);
            const now = new Date().toISOString();
            const record: StoredGame = { roomCode, status: 'LOBBY', game, memberships: new Map([[account.id, playerId]]), createdAt: now, updatedAt: now };
            persistence.saveGame(record);
            games.set(roomCode, record);
            openForSocket(socket, record, account);
            socket.emit('game_created', { roomCode, currentPlayerId: playerId });
            emitPlayerList(record);
            emitGamesList(account.id);
        }));

        socket.on('join_game', ({ roomCode: value }) => handle(() => {
            const record = getGame(value);
            if (!record) throw new Error('Room not found');
            if (record.memberships.has(account.id)) return openForSocket(socket, record, account);
            if (record.status !== 'LOBBY') throw new Error('Game already started');
            if (record.game.players.size >= 5) throw new Error('Room is full');
            const playerId = randomUUID();
            const priorMemberships = new Map(record.memberships);
            const priorUpdatedAt = record.updatedAt;
            try {
                record.game.addPlayer(playerId, '', persistence.getAccountById(account.id)!.displayName, false);
                record.memberships.set(account.id, playerId);
                record.updatedAt = new Date().toISOString();
                persistence.saveGame(record);
            } catch (error) {
                record.game.removePlayer(playerId);
                record.memberships = priorMemberships;
                record.updatedAt = priorUpdatedAt;
                throw error;
            }
            openForSocket(socket, record, account);
            emitPlayerList(record);
            emitListsForGame(record);
        }));

        socket.on('open_game', ({ roomCode: value }) => handle(() => {
            const record = getGame(value);
            if (!record) throw new Error('Game session not found');
            openForSocket(socket, record, account);
        }));
        socket.on('close_game', ({ roomCode: value }) => {
            const roomCode = String(value ?? '').trim().toUpperCase();
            socket.leave(audienceRoom(roomCode));
            socket.leave(privateRoom(roomCode, account.id));
        });

        const authorizedGame = (value: unknown, requiredStatus: 'LOBBY' | 'PLAYING') => {
            const record = getGame(value);
            if (!record) throw new Error('Game session not found');
            if (record.status !== requiredStatus) throw new Error(requiredStatus === 'LOBBY' ? 'Game already started' : 'Game is not active');
            const playerId = record.memberships.get(account.id);
            if (!playerId) throw new Error('You are not a player in this game');
            return { record, playerId, player: record.game.players.get(playerId)! };
        };
        const finishMutation = (record: StoredGame) => { emitGameEvent(record, 'game_state_update'); emitListsForGame(record); };

        socket.on('start_game', ({ roomCode, startingPlayerId, includedDecks }) => handle(() => {
            const { record, player } = authorizedGame(roomCode, 'LOBBY');
            if (!player.isHost) throw new Error('Only the host can start a lobby game');
            persistMutation(record, () => { record.game.startGame(startingPlayerId, includedDecks); record.status = 'PLAYING'; });
            emitGameEvent(record, 'game_start');
            emitListsForGame(record);
        }));
        socket.on('draw_card', ({ roomCode, source, cardId }) => handle(() => {
            const { record, playerId } = authorizedGame(roomCode, 'PLAYING');
            persistMutation(record, () => record.game.playerDrawsTwo(playerId, source, cardId)); finishMutation(record);
        }));
        socket.on('resolve_pending_action', ({ roomCode, cardIds = [], decline = false, choiceId, useEffect = false, useBonus = false }) => handle(() => {
            const { record, playerId } = authorizedGame(roomCode, 'PLAYING');
            persistMutation(record, () => record.game.resolvePendingAction(playerId, cardIds, decline, choiceId, useEffect, useBonus)); finishMutation(record);
        }));
        socket.on('play_pending_card', ({ roomCode, cardId, speciesIndex, targetTreeIndex, targetSlot }) => handle(() => {
            const { record, playerId } = authorizedGame(roomCode, 'PLAYING');
            persistMutation(record, () => record.game.playPendingFreeCard(playerId, cardId, speciesIndex, targetTreeIndex, targetSlot)); finishMutation(record);
        }));
        socket.on('play_pending_paid_card', ({ roomCode, cardId, costCardIds, speciesIndex, targetTreeIndex, targetSlot, asSapling = false }) => handle(() => {
            const { record, playerId } = authorizedGame(roomCode, 'PLAYING');
            persistMutation(record, () => record.game.playPendingPaidCard(playerId, cardId, costCardIds, speciesIndex, targetTreeIndex, targetSlot, asSapling)); finishMutation(record);
        }));
        socket.on('play_card', ({ roomCode, cardId, costCardIds, speciesIndex, targetTreeIndex, targetSlot, asSapling = false }) => handle(() => {
            const { record, playerId } = authorizedGame(roomCode, 'PLAYING');
            persistMutation(record, () => record.game.playCard(playerId, cardId, costCardIds, speciesIndex, targetTreeIndex, targetSlot, asSapling)); finishMutation(record);
        }));
    });

    const clientDist = path.join(applicationRoot, 'client', 'dist');
    const clientIndex = path.join(clientDist, 'index.html');
    if (fs.existsSync(clientIndex)) {
        app.use(express.static(clientDist));
        app.use((request, response, next) => {
            if (request.method !== 'GET') return next();
            response.sendFile(clientIndex, error => { if (error) next(error); });
        });
    }

    return { app, httpServer, io, persistence, close: () => new Promise<void>((resolve, reject) => {
        io.close();
        if (!httpServer.listening) { persistence.close(); resolve(); return; }
        httpServer.close(error => { persistence.close(); if (error) reject(error); else resolve(); });
    }) };
}

if (require.main === module) {
    const server = createForestShuffleServer();
    const port = Number(process.env.PORT || 3000);
    server.httpServer.listen(port, () => {
        console.log(`Server running on http://localhost:${port}`);
        const { networkInterfaces } = require('os');
        const nets = networkInterfaces();
        for (const name of Object.keys(nets)) for (const net of nets[name] ?? []) {
            if (net.family === 'IPv4' && !net.internal) console.log(`Network access: http://${net.address}:${port}`);
        }
    });
}
