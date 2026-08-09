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
game.activePlayerIndex = 0;

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

const pendingGame = new GameState(2);
pendingGame.addPlayer('pending', 'socket-pending', 'Pending Tester', true);
pendingGame.addPlayer('other', 'socket-other', 'Other Tester');
const pendingPlayer = pendingGame.players.get('pending')!;
pendingPlayer.forest = [{ tree: createEnhancedCard(23)! }];
const beardedVulture = createEnhancedCard(190)!;
const pendingPayment = createEnhancedCard(24)!;
const caveCardOne = createEnhancedCard(25)!;
const caveCardTwo = createEnhancedCard(26)!;
pendingPlayer.hand = [beardedVulture, pendingPayment];
pendingGame.clearing = [caveCardOne, caveCardTwo];

pendingGame.playCard('pending', beardedVulture.cardId, [pendingPayment.cardId], 0, 0, 'top');
assert.equal(pendingGame.pendingAction?.kind, 'selectClearingCards');
assert.equal(pendingGame.pendingAction?.destination, 'cave');
assert.equal(pendingGame.pendingAction?.count, 2);
assert.equal(pendingGame.activePlayerIndex, 0, 'a pending selection must keep the active turn open');
assert.throws(
    () => pendingGame.playerDrawsTwo('pending'),
    /Resolve the pending action first/
);
assert.throws(
    () => pendingGame.resolvePendingAction('pending', [caveCardOne.cardId]),
    /Select exactly 2 card/
);
assert.equal(pendingPlayer.cave.length, 0, 'an invalid pending selection must be atomic');

pendingGame.resolvePendingAction('pending', [caveCardOne.cardId, caveCardTwo.cardId]);
assert.deepEqual(
    pendingPlayer.cave.map(card => card.cardId).sort((a, b) => a - b),
    [caveCardOne.cardId, caveCardTwo.cardId].sort((a, b) => a - b)
);
assert.equal(pendingGame.pendingAction, undefined);
assert.equal(pendingGame.activePlayerIndex, 1, 'the turn advances after the final pending action');

const handSelectionGame = new GameState(2);
handSelectionGame.addPlayer('hand', 'socket-hand', 'Hand Tester', true);
handSelectionGame.addPlayer('other', 'socket-other', 'Other Tester');
const handPlayer = handSelectionGame.players.get('hand')!;
handPlayer.forest = [{ tree: createEnhancedCard(23)! }];
const magpie = createEnhancedCard(214)!;
const magpiePayment = createEnhancedCard(24)!;
const marketCard = createEnhancedCard(25)!;
handPlayer.hand = [magpie, magpiePayment];
handSelectionGame.clearing = [marketCard];
handSelectionGame.playCard('hand', magpie.cardId, [magpiePayment.cardId], 0, 0, 'top');
assert.equal(handSelectionGame.pendingAction?.kind, 'selectClearingCards');
assert.equal(
    handSelectionGame.pendingAction?.kind === 'selectClearingCards'
        ? handSelectionGame.pendingAction.destination
        : undefined,
    'hand'
);
handSelectionGame.resolvePendingAction('hand', [marketCard.cardId]);
assert.equal(handPlayer.hand.some(card => card.cardId === marketCard.cardId), true);

const declineGame = new GameState(2);
declineGame.addPlayer('decline', 'socket-decline', 'Decline Tester', true);
declineGame.addPlayer('other', 'socket-other', 'Other Tester');
const declinePlayer = declineGame.players.get('decline')!;
declinePlayer.forest = [{ tree: createEnhancedCard(23)! }];
declinePlayer.hand = [createEnhancedCard(190)!, createEnhancedCard(24)!];
declineGame.clearing = [createEnhancedCard(25)!, createEnhancedCard(26)!];
declineGame.playCard('decline', 190, [24], 0, 0, 'top');
declineGame.resolvePendingAction('decline', [], true);
assert.equal(declinePlayer.cave.length, 0);
assert.equal(declineGame.activePlayerIndex, 1);

