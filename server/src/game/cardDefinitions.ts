/**
 * Complete Forest Shuffle card definitions
 * Data imported from JSON files generated from JavaScript reference
 */

import cardsDataJson from './data/cardsData.json';
import speciesDataJson from './data/speciesData.json';

import {
    CardOrientation,
    CardTag,
    DeckType,
    TreeSymbol,
    SpeciesData,
    CardData
} from '../../../shared/types';

export {
    CardOrientation,
    CardTag,
    DeckType,
    TreeSymbol,
    SpeciesData,
    CardData
};

// ===== Constants =====

export const W_CARD: CardOrientation = 'wCard';
export const V_CARD: CardOrientation = 'vCard';
export const H_CARD: CardOrientation = 'hCard';
export const TREE: CardOrientation = 'Tree';

// Tag constants
export const BUTTERFLY: CardTag = 'Butterfly';
export const INSECT: CardTag = 'Insect';
export const MUSHROOM: CardTag = 'Mushroom';
export const BIRD: CardTag = 'Bird';
export const BAT: CardTag = 'Bat';
export const PAW: CardTag = 'Paw';
export const AMPHIBIAN: CardTag = 'Amphibian';
export const PLANT: CardTag = 'Plant';
export const CLOVEN: CardTag = 'Cloven-hoofed animal';
export const MOUNTAIN: CardTag = 'Mountain';
export const EDGE: CardTag = 'Woodland Edge';
export const SHRUB: CardTag = 'Shrub';

// Deck constants
export const BASIC_DECK: DeckType = 'basic';
export const ALPINE_DECK: DeckType = 'alpine';
export const EDGE_DECK: DeckType = 'edge';

// ===== Data Imports =====

// Type-safe data imports with proper type casting
export const CARDS_DATA: Record<number, CardData> = cardsDataJson as Record<number, CardData>;
export const SPECIES_DATA: Record<string, SpeciesData> = speciesDataJson as Record<string, SpeciesData>;

// ===== Helper Functions =====

/**
 * Get card data by card ID
 */
export function getCardById(cardId: number): CardData | undefined {
    return CARDS_DATA[cardId];
}

/**
 * Get species data by species name
 */
export function getSpeciesData(speciesName: string): SpeciesData | undefined {
    return SPECIES_DATA[speciesName];
}

/**
 * Get all cards from specific decks
 */
export function getCardsByDeck(decks: DeckType[]): Record<number, CardData> {
    return Object.fromEntries(
        Object.entries(CARDS_DATA).filter(([_, card]) => decks.includes(card.deck))
    );
}

/**
 * Get total count of cards in deck
 */
export function getTotalCardCount(decks: DeckType[] = ['basic']): number {
    const cards = getCardsByDeck(decks);
    return Object.keys(cards).length;
}

// Special mechanics arrays (from original implementation)
export const WITH_OTHERS = [
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

export const SLOT_SCORE = ['European Hare', 'Common Toad'];
