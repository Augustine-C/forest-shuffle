import fs from 'fs';
import path from 'path';
import { DatabaseSync } from 'node:sqlite';
import type { AccountProfile, GameStatus, GameSummary } from '../../shared/types';
import { GameState, type GameSnapshotV1 } from './game/gameState';

export interface AccountRecord extends AccountProfile {
    passwordSalt: string;
    passwordHash: string;
}

export interface StoredGame {
    roomCode: string;
    status: GameStatus;
    game: GameState;
    memberships: Map<string, string>;
    createdAt: string;
    updatedAt: string;
    completedAt?: string;
}

type Row = Record<string, unknown>;

export class Persistence {
    private database: DatabaseSync;

    constructor(databasePath: string) {
        if (databasePath !== ':memory:') fs.mkdirSync(path.dirname(databasePath), { recursive: true });
        this.database = new DatabaseSync(databasePath, { timeout: 5000 });
        this.database.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
        this.migrate();
    }

    close() {
        this.database.close();
    }

    private migrate() {
        this.database.exec(`
            CREATE TABLE IF NOT EXISTS accounts (
                id TEXT PRIMARY KEY,
                username TEXT NOT NULL COLLATE NOCASE UNIQUE,
                display_name TEXT NOT NULL,
                password_salt TEXT NOT NULL,
                password_hash TEXT NOT NULL,
                created_at TEXT NOT NULL
            ) STRICT;
            CREATE TABLE IF NOT EXISTS sessions (
                token_hash TEXT PRIMARY KEY,
                account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
                expires_at TEXT NOT NULL,
                created_at TEXT NOT NULL
            ) STRICT;
            CREATE TABLE IF NOT EXISTS games (
                room_code TEXT PRIMARY KEY,
                status TEXT NOT NULL CHECK(status IN ('LOBBY', 'PLAYING', 'ENDED')),
                snapshot_version INTEGER NOT NULL,
                snapshot_json TEXT NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                completed_at TEXT
            ) STRICT;
            CREATE TABLE IF NOT EXISTS game_memberships (
                room_code TEXT NOT NULL REFERENCES games(room_code) ON DELETE CASCADE,
                account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
                player_id TEXT NOT NULL,
                PRIMARY KEY(room_code, account_id),
                UNIQUE(room_code, player_id)
            ) STRICT;
            CREATE INDEX IF NOT EXISTS sessions_account_idx ON sessions(account_id);
            CREATE INDEX IF NOT EXISTS memberships_account_idx ON game_memberships(account_id);
        `);
    }

    createAccount(account: AccountRecord) {
        this.database.prepare(`
            INSERT INTO accounts (id, username, display_name, password_salt, password_hash, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
        `).run(account.id, account.username, account.displayName, account.passwordSalt, account.passwordHash, new Date().toISOString());
    }

    getAccountByUsername(username: string): AccountRecord | undefined {
        const row = this.database.prepare('SELECT * FROM accounts WHERE username = ? COLLATE NOCASE').get(username) as Row | undefined;
        return row ? this.accountFromRow(row) : undefined;
    }

    getAccountById(id: string): AccountRecord | undefined {
        const row = this.database.prepare('SELECT * FROM accounts WHERE id = ?').get(id) as Row | undefined;
        return row ? this.accountFromRow(row) : undefined;
    }

    updateDisplayName(accountId: string, displayName: string) {
        this.database.prepare('UPDATE accounts SET display_name = ? WHERE id = ?').run(displayName, accountId);
    }

    updatePassword(accountId: string, salt: string, hash: string) {
        this.database.prepare('UPDATE accounts SET password_salt = ?, password_hash = ? WHERE id = ?')
            .run(salt, hash, accountId);
    }

    createSession(tokenHash: string, accountId: string, expiresAt: string) {
        const now = new Date().toISOString();
        this.database.prepare('DELETE FROM sessions WHERE expires_at <= ?').run(now);
        this.database.prepare('INSERT INTO sessions (token_hash, account_id, expires_at, created_at) VALUES (?, ?, ?, ?)')
            .run(tokenHash, accountId, expiresAt, now);
    }

    getAccountForSession(tokenHash: string): AccountRecord | undefined {
        const row = this.database.prepare(`
            SELECT a.* FROM sessions s
            JOIN accounts a ON a.id = s.account_id
            WHERE s.token_hash = ? AND s.expires_at > ?
        `).get(tokenHash, new Date().toISOString()) as Row | undefined;
        return row ? this.accountFromRow(row) : undefined;
    }