const freePlayGame = new GameState(2);
freePlayGame.addPlayer('free', 'socket-free', 'Free Play Tester', true);
freePlayGame.addPlayer('other', 'socket-other', 'Other Tester');
const freePlayer = freePlayGame.players.get('free')!;
freePlayer.forest = [{ tree: createEnhancedCard(23)! }];
const fireSalamander = createEnhancedCard(118)!;
const matchingPayment = createEnhancedCard(56)!;
const brownBear = createEnhancedCard(79)!;
const ineligibleBird = createEnhancedCard(126)!;
const untouchedClearingCard = createEnhancedCard(25)!;
freePlayer.hand = [fireSalamander, matchingPayment, brownBear, ineligibleBird];
freePlayGame.clearing = [untouchedClearingCard];
freePlayGame.playCard('free', fireSalamander.cardId, [matchingPayment.cardId], 1, 0, 'bottom');
assert.equal(freePlayGame.pendingAction?.kind, 'playFreeCard');
assert.equal(
    freePlayGame.pendingAction?.kind === 'playFreeCard' ? freePlayGame.pendingAction.eligibleTag : undefined,
    'Paw'
);
assert.throws(
    () => freePlayGame.playPendingFreeCard('free', ineligibleBird.cardId, 0, 0, 'top'),
    /must have a Paw symbol/
);
assert.equal(freePlayer.hand.includes(ineligibleBird), true, 'an ineligible free play must be atomic');

const clearingCountBeforeFreePlay = freePlayGame.clearing.length;
freePlayGame.playPendingFreeCard('free', brownBear.cardId, 0, 0, 'left');
assert.equal(freePlayer.forest[0].left?.cardId, brownBear.cardId);
assert.equal(freePlayer.cave.length, 0, 'a free card must not execute its effect');
assert.equal(freePlayGame.clearing.length, clearingCountBeforeFreePlay);
assert.equal(freePlayGame.pendingAction, undefined);
assert.equal(freePlayGame.activePlayerIndex, 1);

const squeakerGame = new GameState(2);
squeakerGame.addPlayer('squeaker', 'socket-squeaker', 'Squeaker Tester', true);
squeakerGame.addPlayer('other', 'socket-other', 'Other Tester');
const squeakerPlayer = squeakerGame.players.get('squeaker')!;
squeakerPlayer.forest = [{ tree: createEnhancedCard(23)! }];
const femaleWildBoar = createEnhancedCard(222)!;
const squeaker = createEnhancedCard(99)!;
squeakerPlayer.hand = [femaleWildBoar, createEnhancedCard(24)!, createEnhancedCard(25)!, squeaker];
squeakerGame.playCard('squeaker', femaleWildBoar.cardId, [24, 25], 0, 0, 'left');
assert.equal(
    squeakerGame.pendingAction?.kind === 'playFreeCard' ? squeakerGame.pendingAction.eligibleSpecies : undefined,
    'Squeaker'
);
assert.throws(
    () => squeakerGame.playPendingFreeCard('squeaker', createEnhancedCard(79)!.cardId, 0, 0, 'right'),
    /Card is not in player hand/
);
squeakerGame.playPendingFreeCard('squeaker', squeaker.cardId, 1, 0, 'right');
assert.equal(squeakerPlayer.forest[0].right?.cardId, squeaker.cardId);
assert.equal(squeakerGame.activePlayerIndex, 1);

const repeatableFreePlayGame = new GameState(2);
repeatableFreePlayGame.addPlayer('repeatable', 'socket-repeatable', 'Repeatable Tester', true);
repeatableFreePlayGame.addPlayer('other', 'socket-other', 'Other Tester');
const repeatablePlayer = repeatableFreePlayGame.players.get('repeatable')!;
repeatablePlayer.forest = [
    { tree: createEnhancedCard(23)! },
    { tree: createEnhancedCard(24)! }
];
const gnat = createEnhancedCard(98)!;
const firstBat = createEnhancedCard(71)!;
const secondBat = createEnhancedCard(93)!;
repeatablePlayer.hand = [gnat, firstBat, secondBat];
repeatableFreePlayGame.playCard('repeatable', gnat.cardId, [], 1, 0, 'right');
assert.equal(repeatableFreePlayGame.pendingAction?.kind, 'playFreeCard');
assert.equal(
    repeatableFreePlayGame.pendingAction?.kind === 'playFreeCard'
        ? repeatableFreePlayGame.pendingAction.repeatable
        : undefined,
    true
);
repeatableFreePlayGame.playPendingFreeCard('repeatable', firstBat.cardId, 1, 1, 'right');
assert.equal(repeatablePlayer.forest[1].right?.cardId, firstBat.cardId);
assert.equal(repeatableFreePlayGame.pendingAction?.kind, 'playFreeCard');
assert.equal(repeatableFreePlayGame.activePlayerIndex, 0);
repeatableFreePlayGame.playPendingFreeCard('repeatable', secondBat.cardId, 0, 1, 'left');
assert.equal(repeatablePlayer.forest[1].left?.cardId, secondBat.cardId);
assert.equal(repeatableFreePlayGame.pendingAction?.kind, 'playFreeCard');
repeatableFreePlayGame.resolvePendingAction('repeatable', [], true);
assert.equal(repeatableFreePlayGame.pendingAction, undefined);
assert.equal(repeatableFreePlayGame.activePlayerIndex, 1);

