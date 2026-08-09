/**
 * Integration Test for Forest Shuffle Game Logic
 * Tests card effects, bonuses, and scoring
 */

import { GameState } from './gameState';
import { createEnhancedCard, getSpeciesData } from './cards';
import assert from 'node:assert/strict';

function acceptCardChoices(game: GameState) {
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

async function runTest() {
    console.log('🧪 Starting Forest Shuffle Game Logic Integration Test\n');

    // 1. Setup Game
    const game = new GameState(2);
    game.addPlayer('p1', 'socket1', 'Alice', true);
    game.addPlayer('p2', 'socket2', 'Bob');
    game.startGame();

    const alice = game.players.get('p1')!;
    const bob = game.players.get('p2')!;

    console.log(`Initial Alice hand size: ${alice.hand.length}`);

    // 2. Test: Play a Tree (Birch) that has a draw effect
    const birchSpecies = getSpeciesData('Birch');
    console.log(`Birch effect: "${birchSpecies?.effect}"`);

    const birchCardId = 41;
    const birchCard = createEnhancedCard(birchCardId)!;
    alice.hand.push(birchCard); // Inject Birch

    console.log('\n--- Alice plays a Birch (Cost 1) ---');
    // Need to pay 1 card for Birch
    const costCard = alice.hand.find(c => c.cardId !== birchCardId)!;
    const costCardIds = [costCard.cardId];

    const handSizeBeforePlay = alice.hand.length; // e.g. 7
    game.playCard('p1', birchCardId, costCardIds, 0);
    acceptCardChoices(game);

    console.log(`Alice forest size: ${alice.forest.length}`);
    console.log(`Alice hand size after play: ${alice.hand.length}`);
    // Expected: before - 1 (played) - 1 (cost) + 1 (drawn) = before - 1

    assert.equal(alice.hand.length, handSizeBeforePlay - 1);
    console.log('✅ Birch played and effect (Receive 1 card) executed correctly!');

    // 3. Test: Play a split card on a tree
    const blackberriesId = 128; // One of the Blackberries split cards
    const blackberriesCard = createEnhancedCard(blackberriesId)!;
    alice.hand.push(blackberriesCard);

    const speciesIndex = blackberriesCard.species.findIndex(s => s.name === 'Blackberries');
    console.log(`\n--- Alice plays Blackberries (vCard half) on the Birch ---`);
    console.log(`Playing species index: ${speciesIndex} (${blackberriesCard.species[speciesIndex].name})`);

    game.activePlayerIndex = 0;
    game.playCard('p1', blackberriesId, [], speciesIndex, 0, 'bottom');

    const tree = alice.forest[0];
    assert.equal(tree.bottom?.[0].card.cardId, blackberriesId);
    assert.equal(tree.bottom?.[0].speciesIndex, speciesIndex);
    console.log('✅ Blackberries placed successfully on the Birch!');

    // 4. Test: Scoring
    const pointsText = blackberriesCard.species[speciesIndex].speciesData.points;
    console.log(`Points text: "${pointsText}"`);

    const scores = game.calculateScores();
    const aliceScore = scores.get('p1');
    console.log(`\nAlice score: ${aliceScore}`);

    // Alice has: 1 Birch (0 pts), 1 Blackberries (2 pts per plant).
    // Alice has 1 plant (the blackberries).
    assert.equal(aliceScore, 2);
    console.log('✅ Scoring for plants works correctly!');

    // 5. Test: Winter cards
    console.log('\n--- Testing Winter Card Detection ---');
    const winterCard = game.deck.find(c => c.isWinterCard);
    if (winterCard) {
        console.log(`Clearing ${game.deck.length} cards and putting 3 winter cards on top...`);
        game.deck = [winterCard, winterCard, winterCard];

        console.log('Drawing 3 cards one by one...');
        game.drawCards(3);

        console.log(`Winter cards drawn: ${game.winterCardsDrawn}`);
        console.log(`Game ended: ${game.gameEnded}`);

        assert.equal(game.gameEnded, true);
        assert.equal(game.winterCardsDrawn, 3);
        assert.equal(alice.hand.some(card => card.isWinterCard), false);
        console.log('✅ Game ended correctly after 3 winter cards!');
    }

    console.log('\n🏁 Integration Test Complete!');
}

runTest().catch(console.error);
