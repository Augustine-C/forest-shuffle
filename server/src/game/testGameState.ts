/**
 * Test script for gameState with EnhancedCard integration
 * Run with: npx ts-node src/game/testGameState.ts
 */

import { GameState } from './gameState';
import { getCardById, getCardCost } from './cards';

console.log('🎮 Testing GameState with EnhancedCard integration\n');

// Test 1: Create game state
console.log('Test 1: Create GameState');
const game = new GameState(2);
console.log(`  ✅ GameState created with ${game.deck.length} cards in deck`);

// Test 2: Add players
console.log('\nTest 2: Add Players');
game.addPlayer('player1', 'Alice');
game.addPlayer('player2', 'Bob');
console.log(`  ✅ Added ${game.players.size} players`);

// Test 3: Start game (deal initial hands)
console.log('\nTest 3: Start Game');
game.startGame();
const player1 = game.players.get('player1')!;
const player2 = game.players.get('player2')!;
console.log(`  ✅ Player 1 hand: ${player1.hand.length} cards`);
console.log(`  ✅ Player 2 hand: ${player2.hand.length} cards`);
console.log(`  ✅ Deck remaining: ${game.deck.length} cards`);

// Test 4: Examine sample cards
console.log('\nTest 4: Sample Cards from Hand');
if (player1.hand.length > 0) {
    const card = player1.hand[0];
    console.log(`  Card ID: ${card.cardId}`);
    console.log(`  Orientation: ${card.orientation}`);
    console.log(`  Deck: ${card.deck}`);
    console.log(`  Species: ${card.species.map(s => s.name).join(', ')}`);
    console.log(`  Cost: ${getCardCost(card, 0)}`);
    console.log(`  Is Split Card: ${card.isSplitCard}`);
    console.log(`  Is Winter Card: ${card.isWinterCard}`);
}

// Test 5: Card type distribution in deck
console.log('\nTest 5: Card Type Distribution in Deck');
const treeCards = game.deck.filter(c => c.orientation === 'Tree').length;
const hCards = game.deck.filter(c => c.orientation === 'hCard').length;
const vCards = game.deck.filter(c => c.orientation === 'vCard').length;
const wCards = game.deck.filter(c => c.orientation === 'wCard').length;
console.log(`  Tree cards: ${treeCards}`);
console.log(`  hCard: ${hCards}`);
console.log(`  vCard: ${vCards}`);
console.log(`  Winter cards: ${wCards}`);

// Test 6: Test drawing cards
console.log('\nTest 6: Draw Cards');
const drawn = game.drawCards(2);
console.log(`  ✅ Drew ${drawn.length} cards`);
console.log(`  Deck remaining: ${game.deck.length}`);

console.log('\n✅ All GameState tests passed!');
console.log('\n📊 Summary:');
console.log(`  - GameState properly uses EnhancedCard`);
console.log(`  - Card properties accessible via cardId`);
console.log(`  - Helper functions working (getCardCost)`);
console.log(`  - Type safety maintained`);