const moleGame = new GameState(2);
moleGame.addPlayer('mole', 'socket-mole', 'Mole Tester', true);
moleGame.addPlayer('other', 'socket-other', 'Other Tester');
const molePlayer = moleGame.players.get('mole')!;
molePlayer.forest = [
    { tree: createEnhancedCard(23)! },
    { tree: createEnhancedCard(24)! }
];
const mole = createEnhancedCard(141)!;
const firstJay = createEnhancedCard(126)!;
const secondJay = createEnhancedCard(137)!;
molePlayer.hand = [
    mole,
    firstJay,
    secondJay,
    createEnhancedCard(30)!,
    createEnhancedCard(31)!,
    createEnhancedCard(32)!,
    createEnhancedCard(33)!
];
moleGame.playCard('mole', mole.cardId, [30, 31], 1, 0, 'bottom');
assert.equal(moleGame.pendingAction?.kind, 'playPaidCards');
assert.throws(
    () => moleGame.playPendingPaidCard('mole', firstJay.cardId, [], 0, 0, 'top'),
    /Payment must contain exactly 1 card/
);
assert.equal(molePlayer.hand.includes(firstJay), true, 'an invalid nested Mole play must be atomic');
moleGame.playPendingPaidCard('mole', firstJay.cardId, [32], 0, 0, 'top');
assert.equal(moleGame.pendingAction?.kind, 'playPaidCards');
moleGame.playPendingPaidCard('mole', secondJay.cardId, [33], 0, 1, 'top');
assert.equal(moleGame.pendingAction?.kind, 'playPaidCards');
moleGame.resolvePendingAction('mole', [], true);
assert.equal(moleGame.activePlayerIndex, 0, 'the first nested extra turn must be preserved');
moleGame.playerDrawsTwo('mole');
assert.equal(moleGame.activePlayerIndex, 0, 'the second nested extra turn must be preserved');
moleGame.playerDrawsTwo('mole');
assert.equal(moleGame.activePlayerIndex, 1, 'play advances after all nested extra turns are used');

const raccoonGame = new GameState(2);
raccoonGame.addPlayer('raccoon', 'socket-raccoon', 'Raccoon Tester', true);
raccoonGame.addPlayer('other', 'socket-other', 'Other Tester');
const raccoonPlayer = raccoonGame.players.get('raccoon')!;
raccoonPlayer.forest = [{ tree: createEnhancedCard(23)! }];
const raccoon = createEnhancedCard(73)!;
const exchangeOne = createEnhancedCard(30)!;
const exchangeTwo = createEnhancedCard(31)!;
raccoonPlayer.hand = [raccoon, createEnhancedCard(32)!, exchangeOne, exchangeTwo];
raccoonGame.deck = [createEnhancedCard(34)!, createEnhancedCard(35)!];
raccoonGame.playCard('raccoon', raccoon.cardId, [32], 0, 0, 'left');
assert.equal(raccoonGame.pendingAction?.kind, 'exchangeHandForDeck');
assert.throws(
    () => raccoonGame.resolvePendingAction('raccoon', [exchangeOne.cardId, exchangeOne.cardId]),
    /duplicate cards/
);
assert.equal(raccoonPlayer.cave.length, 0, 'an invalid Raccoon exchange must be atomic');
assert.equal(raccoonPlayer.hand.includes(exchangeOne), true);
raccoonGame.resolvePendingAction('raccoon', [exchangeOne.cardId, exchangeTwo.cardId]);
assert.deepEqual(
    raccoonPlayer.cave.map(card => card.cardId).sort((a, b) => a - b),
    [exchangeOne.cardId, exchangeTwo.cardId].sort((a, b) => a - b)
);
assert.deepEqual(raccoonPlayer.hand.map(card => card.cardId), [34, 35]);
assert.equal(raccoonGame.activePlayerIndex, 1);

