import assert from 'node:assert/strict';
import { createEnhancedCard } from './cards';
import { GameState } from './gameState';

function acceptAbilities(game: GameState) {
    const action = game.pendingAction;
    if (action?.kind !== 'chooseCardEffectAndBonus') return;
    game.resolvePendingAction(
        action.playerId,
        [],
        false,
        undefined,
        Boolean(action.effectText),
        Boolean(action.bonusText)
    );
}

// A permanent mushroom trigger pauses the played card, draws, then resumes its abilities.
const mushroomGame = new GameState(2);
mushroomGame.addPlayer('mushroom', 'socket-mushroom', 'Mushroom Tester', true);
mushroomGame.addPlayer('other', 'socket-other', 'Other Tester');
const mushroomPlayer = mushroomGame.players.get('mushroom')!;
mushroomPlayer.forest = [{
    tree: createEnhancedCard(1)!,
    bottom: [{ card: createEnhancedCard(139)!, speciesIndex: 1 }]
}];
mushroomPlayer.hand = [createEnhancedCard(23)!];
mushroomGame.deck = [createEnhancedCard(34)!, createEnhancedCard(35)!, createEnhancedCard(36)!];
mushroomGame.playCard('mushroom', 23, [], 0);
assert.equal(mushroomGame.pendingAction?.kind, 'triggeredDraws');
mushroomGame.resolvePendingAction('mushroom', [], false, '139:1');
assert.equal(mushroomPlayer.hand.length, 1, 'Chanterelle must draw before card abilities resume');
assert.equal(mushroomGame.pendingAction?.kind, 'chooseCardEffectAndBonus');
acceptAbilities(mushroomGame);
assert.equal(mushroomGame.activePlayerIndex, 1);

// Mole keeps its paid-play action alive while nested card abilities resolve.
const moleGame = new GameState(2);
moleGame.addPlayer('mole', 'socket-mole', 'Mole Tester', true);
moleGame.addPlayer('other', 'socket-other', 'Other Tester');
const molePlayer = moleGame.players.get('mole')!;
molePlayer.forest = [{ tree: createEnhancedCard(23)! }];
molePlayer.hand = [
    createEnhancedCard(141)!,
    createEnhancedCard(126)!,
    createEnhancedCard(30)!,
    createEnhancedCard(31)!,
    createEnhancedCard(32)!
];
moleGame.deck = [createEnhancedCard(34)!, createEnhancedCard(35)!];
moleGame.playCard('mole', 141, [30, 31], 1, 0, 'bottom');
acceptAbilities(moleGame);
assert.equal(moleGame.pendingAction?.kind, 'playPaidCards');
moleGame.playPendingPaidCard('mole', 126, [32], 0, 0, 'top');
acceptAbilities(moleGame);
assert.equal(moleGame.pendingAction?.kind, 'playPaidCards');
moleGame.resolvePendingAction('mole', [], true);
assert.equal(moleGame.activePlayerIndex, 0, 'the nested Jay extra turn must survive Mole resolution');

// Water Vole places both saplings before their mushroom-triggered draws resolve.
const voleGame = new GameState(2);
voleGame.addPlayer('vole', 'socket-vole', 'Water Vole Tester', true);
voleGame.addPlayer('other', 'socket-other', 'Other Tester');
const volePlayer = voleGame.players.get('vole')!;
volePlayer.forest = [{
    tree: createEnhancedCard(1)!,
    bottom: [{ card: createEnhancedCard(139)!, speciesIndex: 1 }]
}, { tree: createEnhancedCard(2)! }];
volePlayer.hand = [
    createEnhancedCard(213)!,
    createEnhancedCard(30)!,
    createEnhancedCard(31)!,
    createEnhancedCard(32)!,
    createEnhancedCard(33)!
];
voleGame.deck = [
    createEnhancedCard(34)!,
    createEnhancedCard(35)!,
    createEnhancedCard(36)!,
    createEnhancedCard(37)!
];
voleGame.playCard('vole', 213, [30, 31], 1, 1, 'bottom');
acceptAbilities(voleGame);
assert.equal(voleGame.pendingAction?.kind, 'playSaplings');
voleGame.resolvePendingAction('vole', [32, 33]);
assert.equal(volePlayer.forest.filter(tree => tree.isSapling).length, 2);
assert.equal(voleGame.clearing.length, 4, 'both saplings reveal before nested draws');
assert.equal(voleGame.pendingAction?.kind, 'triggeredDraws');
while (true) {
    const action = voleGame.pendingAction as { kind: string; triggers?: Array<{ id: string }> } | undefined;
    if (action?.kind !== 'triggeredDraws') break;
    voleGame.resolvePendingAction('vole', [], false, action.triggers![0].id);
}
assert.deepEqual(volePlayer.hand.map(card => card.cardId), [36, 37]);
assert.equal(voleGame.activePlayerIndex, 1);

// Repeatable free plays resume until explicitly declined.
const freeGame = new GameState(2);
freeGame.addPlayer('free', 'socket-free', 'Free Play Tester', true);
freeGame.addPlayer('other', 'socket-other', 'Other Tester');
const freePlayer = freeGame.players.get('free')!;
freePlayer.forest = [{ tree: createEnhancedCard(23)! }, { tree: createEnhancedCard(24)! }];
freePlayer.hand = [createEnhancedCard(98)!, createEnhancedCard(71)!, createEnhancedCard(93)!];
freeGame.playCard('free', 98, [], 1, 0, 'right');
acceptAbilities(freeGame);
assert.equal(freeGame.pendingAction?.kind, 'playFreeCard');
freeGame.playPendingFreeCard('free', 71, 1, 1, 'right');
assert.equal(freeGame.pendingAction?.kind, 'playFreeCard');
freeGame.playPendingFreeCard('free', 93, 0, 1, 'left');
assert.equal(freeGame.pendingAction?.kind, 'playFreeCard');
freeGame.resolvePendingAction('free', [], true);
assert.equal(freeGame.pendingAction, undefined);
assert.equal(freeGame.activePlayerIndex, 1);

// Drawing the third winter card interrupts the remaining nested trigger queue.
const winterGame = new GameState(2);
winterGame.addPlayer('winter', 'socket-winter', 'Winter Tester', true);
winterGame.addPlayer('other', 'socket-other', 'Other Tester');
const winterPlayer = winterGame.players.get('winter')!;
winterPlayer.forest = [
    { tree: createEnhancedCard(1)!, bottom: [{ card: createEnhancedCard(144)!, speciesIndex: 1 }] },
    { tree: createEnhancedCard(2)!, bottom: [{ card: createEnhancedCard(157)!, speciesIndex: 1 }] }
];
winterPlayer.hand = [createEnhancedCard(70)!];
winterGame.winterCardsDrawn = 2;
winterGame.deck = [createEnhancedCard(67)!, createEnhancedCard(34)!];
winterGame.playCard('winter', 70, [], 0, 0, 'left');
const winterAction = winterGame.pendingAction;
assert.equal(winterAction?.kind === 'triggeredDraws' ? winterAction.triggers.length : 0, 2);
winterGame.resolvePendingAction(
    'winter',
    [],
    false,
    winterAction?.kind === 'triggeredDraws' ? winterAction.triggers[0].id : undefined
);
assert.equal(winterGame.gameEnded, true);
assert.equal(winterGame.pendingAction, undefined);
assert.equal(winterGame.deck[0].cardId, 34, 'winter interruption must stop the remaining trigger');

console.log('✅ Nested resolution checks passed');
