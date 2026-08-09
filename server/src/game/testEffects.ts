import assert from 'node:assert/strict';
import { createEnhancedCard } from './cards';
import { GameState } from './gameState';

interface AbilityChoiceCase {
    name: string;
    useEffect: boolean;
    useBonus: boolean;
    expectedDraws: number;
}

const abilityChoiceCases: AbilityChoiceCase[] = [
    { name: 'decline effect and bonus', useEffect: false, useBonus: false, expectedDraws: 0 },
    { name: 'use effect and decline bonus', useEffect: true, useBonus: false, expectedDraws: 1 },
    { name: 'decline effect and use bonus', useEffect: false, useBonus: true, expectedDraws: 2 },
    { name: 'use effect and bonus', useEffect: true, useBonus: true, expectedDraws: 3 }
];

abilityChoiceCases.forEach(({ name, useEffect, useBonus, expectedDraws }) => {
    const game = new GameState(2);
    game.addPlayer('choice', 'socket-choice', 'Choice Tester', true);
    game.addPlayer('other', 'socket-other', 'Other Tester');
    const player = game.players.get('choice')!;
    player.forest = [{ tree: createEnhancedCard(1)!, isSapling: true }];
    player.hand = [createEnhancedCard(145)!, createEnhancedCard(24)!, createEnhancedCard(25)!];
    game.deck = [createEnhancedCard(34)!, createEnhancedCard(35)!, createEnhancedCard(36)!];

    game.playCard('choice', 145, [24, 25], 0, 0, 'top');
    const action = game.pendingAction;
    assert.equal(action?.kind, 'chooseCardEffectAndBonus', name);
    assert.equal(action?.effectText, 'Receive 1 card', name);
    assert.equal(action?.bonusText, 'Receive 2 cards', name);

    game.resolvePendingAction('choice', [], false, undefined, useEffect, useBonus);

    assert.equal(player.hand.length, expectedDraws, name);
    assert.equal(game.activePlayerIndex, 1, `${name} must finish the turn`);
    assert.equal(game.pendingAction, undefined, `${name} must resolve the choice`);
});

console.log('✅ Effect and bonus use/decline checks passed');