const waterVoleGame = new GameState(2);
waterVoleGame.addPlayer('vole', 'socket-vole', 'Water Vole Tester', true);
waterVoleGame.addPlayer('other', 'socket-other', 'Other Tester');
const waterVolePlayer = waterVoleGame.players.get('vole')!;
waterVolePlayer.forest = [{ tree: createEnhancedCard(23)! }];
const waterVole = createEnhancedCard(213)!;
const firstSapling = createEnhancedCard(32)!;
const secondSapling = createEnhancedCard(33)!;
waterVolePlayer.hand = [
    waterVole,
    createEnhancedCard(30)!,
    createEnhancedCard(31)!,
    firstSapling,
    secondSapling
];
waterVoleGame.deck = [createEnhancedCard(34)!, createEnhancedCard(35)!];
waterVoleGame.playCard('vole', waterVole.cardId, [30, 31], 1, 0, 'bottom');
assert.equal(waterVoleGame.pendingAction?.kind, 'playSaplings');
assert.throws(
    () => waterVoleGame.resolvePendingAction('vole', [firstSapling.cardId, firstSapling.cardId]),
    /duplicate cards/
);
assert.equal(waterVolePlayer.forest.length, 1, 'an invalid sapling selection must be atomic');
waterVoleGame.resolvePendingAction('vole', [firstSapling.cardId, secondSapling.cardId]);
assert.equal(waterVolePlayer.forest.length, 3);
assert.equal(waterVolePlayer.forest.slice(1).every(tree => tree.isSapling), true);
assert.equal(waterVoleGame.clearing.length, 4, 'each Water Vole sapling reveals one clearing card');
assert.equal(waterVoleGame.activePlayerIndex, 1);

const interruptedSaplingGame = new GameState(2);
interruptedSaplingGame.addPlayer('vole', 'socket-vole', 'Interrupted Vole Tester', true);
interruptedSaplingGame.addPlayer('other', 'socket-other', 'Other Tester');
const interruptedVolePlayer = interruptedSaplingGame.players.get('vole')!;
interruptedVolePlayer.forest = [{ tree: createEnhancedCard(23)! }];
interruptedVolePlayer.hand = [
    createEnhancedCard(213)!,
    createEnhancedCard(30)!,
    createEnhancedCard(31)!,
    createEnhancedCard(32)!,
    createEnhancedCard(33)!
];
interruptedSaplingGame.winterCardsDrawn = 2;
interruptedSaplingGame.deck = [winter, createEnhancedCard(34)!];
interruptedSaplingGame.playCard('vole', 213, [30, 31], 1, 0, 'bottom');
interruptedSaplingGame.resolvePendingAction('vole', [32, 33]);
assert.equal(interruptedSaplingGame.gameEnded, true);
assert.equal(interruptedVolePlayer.forest.length, 3, 'all selected saplings are placed before reveals begin');
assert.equal(interruptedSaplingGame.deck[0].cardId, 34, 'reveals stop immediately at the third winter card');
assert.equal(interruptedSaplingGame.pendingAction, undefined);

const takeAllGame = new GameState(2);
takeAllGame.addPlayer('take-all', 'socket-take-all', 'Take All Tester', true);
takeAllGame.addPlayer('other', 'socket-other', 'Other Tester');
const takeAllPlayer = takeAllGame.players.get('take-all')!;
takeAllPlayer.forest = [{ tree: createEnhancedCard(23)! }];
const craneFly = createEnhancedCard(226)!;
const clearingBatOne = createEnhancedCard(71)!;
const clearingBatTwo = createEnhancedCard(93)!;
const clearingNonBat = createEnhancedCard(24)!;
takeAllPlayer.hand = [craneFly, createEnhancedCard(41)!];
takeAllGame.clearing = [clearingBatOne, clearingNonBat, clearingBatTwo];
takeAllGame.playCard('take-all', craneFly.cardId, [41], 1, 0, 'right');
assert.equal(takeAllGame.pendingAction?.kind, 'playFreeCard');
takeAllGame.resolvePendingAction('take-all', [], true);
assert.equal(takeAllGame.pendingAction?.kind, 'takeAllMatching');
assert.equal((takeAllGame.pendingAction as { count?: number } | undefined)?.count, 2);
takeAllGame.resolvePendingAction('take-all');
assert.deepEqual(
    takeAllPlayer.hand.map(card => card.cardId).sort((a, b) => a - b),
    [clearingBatOne.cardId, clearingBatTwo.cardId].sort((a, b) => a - b)
);
assert.deepEqual(takeAllGame.clearing.map(card => card.cardId), [clearingNonBat.cardId, 41]);
assert.equal(takeAllGame.activePlayerIndex, 1);

