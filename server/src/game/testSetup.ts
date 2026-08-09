import assert from 'node:assert/strict';
import { createEnhancedCard } from './cards';
import type { DeckType } from './cardDefinitions';
import { createDeck } from './deck';
import { GameState } from './gameState';

for (let playerCount = 2; playerCount <= 5; playerCount++) {
    const game = new GameState(playerCount);
    for (let index = 0; index < playerCount; index++) {
        game.addPlayer(`p${index}`, `socket-${index}`, `Player ${index}`, index === 0);
    }
    game.startGame(`p${playerCount - 1}`);
    while (game.pendingAction?.kind === 'initialMulligan') {
        game.resolvePendingAction(game.pendingAction.playerId, [], true);
    }
    assert.equal(game.players.size, playerCount);
    assert.equal(game.startingPlayerId, `p${playerCount - 1}`);
    assert.equal(game.activePlayerIndex, playerCount - 1);
    assert.equal([...game.players.values()].every(player => player.hand.length === 6), true);
}

const tooSmall = new GameState(2);
tooSmall.addPlayer('only', 'socket-only', 'Only Player', true);
assert.throws(() => tooSmall.startGame(), /requires 2-5 players/);

// A player without a tree may replace their opening hand exactly once.
const mulliganGame = new GameState(2);
mulliganGame.addPlayer('mulligan', 'socket-mulligan', 'Mulligan Tester', true);
mulliganGame.addPlayer('other', 'socket-other', 'Other Tester');
const mulliganPlayer = mulliganGame.players.get('mulligan')!;
mulliganPlayer.hand = [70, 71, 72, 73, 74, 75].map(cardId => createEnhancedCard(cardId)!);
const originalHand = mulliganPlayer.hand.map(card => card.cardId);
mulliganGame.deck = [1, 2, 3, 4, 5, 6].map(cardId => createEnhancedCard(cardId)!);
mulliganGame.pendingAction = {
    kind: 'initialMulligan',
    playerId: 'mulligan',
    optional: true,
    prompt: 'Draw a replacement hand?'
};
mulliganGame.resolvePendingAction('mulligan');
assert.deepEqual(mulliganGame.cardsRemovedFromGame.map(card => card.cardId), originalHand);
assert.deepEqual(mulliganPlayer.hand.map(card => card.cardId), [1, 2, 3, 4, 5, 6]);
mulliganGame.pendingAction = {
    kind: 'initialMulligan',
    playerId: 'mulligan',
    optional: true,
    prompt: 'Draw another replacement hand?'
};
assert.throws(() => mulliganGame.resolvePendingAction('mulligan'), /Mulligan already resolved/);

const expectedDeckSizes: Record<number, Record<number, number>> = {
    0: { 2: 131, 3: 141, 4: 151, 5: 161 },
    1: { 2: 142, 3: 157, 4: 172, 5: 187 },
    2: { 2: 143, 3: 173, 4: 188, 5: 203 }
};
const deckCombinations: DeckType[][] = [
    ['basic'],
    ['basic', 'alpine'],
    ['basic', 'edge'],
    ['basic', 'alpine', 'edge']
];

deckCombinations.forEach(decks => {
    for (let playerCount = 2; playerCount <= 5; playerCount++) {
        const deck = createDeck(playerCount, decks);
        const normalCardCount = deck.length - 3;
        const winterBoundary = Math.floor(normalCardCount / 3) * 2;
        assert.equal(deck.length, expectedDeckSizes[decks.length - 1][playerCount]);
        assert.equal(deck.filter(card => card.isWinterCard).length, 3);
        assert.equal(deck.slice(0, winterBoundary).some(card => card.isWinterCard), false);
        assert.equal(deck[winterBoundary].isWinterCard, true, 'first winter card must start the bottom third');
        assert.equal(deck.every(card => decks.includes(card.deck)), true);
        decks.forEach(deckName => assert.equal(deck.some(card => card.deck === deckName), true));
    }
});

console.log('✅ Setup checks passed for 2-5 players and every deck combination');
