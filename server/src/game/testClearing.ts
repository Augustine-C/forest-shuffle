import assert from 'node:assert/strict';
import { createEnhancedCard } from './cards';
import { GameState } from './gameState';

function createGame(playerId: string) {
    const game = new GameState(2);
    game.addPlayer(playerId, `socket-${playerId}`, 'Clearing Tester', true);
    game.addPlayer('other', 'socket-other', 'Other Tester');
    return game;
}

function acceptAbilities(game: GameState, useEffect = true, useBonus = true) {
    const action = game.pendingAction;
    assert.equal(action?.kind, 'chooseCardEffectAndBonus');
    game.resolvePendingAction(
        action!.playerId,
        [],
        false,
        undefined,
        useEffect && Boolean(action!.effectText),
        useBonus && Boolean(action!.bonusText)
    );
}

// Reaching exactly ten clearing cards wipes the clearing at turn end.
const exactGame = createGame('exact');
const exactPlayer = exactGame.players.get('exact')!;
exactPlayer.hand = [createEnhancedCard(23)!];
exactGame.clearing = Array.from({ length: 9 }, (_, index) => createEnhancedCard(30 + index)!);
exactGame.deck = [createEnhancedCard(40)!];
exactGame.playCard('exact', 23, [], 0);
acceptAbilities(exactGame, false, false);
assert.equal(exactGame.clearing.length, 0);
assert.equal(exactGame.activePlayerIndex, 1);

// The same cleanup is defensive when the clearing has grown beyond ten.
const overflowGame = createGame('overflow');
const overflowPlayer = overflowGame.players.get('overflow')!;
overflowPlayer.hand = [createEnhancedCard(23)!];
overflowGame.clearing = Array.from({ length: 10 }, (_, index) => createEnhancedCard(30 + index)!);
overflowGame.deck = [createEnhancedCard(40)!];
overflowGame.playCard('overflow', 23, [], 0);
acceptAbilities(overflowGame, false, false);
assert.equal(overflowGame.clearing.length, 0);
assert.equal(overflowGame.activePlayerIndex, 1);

// Cave selections transfer only the chosen clearing cards.
const caveGame = createGame('cave');
const cavePlayer = caveGame.players.get('cave')!;
cavePlayer.forest = [{ tree: createEnhancedCard(23)! }];
cavePlayer.hand = [createEnhancedCard(190)!, createEnhancedCard(24)!];
caveGame.clearing = [createEnhancedCard(25)!, createEnhancedCard(26)!, createEnhancedCard(27)!];
caveGame.playCard('cave', 190, [24], 0, 0, 'top');
acceptAbilities(caveGame, true, false);
assert.equal(caveGame.pendingAction?.kind, 'selectClearingCards');
caveGame.resolvePendingAction('cave', [25, 27]);
assert.deepEqual(cavePlayer.cave.map(card => card.cardId).sort((a, b) => a - b), [25, 27]);
assert.deepEqual(caveGame.clearing.map(card => card.cardId).sort((a, b) => a - b), [24, 26]);

// Female Wild Boar removes its payments and the clearing from the game.
const removalGame = createGame('removal');
const removalPlayer = removalGame.players.get('removal')!;
removalPlayer.forest = [{ tree: createEnhancedCard(23)! }];
removalPlayer.hand = [createEnhancedCard(222)!, createEnhancedCard(24)!, createEnhancedCard(25)!];
removalGame.clearing = [createEnhancedCard(30)!];
removalGame.playCard('removal', 222, [24, 25], 0, 0, 'left');
acceptAbilities(removalGame);
assert.equal(removalGame.clearing.length, 0);
assert.deepEqual(
    removalGame.cardsRemovedFromGame.map(card => card.cardId).sort((a, b) => a - b),
    [24, 25, 30]
);
assert.equal(removalGame.pendingAction?.kind, 'playFreeCard');
removalGame.resolvePendingAction('removal', [], true);

console.log('✅ Clearing lifecycle checks passed');