const permanentTriggerCases: Array<{
    sourceCardId: number;
    sourceSpeciesIndex: number;
    expectedName: string;
    targetCardId: number;
    targetSpeciesIndex: number;
    targetSlot?: 'top' | 'bottom' | 'left' | 'right';
}> = [
    { sourceCardId: 139, sourceSpeciesIndex: 1, expectedName: 'Chanterelle', targetCardId: 1, targetSpeciesIndex: 0 },
    { sourceCardId: 144, sourceSpeciesIndex: 1, expectedName: 'Fly Agaric', targetCardId: 70, targetSpeciesIndex: 0, targetSlot: 'left' },
    { sourceCardId: 150, sourceSpeciesIndex: 1, expectedName: 'Parasol Mushroom', targetCardId: 114, targetSpeciesIndex: 1, targetSlot: 'bottom' },
    { sourceCardId: 145, sourceSpeciesIndex: 1, expectedName: 'Penny Bun', targetCardId: 118, targetSpeciesIndex: 0, targetSlot: 'top' },
    { sourceCardId: 185, sourceSpeciesIndex: 1, expectedName: 'Black Trumpet', targetCardId: 186, targetSpeciesIndex: 1, targetSlot: 'bottom' },
    { sourceCardId: 206, sourceSpeciesIndex: 0, expectedName: 'Blackthorn', targetCardId: 118, targetSpeciesIndex: 0, targetSlot: 'top' },
    { sourceCardId: 202, sourceSpeciesIndex: 0, expectedName: 'Common Hazel', targetCardId: 71, targetSpeciesIndex: 1, targetSlot: 'right' },
    { sourceCardId: 198, sourceSpeciesIndex: 0, expectedName: 'Elderberry', targetCardId: 114, targetSpeciesIndex: 1, targetSlot: 'bottom' }
];

permanentTriggerCases.forEach((testCase, caseIndex) => {
    const triggerGame = new GameState(2);
    triggerGame.addPlayer('trigger', 'socket-trigger', 'Trigger Tester', true);
    triggerGame.addPlayer('other', 'socket-other', 'Other Tester');
    const triggerPlayer = triggerGame.players.get('trigger')!;
    const sourceCard = createEnhancedCard(testCase.sourceCardId)!;
    const sourceIsShrub = sourceCard.orientation === 'Tree';
    triggerPlayer.forest = sourceIsShrub
        ? [{ tree: sourceCard }, { tree: createEnhancedCard(2)! }]
        : [{
            tree: createEnhancedCard(2)!,
            bottom: sourceCard,
            speciesIndices: { bottom: testCase.sourceSpeciesIndex }
        }, { tree: createEnhancedCard(3)! }];
    const targetCard = createEnhancedCard(testCase.targetCardId)!;
    const targetCost = targetCard.species[testCase.targetSpeciesIndex].speciesData.cost;
    const payments = Array.from({ length: targetCost }, (_, index) => createEnhancedCard(40 + caseIndex * 3 + index)!);
    triggerPlayer.hand = [targetCard, ...payments];
    triggerGame.deck = [createEnhancedCard(34)!, createEnhancedCard(35)!, createEnhancedCard(36)!];
    triggerGame.playCard(
        'trigger',
        targetCard.cardId,
        payments.map(card => card.cardId),
        testCase.targetSpeciesIndex,
        testCase.targetSlot ? 1 : undefined,
        testCase.targetSlot
    );
    assert.equal(triggerGame.pendingAction?.kind, 'triggeredDraws', `${testCase.expectedName} must trigger`);
    assert.equal(
        triggerGame.pendingAction?.kind === 'triggeredDraws'
            ? triggerGame.pendingAction.triggers[0]?.sourceName
            : undefined,
        testCase.expectedName
    );
    triggerGame.resolvePendingAction('trigger', [], true);
});

