"use strict";
/**
 * Card data using complete Forest Shuffle database
 * Replaces placeholder data with full 233-card dataset
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CARD_DEFINITIONS = void 0;
exports.getCardDefinitions = getCardDefinitions;
const cards_1 = require("./cards");
const cardDefinitions_1 = require("./cardDefinitions");
/**
 * Get card definitions for specified decks
 * Defaults to basic deck only
 */
function getCardDefinitions(includedDecks = [cardDefinitions_1.BASIC_DECK]) {
    return (0, cards_1.getEnhancedCards)(includedDecks);
}
/**
 * Legacy CARD_DEFINITIONS export for backward compatibility
 * Returns enhanced cards wrapped in basic GameCard format
 * Note: This is a simplified conversion - full game logic should use EnhancedCard
 */
exports.CARD_DEFINITIONS = [];
// Log card data stats
const basicCards = (0, cards_1.getEnhancedCards)([cardDefinitions_1.BASIC_DECK]);
const allCards = (0, cards_1.getEnhancedCards)([cardDefinitions_1.BASIC_DECK, cardDefinitions_1.ALPINE_DECK, cardDefinitions_1.EDGE_DECK]);
console.log(`📊 Card Data Loaded:`);
console.log(`  - Basic deck: ${basicCards.length} cards`);
console.log(`  - Total (all decks): ${allCards.length} cards`);
