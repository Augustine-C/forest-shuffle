/**
 * Verification script for card data integration
 * Run with: npx ts-node src/game/verifyCardData.ts
 */

import {
    CARDS_DATA,
    SPECIES_DATA,
    getCardById,
    getSpeciesData,
    getCardsByDeck,
    getTotalCardCount,
    BASIC_DECK,
    ALPINE_DECK,
    EDGE_DECK,
} from './cardDefinitions';

console.log('🎴 Forest Shuffle Card Data Verification\n');

// Test 1: Total card count
console.log('📊 Card Counts:');
console.log(`  Total cards: ${Object.keys(CARDS_DATA).length}`);
console.log(`  Basic deck: ${getTotalCardCount(['basic'])}`);
console.log(`  Alpine deck: ${getTotalCardCount(['alpine'])}`);
console.log(`  Edge deck: ${getTotalCardCount(['edge'])}`);
console.log();

// Test 2: Species data
console.log('🦌 Species Data:');
console.log(`  Total species: ${Object.keys(SPECIES_DATA).length}`);
console.log();

// Test 3: Sample card lookups
console.log('🔍 Sample Card Lookups:');

const card1 = getCardById(1);
console.log(`  Card #1 (Linden):`, card1);

const card70 = getCardById(70);
console.log(`  Card #70 (Split card):`, card70);

const card162 = getCardById(162);
console.log(`  Card #162 (First Alpine):`, card162);

const card198 = getCardById(198);
console.log(`  Card #198 (First Edge):`, card198);
console.log();

// Test 4: Species lookup
console.log('🦅 Sample Species Lookups:');

const lindSpec = getSpeciesData('Linden');
console.log(`  Linden species:`, lindSpec);

const hareSpec = getSpeciesData('European Hare');
console.log(`  European Hare species:`, hareSpec);
console.log();

// Test 5: Deck filtering
console.log('🃏 Deck Filtering:');
const basicCards = getCardsByDeck([BASIC_DECK]);
const alpineCards = getCardsByDeck([ALPINE_DECK]);
const edgeCards = getCardsByDeck([EDGE_DECK]);

console.log(`  Basic deck cards: ${Object.keys(basicCards).length}`);
console.log(`  Alpine deck cards: ${Object.keys(alpineCards).length}`);
console.log(`  Edge deck cards: ${Object.keys(edgeCards).length}`);
console.log();

// Test 6: Card type distribution
const treeCards = Object.values(CARDS_DATA).filter(c => c.type === 'Tree');
const hCards = Object.values(CARDS_DATA).filter(c => c.type === 'hCard');
const vCards = Object.values(CARDS_DATA).filter(c => c.type === 'vCard');
const wCards = Object.values(CARDS_DATA).filter(c => c.type === 'wCard');

console.log('📋 Card Type Distribution:');
console.log(`  Tree cards: ${treeCards.length}`);
console.log(`  hCard (horizontal): ${hCards.length}`);
console.log(`  vCard (vertical): ${vCards.length}`);
console.log(`  wCard (winter): ${wCards.length}`);
console.log();

console.log('✅ All verification tests completed!');
