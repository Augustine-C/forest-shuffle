"use strict";
/**
 * Deck creation using complete Forest Shuffle card database
 * Updated to work with EnhancedCard system
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDeck = createDeck;
exports.drawInitialHand = drawInitialHand;
exports.drawCards = drawCards;
const cards_1 = require("./cards");
const cardDefinitions_1 = require("./cardDefinitions");
/**
 * Create a shuffled deck for specified number of players
 * Uses complete card database from cardDefinitions
 *
 * @param playerCount Number of players (2-5)
 * @param includedDecks Which expansion decks to include (default: basic only)
 * @returns Shuffled deck with winter cards in bottom third
 */
function createDeck(playerCount, includedDecks = [cardDefinitions_1.BASIC_DECK]) {
    // Get all cards for selected decks
    let rawDeck = (0, cards_1.getEnhancedCards)(includedDecks);
    // Filter out winter cards (handled separately)
    const normalCards = rawDeck.filter(card => !card.isWinterCard);
    // Shuffle the deck
    let shuffledDeck = shuffle([...normalCards]);
    // Remove cards based on player count
    // 2p: remove 30, 3p: remove 20, 4p: remove 10, 5p: remove 0
    let removeCount = 0;
    if (playerCount === 2)
        removeCount = 30;
    else if (playerCount === 3)
        removeCount = 20;
    else if (playerCount === 4)
        removeCount = 10;
    if (removeCount > 0 && shuffledDeck.length > removeCount) {
        // "Return to box" - remove from beginning (already shuffled)
        shuffledDeck = shuffledDeck.slice(removeCount);
    }
    // Prepare Winter Cards (3 cards)
    const winterCards = rawDeck.filter(card => card.isWinterCard);
    // Divide deck into thirds
    const thirdSize = Math.floor(shuffledDeck.length / 3);
    const pile1 = shuffledDeck.slice(0, thirdSize);
    const pile2 = shuffledDeck.slice(thirdSize, thirdSize * 2);
    let pile3 = shuffledDeck.slice(thirdSize * 2);
    // Add Winter cards to Pile 3 and shuffle
    pile3.push(...winterCards);
    pile3 = shuffle(pile3);
    // Stack: Pile 1 (top) -> Pile 2 -> Pile 3 (bottom with winter cards)
    return [...pile1, ...pile2, ...pile3];
}
/**
 * Fisher-Yates shuffle algorithm
 */
function shuffle(array) {
    const shuffled = [...array];
    let currentIndex = shuffled.length;
    while (currentIndex !== 0) {
        const randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [shuffled[currentIndex], shuffled[randomIndex]] = [
            shuffled[randomIndex],
            shuffled[currentIndex],
        ];
    }
    return shuffled;
}
/**
 * Get initial hand for a player (usually 6 cards)
 */
function drawInitialHand(deck, handSize = 6) {
    const hand = deck.slice(0, handSize);
    const remainingDeck = deck.slice(handSize);
    return { hand, remainingDeck };
}
/**
 * Draw cards from deck
 */
function drawCards(deck, count) {
    const drawn = deck.slice(0, count);
    const remainingDeck = deck.slice(count);
    return { drawn, remainingDeck };
}
