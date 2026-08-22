import { createHash, randomBytes, randomUUID, scrypt as nodeScrypt, timingSafeEqual } from 'crypto';
import { promisify } from 'util';
import type { AccountProfile } from '../../shared/types';
import { Persistence, type AccountRecord } from './persistence';

const scrypt = promisify(nodeScrypt);
export const sessionCookieName = 'forest_shuffle_session';
export const sessionDurationMs = 30 * 24 * 60 * 60 * 1000;

export const publicAccount = (account: AccountRecord): AccountProfile => ({
    id: account.id,
    username: account.username,
    displayName: account.displayName
});

export const normalizeUsername = (value: unknown): string => String(value ?? '').trim().toLowerCase();

export function validateCredentials(usernameValue: unknown, passwordValue: unknown, displayNameValue?: unknown) {
    const username = normalizeUsername(usernameValue);
    const password = String(passwordValue ?? '');
    const displayName = displayNameValue === undefined ? undefined : String(displayNameValue).trim();
    if (!/^[a-z0-9_.-]{3,32}$/.test(username)) {
        throw new Error('Username must be 3-32 letters, numbers, dots, underscores, or hyphens');
    }
    if (password.length < 8 || password.length > 128) throw new Error('Password must be 8-128 characters');
    if (displayName !== undefined && (displayName.length < 1 || displayName.length > 32)) {
        throw new Error('Display name must be 1-32 characters');
    }
    return { username, password, displayName };
}

export async function hashPassword(password: string, salt = randomBytes(16).toString('hex')) {
    const derived = await scrypt(password, salt, 64) as Buffer;
    return { salt, hash: derived.toString('hex') };
}

export async function verifyPassword(password: string, account: AccountRecord) {
    const derived = await scrypt(password, account.passwordSalt, 64) as Buffer;
    const expected = Buffer.from(account.passwordHash, 'hex');
    return derived.length === expected.length && timingSafeEqual(derived, expected);
}

export const hashSessionToken = (token: string) => createHash('sha256').update(token).digest('hex');

export function parseCookies(header: string | undefined): Record<string, string> {
    if (!header) return {};
    return Object.fromEntries(header.split(';').flatMap(part => {
        const separator = part.indexOf('=');
        if (separator < 0) return [];
        return [[decodeURIComponent(part.slice(0, separator).trim()), decodeURIComponent(part.slice(separator + 1).trim())]];
    }));
}

export function createAccountSession(persistence: Persistence, accountId: string) {
    const token = randomBytes(32).toString('base64url');
    const expiresAt = new Date(Date.now() + sessionDurationMs);
    persistence.createSession(hashSessionToken(token), accountId, expiresAt.toISOString());
    return { token, expiresAt };
}

export async function registerAccount(
    persistence: Persistence,
    usernameValue: unknown,
    passwordValue: unknown,
    displayNameValue: unknown
) {
    const { username, password, displayName } = validateCredentials(usernameValue, passwordValue, displayNameValue);
    if (persistence.getAccountByUsername(username)) throw new Error('Username is already registered');
    const passwordData = await hashPassword(password);
    const account: AccountRecord = {
        id: randomUUID(),
        username,
        displayName: displayName!,
        passwordSalt: passwordData.salt,
        passwordHash: passwordData.hash
    };
    try {
        persistence.createAccount(account);
    } catch {
        throw new Error('Username is already registered');
    }
    return account;
}
