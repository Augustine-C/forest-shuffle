import assert from 'assert';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { GameState } from './game/gameState';
import { Persistence, type StoredGame } from './persistence';
import { createAccountSession, hashSessionToken, registerAccount, verifyPassword } from './auth';
import type { PendingAction } from '../../shared/types';

function checkDeferredSnapshotRoundTrip() {
    const game = new GameState();
    game.addPlayer('snapshot-player', '', 'Snapshot Player', true);
    const player = game.players.get('snapshot-player')!;
    const card = game.deck.shift()!;
    const placedTree = { tree: card };
    player.forest.push(placedTree);
    const resolution = {
        player,
        card,
        speciesIndex: 0,
        placedTree,
        bonusActive: true,
        freePlay: false,
        pendingPaidPlay: false,
        suppressEffectsAndBonus: false
    };
    const queuedActions: PendingAction[] = [
        { kind: 'initialMulligan', playerId: player.id, optional: true, prompt: 'mulligan' },
        { kind: 'chooseDrawSource', playerId: player.id, remaining: 2, canCancel: true, optional: false, prompt: 'draw' },
        { kind: 'selectClearingCards', playerId: player.id, destination: 'hand', count: 1, optional: true, prompt: 'clearing' },
        { kind: 'playFreeCard', playerId: player.id, repeatable: true, suppressEffectsAndBonus: false, optional: true, prompt: 'free' },
        { kind: 'playPaidCards', playerId: player.id, optional: true, prompt: 'paid' },
        { kind: 'exchangeHandForDeck', playerId: player.id, optional: true, prompt: 'exchange' },
        { kind: 'playSaplings', playerId: player.id, optional: true, prompt: 'saplings' },
        { kind: 'takeAllMatching', playerId: player.id, eligibleTag: 'Bird', count: 1, optional: true, prompt: 'matching' },
        { kind: 'triggeredDraws', playerId: player.id, triggers: [], optional: true, prompt: 'triggers' },
        { kind: 'chooseCardEffectAndBonus', playerId: player.id, resolutionId: 'choice', cardName: 'Test', optional: false, prompt: 'choice' },
        { kind: 'continueCardBonus', playerId: player.id, resolutionId: 'bonus', optional: false, prompt: 'bonus' }
    ];
    const internals = game as unknown as {
        pendingActions: PendingAction[];
        extraTurnsPending: number;
        deferredCardResolution: typeof resolution;
        triggeredDrawCompletion: 'resumeCard';
        deferredChoiceResolutions: Map<string, typeof resolution>;
        deferredBonusResolutions: Map<string, { resolution: typeof resolution; useBonus: boolean }>;
        resolutionSequence: number;
        mulliganResolved: Set<string>;
    };
    game.pendingAction = queuedActions[0];
    internals.pendingActions = queuedActions.slice(1);
    internals.extraTurnsPending = 2;
    internals.deferredCardResolution = resolution;
    internals.triggeredDrawCompletion = 'resumeCard';
    internals.deferredChoiceResolutions = new Map([['choice', resolution]]);
    internals.deferredBonusResolutions = new Map([['bonus', { resolution, useBonus: true }]]);
    internals.resolutionSequence = 7;
    internals.mulliganResolved = new Set([player.id]);

    const restored = GameState.fromSnapshot(game.toSnapshot());
    assert.deepEqual(restored.toSnapshot(), game.toSnapshot(), 'every pending-action family and deferred field round-trips');
    const restoredInternals = restored as unknown as { deferredCardResolution: typeof resolution };
    assert.equal(restoredInternals.deferredCardResolution.player, restored.players.get(player.id));
    assert.equal(restoredInternals.deferredCardResolution.placedTree, restored.players.get(player.id)!.forest[0]);
}

async function run() {
    checkDeferredSnapshotRoundTrip();
    const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'forest-shuffle-persistence-'));
    const databasePath = path.join(temporaryDirectory, 'test.sqlite');
    try {
        let persistence = new Persistence(databasePath);
        const alice = await registerAccount(persistence, 'Alice.Test', 'password-one', 'Alice');
        const bob = await registerAccount(persistence, 'bob_test', 'password-two', 'Bob');
        assert.equal(alice.username, 'alice.test');
        assert.equal(await verifyPassword('password-one', alice), true);
        assert.equal(await verifyPassword('wrong-password', alice), false);
        await assert.rejects(() => registerAccount(persistence, 'ALICE.TEST', 'another-pass', 'Other Alice'), /already registered/);

        const session = createAccountSession(persistence, alice.id);
        assert.equal(persistence.getAccountForSession(hashSessionToken(session.token))?.id, alice.id);

        const game = new GameState();
        game.addPlayer('alice-seat', '', 'Alice', true);
        game.addPlayer('bob-seat', '', 'Bob', false);
        game.startGame('alice-seat', ['basic']);
        const pendingBefore = game.pendingAction;
        const now = new Date().toISOString();
        const record: StoredGame = {
            roomCode: 'TEST',
            status: 'PLAYING',
            game,
            memberships: new Map([[alice.id, 'alice-seat'], [bob.id, 'bob-seat']]),
            createdAt: now,
            updatedAt: now
        };
        persistence.saveGame(record);
        persistence.close();

        persistence = new Persistence(databasePath);
        assert.equal(persistence.getAccountForSession(hashSessionToken(session.token))?.id, alice.id, 'session survives restart');
        const restored = persistence.loadGame('TEST');
        assert(restored);
        assert.equal(restored.status, 'PLAYING');
        assert.equal(restored.memberships.get(alice.id), 'alice-seat');
        assert.deepEqual(restored.game.toSnapshot(), game.toSnapshot(), 'game snapshot survives restart exactly');
        assert.deepEqual(restored.game.pendingAction, pendingBefore);
        const summaries = persistence.listGames(alice.id);
        assert.equal(summaries.length, 1);
        assert.equal(summaries[0].currentPlayerId, 'alice-seat');
        assert.equal(summaries[0].players[0].name, 'Alice');

        persistence.updateDisplayName(alice.id, 'New Alice');
        assert.equal(persistence.listGames(alice.id)[0].players[0].name, 'Alice', 'existing seat keeps its name');
        restored.game.gameEnded = true;
        restored.status = 'ENDED';
        restored.completedAt = new Date().toISOString();
        restored.updatedAt = restored.completedAt;
        persistence.saveGame(restored);
        const completed = persistence.listGames(alice.id)[0];
        assert.equal(completed.status, 'ENDED');
        assert.equal(completed.completedAt, restored.completedAt);
        persistence.deleteSession(hashSessionToken(session.token));
        assert.equal(persistence.getAccountForSession(hashSessionToken(session.token)), undefined);
        persistence.close();
        console.log('✅ Account, session, game snapshot, and restart persistence checks passed');
    } finally {
        fs.rmSync(temporaryDirectory, { recursive: true, force: true });
    }
}

run().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