const orderedTriggerGame = new GameState(2);
orderedTriggerGame.addPlayer('ordered', 'socket-ordered', 'Ordered Trigger Tester', true);
orderedTriggerGame.addPlayer('other', 'socket-other', 'Other Tester');
const orderedPlayer = orderedTriggerGame.players.get('ordered')!;
orderedPlayer.forest = [
    { tree: createEnhancedCard(1)!, bottom: createEnhancedCard(139)!, speciesIndices: { bottom: 1 } },
    { tree: createEnhancedCard(2)!, bottom: createEnhancedCard(158)!, speciesIndices: { bottom: 1 } }
];
orderedPlayer.hand = [createEnhancedCard(23)!];
orderedTriggerGame.deck = [
    createEnhancedCard(34)!,
    createEnhancedCard(35)!,
    createEnhancedCard(36)!,
    createEnhancedCard(37)!
];
orderedTriggerGame.playCard('ordered', 23, [], 0);
assert.equal(orderedTriggerGame.pendingAction?.kind, 'triggeredDraws');
const orderedAction = orderedTriggerGame.pendingAction;
assert.equal(orderedAction?.kind === 'triggeredDraws' ? orderedAction.triggers.length : 0, 2);
orderedTriggerGame.resolvePendingAction('ordered', [], false, '158:1');
assert.deepEqual(orderedPlayer.hand.map(card => card.cardId), [35]);
assert.deepEqual(
    orderedTriggerGame.pendingAction?.kind === 'triggeredDraws'
        ? orderedTriggerGame.pendingAction.triggers.map(trigger => trigger.id)
        : [],
    ['139:1']
);
orderedTriggerGame.resolvePendingAction('ordered', [], false, '139:1');
assert.deepEqual(orderedPlayer.hand.map(card => card.cardId), [35, 36, 37]);
assert.equal(orderedTriggerGame.activePlayerIndex, 1);

const delayedTriggerGame = new GameState(2);
delayedTriggerGame.addPlayer('delayed', 'socket-delayed', 'Delayed Trigger Tester', true);
delayedTriggerGame.addPlayer('other', 'socket-other', 'Other Tester');
const delayedPlayer = delayedTriggerGame.players.get('delayed')!;
delayedPlayer.forest = [{
    tree: createEnhancedCard(1)!,
    bottom: createEnhancedCard(139)!,
    speciesIndices: { bottom: 1 },
    slotPlayedTurns: { bottom: 0 }
}];
delayedPlayer.hand = [createEnhancedCard(23)!];
delayedTriggerGame.deck = [createEnhancedCard(34)!, createEnhancedCard(35)!];
delayedTriggerGame.playCard('delayed', 23, [], 0);
assert.equal(delayedTriggerGame.pendingAction, undefined, 'Chanterelle starts triggering on the next turn');

const winterTriggerGame = new GameState(2);
winterTriggerGame.addPlayer('winter-trigger', 'socket-winter-trigger', 'Winter Trigger Tester', true);
winterTriggerGame.addPlayer('other', 'socket-other', 'Other Tester');
const winterTriggerPlayer = winterTriggerGame.players.get('winter-trigger')!;
winterTriggerPlayer.forest = [
    { tree: createEnhancedCard(1)!, bottom: createEnhancedCard(144)!, speciesIndices: { bottom: 1 } },
    { tree: createEnhancedCard(2)!, bottom: createEnhancedCard(157)!, speciesIndices: { bottom: 1 } }
];
winterTriggerPlayer.hand = [createEnhancedCard(70)!];
winterTriggerGame.winterCardsDrawn = 2;
winterTriggerGame.deck = [winter, createEnhancedCard(34)!];
winterTriggerGame.playCard('winter-trigger', 70, [], 0, 0, 'left');
const winterTriggerAction = winterTriggerGame.pendingAction;
assert.equal(winterTriggerAction?.kind === 'triggeredDraws' ? winterTriggerAction.triggers.length : 0, 2);
winterTriggerGame.resolvePendingAction(
    'winter-trigger',
    [],
    false,
    winterTriggerAction?.kind === 'triggeredDraws' ? winterTriggerAction.triggers[0].id : undefined
);
assert.equal(winterTriggerGame.gameEnded, true);
assert.equal(winterTriggerGame.pendingAction, undefined);
assert.equal(winterTriggerGame.deck[0].cardId, 34, 'resolution stops after a trigger reveals the third winter card');

