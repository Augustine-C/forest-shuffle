import assert from 'node:assert/strict';
import { createEnhancedCard } from './cards';
import { GameState } from './gameState';
import { serializeGameState } from './serialization';

const game = new GameState(2);
game.addPlayer('alice', 'socket-alice', 'Alice', true);
game.addPlayer('bob', 'socket-bob', 'Bob');
const alice = game.players.get('alice')!;
const bob = game.players.get('bob')!;

// Inactive-player attempts are rejected without mutating shared state.
alice.hand = [createEnhancedCard(23)!];
bob.hand = [createEnhancedCard(24)!];
game.deck = [createEnhancedCard(30)!, createEnhancedCard(31)!];
const beforeInvalidTurn = {
    aliceHand: alice.hand.map(card => card.cardId),
    bobHand: bob.hand.map(card => card.cardId),
    deck: game.deck.map(card => card.cardId),
    forest: bob.forest.length,
    activePlayerIndex: game.activePlayerIndex
};
assert.throws(() => game.playerDrawsTwo('bob'), /Not your turn/);
assert.throws(() => game.playCard('bob', 24, [], 0), /Not your turn/);
assert.deepEqual({
    aliceHand: alice.hand.map(card => card.cardId),
    bobHand: bob.hand.map(card => card.cardId),
    deck: game.deck.map(card => card.cardId),
    forest: bob.forest.length,
    activePlayerIndex: game.activePlayerIndex
}, beforeInvalidTurn);

// Each client sees its own private zones and only counts for opponents.
alice.cave = [createEnhancedCard(32)!, createEnhancedCard(33)!];
bob.cave = [createEnhancedCard(34)!];
const aliceView = serializeGameState(game, 'alice');
const bobView = serializeGameState(game, 'bob');
assert.deepEqual(aliceView.players.find(player => player.id === 'alice')?.hand.map(card => card.cardId), [23]);
assert.deepEqual(aliceView.players.find(player => player.id === 'bob')?.hand, []);
assert.deepEqual(aliceView.players.find(player => player.id === 'bob')?.cave, []);
assert.equal(aliceView.players.find(player => player.id === 'bob')?.handCount, 1);
assert.equal(aliceView.players.find(player => player.id === 'bob')?.caveCount, 1);
assert.deepEqual(bobView.players.find(player => player.id === 'alice')?.hand, []);
assert.deepEqual(bobView.players.find(player => player.id === 'alice')?.cave, []);
assert.equal(aliceView.myScore, 2, 'the viewer receives their own live cave score');
assert.equal(bobView.myScore, 1, 'each viewer receives a different private live score');
assert.equal('score' in aliceView.players.find(player => player.id === 'bob')!, false);

// Reconnection changes only the transport identity and preserves in-flight actions.
game.clearing = [createEnhancedCard(35)!];
game.playerDrawsTwo('alice');
assert.equal(game.pendingAction?.kind, 'chooseDrawSource');
const pendingBeforeReconnect = game.pendingAction;
game.reconnectPlayer('alice', 'socket-alice-reconnected');
assert.equal(alice.socketId, 'socket-alice-reconnected');
assert.deepEqual(game.pendingAction, pendingBeforeReconnect);
assert.deepEqual(serializeGameState(game, 'alice').pendingAction, pendingBeforeReconnect);

// Every viewer receives the same final-score map while private zones remain hidden.
game.pendingAction = undefined;
alice.forest = [{ tree: createEnhancedCard(51)! }];
bob.forest = [{ tree: createEnhancedCard(68)!, isSapling: true }];
game.gameEnded = true;
const expectedScores = Object.fromEntries(game.calculateScores());
const finalAliceView = serializeGameState(game, 'alice');
const finalBobView = serializeGameState(game, 'bob');
assert.deepEqual(finalAliceView.finalScores, expectedScores);
assert.deepEqual(finalBobView.finalScores, expectedScores);
assert.deepEqual(finalAliceView.finalScores, finalBobView.finalScores);
assert.deepEqual(finalAliceView.players.find(player => player.id === 'bob')?.cave, []);
assert.deepEqual(finalBobView.players.find(player => player.id === 'alice')?.cave, []);

console.log('✅ Multiplayer state and synchronization checks passed');
