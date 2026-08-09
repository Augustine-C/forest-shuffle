import assert from 'node:assert/strict';
import { createEnhancedCard, isShrubCard, isTreeCard } from './cards';
import { GameState } from './gameState';

function createPlacementGame() {
    const game = new GameState(2);
    game.addPlayer('placer', 'socket-placer', 'Placement Tester', true);
    game.addPlayer('other', 'socket-other', 'Other Tester');
    return game;
}

// Tree cards create a new forest column.
const treeGame = createPlacementGame();
const treePlayer = treeGame.players.get('placer')!;
treePlayer.hand = [createEnhancedCard(23)!];
treeGame.deck = [createEnhancedCard(30)!];
treeGame.playCard('placer', 23, [], 0);
assert.equal(treePlayer.forest.length, 1);
assert.equal(treePlayer.forest[0].tree.cardId, 23);
assert.equal(treePlayer.forest[0].isShrub, false);
assert.deepEqual(treeGame.clearing.map(card => card.cardId), [30], 'trees reveal a clearing card');

// Vertical halves map to top/bottom and reject horizontal slots.
const verticalGame = createPlacementGame();
const verticalPlayer = verticalGame.players.get('placer')!;
verticalPlayer.forest = [{ tree: createEnhancedCard(23)!, isSapling: true }];
verticalPlayer.hand = [createEnhancedCard(128)!];
assert.throws(
    () => verticalGame.playCard('placer', 128, [], 1, 0, 'left'),
    /orientation is incompatible/
);
verticalGame.playCard('placer', 128, [], 1, 0, 'bottom');
assert.equal(verticalPlayer.forest[0].bottom?.[0].speciesIndex, 1);

// Horizontal halves map to left/right and reject vertical slots.
const horizontalGame = createPlacementGame();
const horizontalPlayer = horizontalGame.players.get('placer')!;
horizontalPlayer.forest = [{ tree: createEnhancedCard(23)!, isSapling: true }];
horizontalPlayer.hand = [createEnhancedCard(70)!];
assert.throws(
    () => horizontalGame.playCard('placer', 70, [], 0, 0, 'top'),
    /orientation is incompatible/
);
horizontalGame.playCard('placer', 70, [], 0, 0, 'left');
assert.equal(horizontalPlayer.forest[0].left?.[0].speciesIndex, 0);

// Shrubs occupy a forest column but are not trees and do not reveal a card.
const shrubGame = createPlacementGame();
const shrubPlayer = shrubGame.players.get('placer')!;
const blackthorn = createEnhancedCard(206)!;
assert.equal(isShrubCard(blackthorn), true);
assert.equal(isTreeCard(blackthorn), false);
shrubPlayer.hand = [blackthorn, createEnhancedCard(30)!, createEnhancedCard(31)!];
shrubGame.deck = [createEnhancedCard(40)!];
shrubGame.playCard('placer', 206, [30, 31]);
assert.equal(shrubPlayer.forest[0].isShrub, true);
assert.equal(shrubGame.deck.length, 1);

// European Hares may share a left slot after the first hare's turn has ended.
const sharedGame = createPlacementGame();
const sharedPlayer = sharedGame.players.get('placer')!;
sharedPlayer.forest = [{ tree: createEnhancedCard(23)!, isSapling: true }];
sharedPlayer.hand = [createEnhancedCard(70)!, createEnhancedCard(71)!, createEnhancedCard(72)!];
sharedGame.playCard('placer', 70, [], 0, 0, 'left');
sharedGame.activePlayerIndex = 0;
sharedGame.playCard('placer', 71, [], 0, 0, 'left');
sharedGame.activePlayerIndex = 0;
sharedGame.playCard('placer', 72, [], 0, 0, 'left');
assert.equal(sharedPlayer.forest[0].left?.length, 3);

// An ordinary card cannot be added to a fully occupied tree.
const fullGame = createPlacementGame();
const fullPlayer = fullGame.players.get('placer')!;
fullPlayer.forest = [{
    tree: createEnhancedCard(23)!,
    isSapling: true,
    top: [{ card: createEnhancedCard(118)!, speciesIndex: 0 }],
    bottom: [{ card: createEnhancedCard(128)!, speciesIndex: 1 }],
    left: [{ card: createEnhancedCard(80)!, speciesIndex: 0 }],
    right: [{ card: createEnhancedCard(81)!, speciesIndex: 1 }]
}];
fullPlayer.hand = [createEnhancedCard(126)!, createEnhancedCard(40)!];
assert.throws(
    () => fullGame.playCard('placer', 126, [40], 0, 0, 'top'),
    /cannot share this occupied slot/
);
assert.deepEqual(fullPlayer.hand.map(card => card.cardId), [126, 40], 'full-tree rejection must be atomic');

console.log('✅ Placement checks passed');
