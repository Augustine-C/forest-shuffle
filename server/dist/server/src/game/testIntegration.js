"use strict";
/**
 * Integration Test for Forest Shuffle Game Logic
 * Tests card effects, bonuses, and scoring
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const gameState_1 = require("./gameState");
const cards_1 = require("./cards");
function runTest() {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        console.log('🧪 Starting Forest Shuffle Game Logic Integration Test\n');
        // 1. Setup Game
        const game = new gameState_1.GameState(2);
        game.addPlayer('p1', 'Alice');
        game.addPlayer('p2', 'Bob');
        game.startGame();
        const alice = game.players.get('p1');
        const bob = game.players.get('p2');
        console.log(`Initial Alice hand size: ${alice.hand.length}`);
        // 2. Test: Play a Tree (Birch) that has a draw effect
        const birchSpecies = (0, cards_1.getSpeciesData)('Birch');
        console.log(`Birch effect: "${birchSpecies === null || birchSpecies === void 0 ? void 0 : birchSpecies.effect}"`);
        const birchCardId = 41;
        const birchCard = (0, cards_1.createEnhancedCard)(birchCardId);
        alice.hand.push(birchCard); // Inject Birch
        console.log('\n--- Alice plays a Birch (Cost 1) ---');
        // Need to pay 1 card for Birch
        const costCard = alice.hand.find(c => c.cardId !== birchCardId);
        const costCardIds = [costCard.cardId];
        const handSizeBeforePlay = alice.hand.length; // e.g. 7
        game.playCard('p1', birchCardId, costCardIds, 0);
        console.log(`Alice forest size: ${alice.forest.length}`);
        console.log(`Alice hand size after play: ${alice.hand.length}`);
        // Expected: before - 1 (played) - 1 (cost) + 1 (drawn) = before - 1
        if (alice.hand.length === handSizeBeforePlay - 1) {
            console.log('✅ Birch played and effect (Receive 1 card) executed correctly!');
        }
        else {
            console.log(`❌ Birch effect failed. Hand size: ${alice.hand.length}, Expected: ${handSizeBeforePlay - 1}`);
        }
        // 3. Test: Play a split card on a tree
        const blackberriesId = 128; // One of the Blackberries split cards
        const blackberriesCard = (0, cards_1.createEnhancedCard)(blackberriesId);
        alice.hand.push(blackberriesCard);
        const speciesIndex = blackberriesCard.species.findIndex(s => s.name === 'Blackberries');
        console.log(`\n--- Alice plays Blackberries (vCard half) on the Birch ---`);
        console.log(`Playing species index: ${speciesIndex} (${blackberriesCard.species[speciesIndex].name})`);
        game.playCard('p1', blackberriesId, [], speciesIndex, 0, 'bottom');
        const tree = alice.forest[0];
        if (((_a = tree.bottom) === null || _a === void 0 ? void 0 : _a.cardId) === blackberriesId) {
            console.log('✅ Blackberries placed successfully on the Birch!');
        }
        else {
            console.log('❌ Failed to place split card');
        }
        // 4. Test: Scoring
        const pointsText = blackberriesCard.species[speciesIndex].speciesData.points;
        console.log(`Points text: "${pointsText}"`);
        const scores = game.calculateScores();
        const aliceScore = scores.get('p1');
        console.log(`\nAlice score: ${aliceScore}`);
        // Alice has: 1 Birch (0 pts), 1 Blackberries (2 pts per plant).
        // Alice has 1 plant (the blackberries).
        if (aliceScore === 2) {
            console.log('✅ Scoring for plants works correctly!');
        }
        else {
            console.log(`⚠️ Expected 2 points, got ${aliceScore}. Check point rules.`);
        }
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
            if (game.gameEnded && game.winterCardsDrawn === 3) {
                console.log('✅ Game ended correctly after 3 winter cards!');
            }
            else {
                console.log('❌ Game did not end or winter count mismatch');
            }
        }
        console.log('\n🏁 Integration Test Complete!');
    });
}
runTest().catch(console.error);
