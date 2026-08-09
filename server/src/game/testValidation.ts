import assert from 'node:assert/strict';
import { GameState } from './gameState';
import { createEnhancedCard } from './cards';
import { createDeck } from './deck';

const game = new GameState(2);
game.addPlayer('p1', 'socket1', 'Alice', true);
game.addPlayer('p2', 'socket2', 'Bob');
game.startGame();

const alice = game.players.get('p1')!;
const birch = createEnhancedCard(41)!;
const blackberries = createEnhancedCard(128)!;
alice.hand = [birch, blackberries, ...alice.hand];

assert.throws(
    () => game.playCard('p1', birch.cardId, [birch.cardId], 0),
    /cannot pay for itself/
);
assert.equal(alice.hand.includes(birch), true, 'rejected actions must not mutate the hand');

const payment = alice.hand.find(card => card.cardId !== birch.cardId && card.cardId !== blackberries.cardId)!;
game.playCard('p1', birch.cardId, [payment.cardId], 0);

assert.throws(
    () => game.playCard('p1', blackberries.cardId, [], 1, 0, 'left'),
    /orientation is incompatible/
);
assert.equal(alice.hand.includes(blackberries), true, 'invalid placement must not remove the card');

game.playCard('p1', blackberries.cardId, [], 1, 0, 'bottom');
assert.equal(alice.forest[0].speciesIndices?.bottom, 1);

const configuredDeck = createDeck(2);
assert.equal(configuredDeck[Math.floor(128 / 3) * 2].isWinterCard, true);

const winterGame = new GameState(2);
winterGame.addPlayer('winter', 'socket-winter', 'Winter Tester', true);
const winterPlayer = winterGame.players.get('winter')!;
const winter = configuredDeck.find(card => card.isWinterCard)!;
const normal = configuredDeck.find(card => !card.isWinterCard)!;
winterGame.deck = [winter, normal];
winterGame.drawCards(1, winterPlayer);
assert.equal(winterGame.winterCardsDrawn, 1);
assert.deepEqual(winterPlayer.hand.map(card => card.cardId), [normal.cardId]);

const saplingGame = new GameState(2);
saplingGame.addPlayer('sapling', 'socket-sapling', 'Sapling Tester', true);
const saplingPlayer = saplingGame.players.get('sapling')!;
const saplingCard = createEnhancedCard(89)!;
saplingPlayer.hand = [saplingCard];
saplingGame.playCard('sapling', saplingCard.cardId, [], 0, undefined, undefined, true);
assert.equal(saplingPlayer.forest[0].isSapling, true);
assert.equal(saplingGame.calculateScores().get('sapling'), 0);

const bonusGame = new GameState(2);
bonusGame.addPlayer('bonus', 'socket-bonus', 'Bonus Tester', true);
const bonusPlayer = bonusGame.players.get('bonus')!;
bonusPlayer.forest = [{ tree: createEnhancedCard(23)! }];
const roeDeer = createEnhancedCard(89)!;
const birchPayment = createEnhancedCard(24)!;
const jayPayment = createEnhancedCard(126)!;
bonusPlayer.hand = [roeDeer, birchPayment, jayPayment];
bonusGame.deck = [normal];
bonusGame.playCard('bonus', roeDeer.cardId, [birchPayment.cardId, jayPayment.cardId], 1, 0, 'right');
assert.equal(bonusPlayer.hand.length, 1, 'matching payment colors should activate the draw bonus');

console.log('✅ Game action validation checks passed');
