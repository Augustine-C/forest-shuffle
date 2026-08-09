"use strict";
/**
 * Verification script for card data integration
 * Run with: npx ts-node src/game/verifyCardData.ts
 */
Object.defineProperty(exports, "__esModule", { value: true });
const cardDefinitions_1 = require("./cardDefinitions");
console.log('🎴 Forest Shuffle Card Data Verification\n');
// Test 1: Total card count
console.log('📊 Card Counts:');
console.log(`  Total cards: ${Object.keys(cardDefinitions_1.CARDS_DATA).length}`);
console.log(`  Basic deck: ${(0, cardDefinitions_1.getTotalCardCount)(['basic'])}`);
console.log(`  Alpine deck: ${(0, cardDefinitions_1.getTotalCardCount)(['alpine'])}`);
console.log(`  Edge deck: ${(0, cardDefinitions_1.getTotalCardCount)(['edge'])}`);
console.log();
// Test 2: Species data
console.log('🦌 Species Data:');
console.log(`  Total species: ${Object.keys(cardDefinitions_1.SPECIES_DATA).length}`);
console.log();
// Test 3: Sample card lookups
console.log('🔍 Sample Card Lookups:');
const card1 = (0, cardDefinitions_1.getCardById)(1);
console.log(`  Card #1 (Linden):`, card1);
const card70 = (0, cardDefinitions_1.getCardById)(70);
console.log(`  Card #70 (Split card):`, card70);
const card162 = (0, cardDefinitions_1.getCardById)(162);
console.log(`  Card #162 (First Alpine):`, card162);
const card198 = (0, cardDefinitions_1.getCardById)(198);
console.log(`  Card #198 (First Edge):`, card198);
console.log();
// Test 4: Species lookup
console.log('🦅 Sample Species Lookups:');
const lindSpec = (0, cardDefinitions_1.getSpeciesData)('Linden');
console.log(`  Linden species:`, lindSpec);
const hareSpec = (0, cardDefinitions_1.getSpeciesData)('European Hare');
console.log(`  European Hare species:`, hareSpec);
console.log();
// Test 5: Deck filtering
console.log('🃏 Deck Filtering:');
const basicCards = (0, cardDefinitions_1.getCardsByDeck)([cardDefinitions_1.BASIC_DECK]);
const alpineCards = (0, cardDefinitions_1.getCardsByDeck)([cardDefinitions_1.ALPINE_DECK]);
const edgeCards = (0, cardDefinitions_1.getCardsByDeck)([cardDefinitions_1.EDGE_DECK]);
console.log(`  Basic deck cards: ${Object.keys(basicCards).length}`);
console.log(`  Alpine deck cards: ${Object.keys(alpineCards).length}`);
console.log(`  Edge deck cards: ${Object.keys(edgeCards).length}`);
console.log();
// Test 6: Card type distribution
const treeCards = Object.values(cardDefinitions_1.CARDS_DATA).filter(c => c.type === 'Tree');
const hCards = Object.values(cardDefinitions_1.CARDS_DATA).filter(c => c.type === 'hCard');
const vCards = Object.values(cardDefinitions_1.CARDS_DATA).filter(c => c.type === 'vCard');
const wCards = Object.values(cardDefinitions_1.CARDS_DATA).filter(c => c.type === 'wCard');
console.log('📋 Card Type Distribution:');
console.log(`  Tree cards: ${treeCards.length}`);
console.log(`  hCard (horizontal): ${hCards.length}`);
console.log(`  vCard (vertical): ${vCards.length}`);
console.log(`  wCard (winter): ${wCards.length}`);
console.log();
console.log('✅ All verification tests completed!');