    deleteSession(tokenHash: string) {
        this.database.prepare('DELETE FROM sessions WHERE token_hash = ?').run(tokenHash);
    }

    saveGame(record: StoredGame) {
        this.database.exec('BEGIN IMMEDIATE');
        try {
            const snapshot = record.game.toSnapshot();
            this.database.prepare(`
                INSERT INTO games (room_code, status, snapshot_version, snapshot_json, created_at, updated_at, completed_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(room_code) DO UPDATE SET
                    status = excluded.status,
                    snapshot_version = excluded.snapshot_version,
                    snapshot_json = excluded.snapshot_json,
                    updated_at = excluded.updated_at,
                    completed_at = excluded.completed_at
            `).run(
                record.roomCode,
                record.status,
                snapshot.version,
                JSON.stringify(snapshot),
                record.createdAt,
                record.updatedAt,
                record.completedAt ?? null
            );
            this.database.prepare('DELETE FROM game_memberships WHERE room_code = ?').run(record.roomCode);
            const insert = this.database.prepare(`
                INSERT INTO game_memberships (room_code, account_id, player_id) VALUES (?, ?, ?)
            `);
            record.memberships.forEach((playerId, accountId) => insert.run(record.roomCode, accountId, playerId));
            this.database.exec('COMMIT');
        } catch (error) {
            this.database.exec('ROLLBACK');
            throw error;
        }
    }

    hasGame(roomCode: string): boolean {
        return Boolean(this.database.prepare('SELECT 1 FROM games WHERE room_code = ?').get(roomCode));
    }

    loadGame(roomCode: string): StoredGame | undefined {
        const row = this.database.prepare('SELECT * FROM games WHERE room_code = ?').get(roomCode) as Row | undefined;
        return row ? this.gameFromRow(row) : undefined;
    }

    loadUnfinishedGames(): StoredGame[] {
        const rows = this.database.prepare("SELECT * FROM games WHERE status != 'ENDED'").all() as Row[];
        return rows.map(row => this.gameFromRow(row));
    }

    listGames(accountId: string): GameSummary[] {
        const rows = this.database.prepare(`
            SELECT g.*, m.player_id FROM games g
            JOIN game_memberships m ON m.room_code = g.room_code
            WHERE m.account_id = ?
            ORDER BY CASE g.status WHEN 'PLAYING' THEN 0 WHEN 'LOBBY' THEN 1 ELSE 2 END, g.updated_at DESC
        `).all(accountId) as Row[];
        return rows.map(row => {
            const game = GameState.fromSnapshot(JSON.parse(String(row.snapshot_json)) as GameSnapshotV1);
            const playerId = String(row.player_id);
            return {
                roomCode: String(row.room_code),
                status: row.status as GameStatus,
                players: Array.from(game.players.values()).map(player => ({
                    id: player.id,
                    name: player.name,
                    isHost: player.isHost
                })),
                currentPlayerId: playerId,
                isHost: game.players.get(playerId)?.isHost === true,
                updatedAt: String(row.updated_at),
                completedAt: row.completed_at ? String(row.completed_at) : undefined
            };
        });
    }

    private gameFromRow(row: Row): StoredGame {
        const roomCode = String(row.room_code);
        const version = Number(row.snapshot_version);
        if (version !== 1) throw new Error(`Game ${roomCode} uses unsupported snapshot version ${version}`);
        let game: GameState;
        try {
            game = GameState.fromSnapshot(JSON.parse(String(row.snapshot_json)) as GameSnapshotV1);
        } catch (error) {
            throw new Error(`Could not restore game ${roomCode}: ${(error as Error).message}`);
        }
        const memberships = new Map<string, string>();
        const membershipRows = this.database.prepare('SELECT account_id, player_id FROM game_memberships WHERE room_code = ?')
            .all(roomCode) as Row[];
        membershipRows.forEach(membership => memberships.set(String(membership.account_id), String(membership.player_id)));
        return {
            roomCode,
            status: row.status as GameStatus,
            game,
            memberships,
            createdAt: String(row.created_at),
            updatedAt: String(row.updated_at),
            completedAt: row.completed_at ? String(row.completed_at) : undefined
        };
    }

    private accountFromRow(row: Row): AccountRecord {
        return {
            id: String(row.id),
            username: String(row.username),
            displayName: String(row.display_name),
            passwordSalt: String(row.password_salt),
            passwordHash: String(row.password_hash)
        };
    }
}
