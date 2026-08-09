/**
 * Card data using complete Forest Shuffle database
 * Replaces placeholder data with full 233-card dataset
 */

import { getEnhancedCards, EnhancedCard, GameCard } from './cards';
import { BASIC_DECK, ALPINE_DECK, EDGE_DECK, type DeckType } from './cardDefinitions';

/**
 * Get card definitions for specified decks
 * Defaults to basic deck only
 */
export function getCardDefinitions(includedDecks: DeckType[] = [BASIC_DECK]): EnhancedCard[] {
    return getEnhancedCards(includedDecks);
}

/**
 * Legacy CARD_DEFINITIONS export for backward compatibility
 * Returns enhanced cards wrapped in basic GameCard format
 * Note: This is a simplified conversion - full game logic should use EnhancedCard
 */
export const CARD_DEFINITIONS: GameCard[] = [];

// Log card data stats
const basicCards = getEnhancedCards([BASIC_DECK]);
const allCards = getEnhancedCards([BASIC_DECK, ALPINE_DECK, EDGE_DECK]);

console.log(`📊 Card Data Loaded:`);
console.log(`  - Basic deck: ${basicCards.length} cards`);
console.log(`  - Total (all decks): ${allCards.length} cards`);
