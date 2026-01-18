"use strict";
/**
 * Complete Forest Shuffle card definitions
 * Data imported from JSON files generated from JavaScript reference
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SLOT_SCORE = exports.WITH_OTHERS = exports.SPECIES_DATA = exports.CARDS_DATA = exports.EDGE_DECK = exports.ALPINE_DECK = exports.BASIC_DECK = exports.SHRUB = exports.EDGE = exports.MOUNTAIN = exports.CLOVEN = exports.PLANT = exports.AMPHIBIAN = exports.PAW = exports.BAT = exports.BIRD = exports.MUSHROOM = exports.INSECT = exports.BUTTERFLY = exports.TREE = exports.H_CARD = exports.V_CARD = exports.W_CARD = void 0;
exports.getCardById = getCardById;
exports.getSpeciesData = getSpeciesData;
exports.getCardsByDeck = getCardsByDeck;
exports.getTotalCardCount = getTotalCardCount;
const cardsData_json_1 = __importDefault(require("./data/cardsData.json"));
const speciesData_json_1 = __importDefault(require("./data/speciesData.json"));
// ===== Constants =====
exports.W_CARD = 'wCard';
exports.V_CARD = 'vCard';
exports.H_CARD = 'hCard';
exports.TREE = 'Tree';
// Tag constants
exports.BUTTERFLY = 'Butterfly';
exports.INSECT = 'Insect';
exports.MUSHROOM = 'Mushroom';
exports.BIRD = 'Bird';
exports.BAT = 'Bat';
exports.PAW = 'Paw';
exports.AMPHIBIAN = 'Amphibian';
exports.PLANT = 'Plant';
exports.CLOVEN = 'Cloven-hoofed animal';
exports.MOUNTAIN = 'Mountain';
exports.EDGE = 'Woodland Edge';
exports.SHRUB = 'Shrub';
// Deck constants
exports.BASIC_DECK = 'basic';
exports.ALPINE_DECK = 'alpine';
exports.EDGE_DECK = 'edge';
// ===== Data Imports =====
// Type-safe data imports with proper type casting
exports.CARDS_DATA = cardsData_json_1.default;
exports.SPECIES_DATA = speciesData_json_1.default;
// ===== Helper Functions =====
/**
 * Get card data by card ID
 */
function getCardById(cardId) {
    return exports.CARDS_DATA[cardId];
}
/**
 * Get species data by species name
 */
function getSpeciesData(speciesName) {
    return exports.SPECIES_DATA[speciesName];
}
/**
 * Get all cards from specific decks
 */
function getCardsByDeck(decks) {
    return Object.fromEntries(Object.entries(exports.CARDS_DATA).filter(([_, card]) => decks.includes(card.deck)));
}
/**
 * Get total count of cards in deck
 */
function getTotalCardCount(decks = ['basic']) {
    const cards = getCardsByDeck(decks);
    return Object.keys(cards).length;
}
// Special mechanics arrays (from original implementation)
exports.WITH_OTHERS = [
    'Fireflies',
    'Horse Chestnut',
    'Fire Salamander',
    'Camberwell Beauty',
    'Large Tortoiseshell',
    'Peacock Butterfly',
    'Purple Emperor',
    'Parnassius phoebus',
    'Silver-Washed Fritillary',
];
exports.SLOT_SCORE = ['European Hare', 'Common Toad'];