const voleChanterelleGame = new GameState(2);
voleChanterelleGame.addPlayer('vole-trigger', 'socket-vole-trigger', 'Vole Chanterelle Tester', true);
voleChanterelleGame.addPlayer('other', 'socket-other', 'Other Tester');
const voleChanterellePlayer = voleChanterelleGame.players.get('vole-trigger')!;
voleChanterellePlayer.forest = [{
    tree: createEnhancedCard(1)!,
    bottom: createEnhancedCard(139)!,
    speciesIndices: { bottom: 1 }
}, { tree: createEnhancedCard(2)! }];
voleChanterellePlayer.hand = [
    createEnhancedCard(213)!,
    createEnhancedCard(30)!,
    createEnhancedCard(31)!,
    createEnhancedCard(32)!,
    createEnhancedCard(33)!
];
voleChanterelleGame.deck = [
    createEnhancedCard(34)!,
    createEnhancedCard(35)!,
    createEnhancedCard(36)!,
    createEnhancedCard(37)!
];
voleChanterelleGame.playCard('vole-trigger', 213, [30, 31], 1, 1, 'bottom');
voleChanterelleGame.resolvePendingAction('vole-trigger', [32, 33]);
assert.equal(voleChanterelleGame.clearing.length, 4, 'Water Vole reveals happen before Chanterelle draws');
const voleTriggers = voleChanterelleGame.pendingAction;
assert.equal(voleTriggers?.kind === 'triggeredDraws' ? voleTriggers.triggers.length : 0, 2);
if (voleChanterelleGame.pendingAction?.kind === 'triggeredDraws') {
    voleChanterelleGame.resolvePendingAction(
        'vole-trigger', [], false, voleChanterelleGame.pendingAction.triggers[0].id
    );
}
if (voleChanterelleGame.pendingAction?.kind === 'triggeredDraws') {
    voleChanterelleGame.resolvePendingAction(
        'vole-trigger', [], false, voleChanterelleGame.pendingAction.triggers[0].id
    );
}
assert.deepEqual(voleChanterellePlayer.hand.map(card => card.cardId), [36, 37]);
assert.equal(voleChanterelleGame.activePlayerIndex, 1);

const suppressedEffectTriggerGame = new GameState(2);
suppressedEffectTriggerGame.addPlayer('suppressed', 'socket-suppressed', 'Suppressed Effect Tester', true);
suppressedEffectTriggerGame.addPlayer('other', 'socket-other', 'Other Tester');
const suppressedPlayer = suppressedEffectTriggerGame.players.get('suppressed')!;
suppressedPlayer.forest = [
    { tree: createEnhancedCard(1)!, bottom: createEnhancedCard(144)!, speciesIndices: { bottom: 1 } },
    { tree: createEnhancedCard(2)! }
];
suppressedPlayer.hand = [createEnhancedCard(118)!, createEnhancedCard(56)!, createEnhancedCard(79)!];
suppressedEffectTriggerGame.deck = [createEnhancedCard(34)!];
suppressedEffectTriggerGame.playCard('suppressed', 118, [56], 1, 1, 'bottom');
assert.equal(suppressedEffectTriggerGame.pendingAction?.kind, 'playFreeCard');
suppressedEffectTriggerGame.playPendingFreeCard('suppressed', 79, 0, 0, 'left');
assert.equal(suppressedEffectTriggerGame.pendingAction?.kind, 'triggeredDraws');
const suppressedTrigger = suppressedEffectTriggerGame.pendingAction;
const suppressedTriggerId = (suppressedTrigger as { triggers?: Array<{ id: string }> } | undefined)
    ?.triggers?.[0]?.id;
suppressedEffectTriggerGame.resolvePendingAction(
    'suppressed',
    [],
    false,
    suppressedTriggerId
);
assert.deepEqual(suppressedPlayer.hand.map(card => card.cardId), [34]);
assert.equal(suppressedPlayer.cave.length, 0, 'the free Brown Bear must not use its own effect');
assert.equal(suppressedEffectTriggerGame.activePlayerIndex, 1);

console.log('✅ Game action validation checks passed');
