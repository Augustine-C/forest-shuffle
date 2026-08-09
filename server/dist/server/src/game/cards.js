"use strict";
/**
 * Enhanced card type definitions integrating reference card data
 * Maintains backward compatibility while adding support for complete card database
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SLOT_SCORE = exports.WITH_OTHERS = exports.EDGE_DECK = exports.ALPINE_DECK = exports.BASIC_DECK = exports.SHRUB = exports.EDGE = exports.MOUNTAIN = exports.CLOVEN = exports.PLANT = exports.AMPHIBIAN = exports.PAW = exports.BAT = exports.BIRD = exports.MUSHROOM = exports.INSECT = exports.BUTTERFLY = exports.TREE = exports.H_CARD = exports.V_CARD = exports.W_CARD = exports.getTotalCardCount = exports.getCardsByDeck = exports.getSpeciesData = exports.getCardById = exports.SPECIES_DATA = exports.CARDS_DATA = void 0;
exports.createEnhancedCard = createEnhancedCard;
exports.getEnhancedCards = getEnhancedCards;
exports.getCardCost = getCardCost;
exports.getCardEffect = getCardEffect;
exports.getCardBonus = getCardBonus;
exports.getCardPoints = getCardPoints;
// Re-export all types and data from cardDefinitions
var cardDefinitions_1 = require("./cardDefinitions");
Object.defineProperty(exports, "CARDS_DATA", { enumerable: true, get: function () { return cardDefinitions_1.CARDS_DATA; } });
Object.defineProperty(exports, "SPECIES_DATA", { enumerable: true, get: function () { return cardDefinitions_1.SPECIES_DATA; } });
Object.defineProperty(exports, "getCardById", { enumerable: true, get: function () { return cardDefinitions_1.getCardById; } });
Object.defineProperty(exports, "getSpeciesData", { enumerable: true, get: function () { return cardDefinitions_1.getSpeciesData; } });
Object.defineProperty(exports, "getCardsByDeck", { enumerable: true, get: function () { return cardDefinitions_1.getCardsByDeck; } });
Object.defineProperty(exports, "getTotalCardCount", { enumerable: true, get: function () { return cardDefinitions_1.getTotalCardCount; } });
// Constants
Object.defineProperty(exports, "W_CARD", { enumerable: true, get: function () { return cardDefinitions_1.W_CARD; } });
Object.defineProperty(exports, "V_CARD", { enumerable: true, get: function () { return cardDefinitions_1.V_CARD; } });
Object.defineProperty(exports, "H_CARD", { enumerable: true, get: function () { return cardDefinitions_1.H_CARD; } });
Object.defineProperty(exports, "TREE", { enumerable: true, get: function () { return cardDefinitions_1.TREE; } });
Object.defineProperty(exports, "BUTTERFLY", { enumerable: true, get: function () { return cardDefinitions_1.BUTTERFLY; } });
Object.defineProperty(exports, "INSECT", { enumerable: true, get: function () { return cardDefinitions_1.INSECT; } });
Object.defineProperty(exports, "MUSHROOM", { enumerable: true, get: function () { return cardDefinitions_1.MUSHROOM; } });
Object.defineProperty(exports, "BIRD", { enumerable: true, get: function () { return cardDefinitions_1.BIRD; } });
Object.defineProperty(exports, "BAT", { enumerable: true, get: function () { return cardDefinitions_1.BAT; } });
Object.defineProperty(exports, "PAW", { enumerable: true, get: function () { return cardDefinitions_1.PAW; } });
Object.defineProperty(exports, "AMPHIBIAN", { enumerable: true, get: function () { return cardDefinitions_1.AMPHIBIAN; } });
Object.defineProperty(exports, "PLANT", { enumerable: true, get: function () { return cardDefinitions_1.PLANT; } });
Object.defineProperty(exports, "CLOVEN", { enumerable: true, get: function () { return cardDefinitions_1.CLOVEN; } });
Object.defineProperty(exports, "MOUNTAIN", { enumerable: true, get: function () { return cardDefinitions_1.MOUNTAIN; } });
Object.defineProperty(exports, "EDGE", { enumerable: true, get: function () { return cardDefinitions_1.EDGE; } });
Object.defineProperty(exports, "SHRUB", { enumerable: true, get: function () { return cardDefinitions_1.SHRUB; } });
Object.defineProperty(exports, "BASIC_DECK", { enumerable: true, get: function () { return cardDefinitions_1.BASIC_DECK; } });
Object.defineProperty(exports, "ALPINE_DECK", { enumerable: true, get: function () { return cardDefinitions_1.ALPINE_DECK; } });
Object.defineProperty(exports, "EDGE_DECK", { enumerable: true, get: function () { return cardDefinitions_1.EDGE_DECK; } });
Object.defineProperty(exports, "WITH_OTHERS", { enumerable: true, get: function () { return cardDefinitions_1.WITH_OTHERS; } });
Object.defineProperty(exports, "SLOT_SCORE", { enumerable: true, get: function () { return cardDefinitions_1.SLOT_SCORE; } });
const cardDefinitions_2 = require("./cardDefinitions");
/**
 * Convert reference card data to enhanced card format
 */
function createEnhancedCard(cardId) {
    const cardData = cardDefinitions_2.CARDS_DATA[cardId];
    if (!cardData)
        return null;
    const isWinterCard = cardData.type === 'wCard';
    const isSplitCard = cardData.type === 'hCard' || cardData.type === 'vCard';
    // Build species information
    const species = cardData.species
        .filter(name => name) // Filter empty species names (winter cards)
        .map((name, index) => {
        const speciesData = (0, cardDefinitions_2.getSpeciesData)(name);
        return {
            name,
            speciesData: speciesData || {
                name,
                nb: 0,
                tags: [],
                cost: 0,
                type: cardData.type,
                effect: '',
                bonus: '',
                points: '',
            },
            treeSymbol: (cardData.tree_symbol && cardData.tree_symbol[index]) || '',
        };
    });
    return {
        cardId,
        cardData,
        orientation: cardData.type,
        deck: cardData.deck,
        species,
        isWinterCard,
        isSplitCard,
    };
}
/**
 * Get all enhanced cards for specific decks
 */
function getEnhancedCards(includedDecks = ['basic']) {
    return Object.keys(cardDefinitions_2.CARDS_DATA)
        .map(Number)
        .filter(cardId => {
        const card = cardDefinitions_2.CARDS_DATA[cardId];
        return includedDecks.includes(card.deck);
    })
        .map(cardId => createEnhancedCard(cardId))
        .filter((card) => card !== null);
}
/**
 * Helper to get card cost (handles split cards properly)
 */
function getCardCost(card, speciesIndex = 0) {
    if (card.species[speciesIndex]) {
        return card.species[speciesIndex].speciesData.cost;
    }
    return 0;
}
/**
 * Helper to get card effect
 */
function getCardEffect(card, speciesIndex = 0) {
    if (card.species[speciesIndex]) {
        return card.species[speciesIndex].speciesData.effect;
    }
    return '';
}
/**
 * Helper to get card bonus
 */
function getCardBonus(card, speciesIndex = 0) {
    if (card.species[speciesIndex]) {
        return card.species[speciesIndex].speciesData.bonus;
    }
    return '';
}
/**
 * Helper to get card points
 */
function getCardPoints(card, speciesIndex = 0) {
    if (card.species[speciesIndex]) {
        return card.species[speciesIndex].speciesData.points;
    }
    return '';
}
