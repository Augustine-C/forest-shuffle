/**
 * Enhanced card type definitions integrating reference card data
 * Maintains backward compatibility while adding support for complete card database
 */

// Re-export all types and data from cardDefinitions
export {
    CardOrientation,
    CardTag,
    DeckType,
    TreeSymbol,
    SpeciesData,
    CardData,
    CARDS_DATA,
    SPECIES_DATA,
    getCardById,
    getSpeciesData,
    getCardsByDeck,
    getTotalCardCount,
    // Constants
    W_CARD,
    V_CARD,
    H_CARD,
    TREE,
    BUTTERFLY,
    INSECT,
    MUSHROOM,
    BIRD,
    BAT,
    PAW,
    AMPHIBIAN,
    PLANT,
    CLOVEN,
    MOUNTAIN,
    EDGE,
    SHRUB,
    BASIC_DECK,
    ALPINE_DECK,
    EDGE_DECK,
    WITH_OTHERS,
    SLOT_SCORE,
} from './cardDefinitions';

import type { CardData, SpeciesData, DeckType, CardOrientation } from './cardDefinitions';
import { CARDS_DATA, SPECIES_DATA, getSpeciesData } from './cardDefinitions';

// ===== Legacy Types (for backward compatibility) =====

export type CardType = 'tree' | 'bird' | 'mammal' | 'amphibian' | 'insect' | 'plant' | 'mushroom' | 'paw';

export interface BaseCard {
    id: string;
    name: string;
    cost: number;
    deckCount: number;
}

export interface TreeCard extends BaseCard {
    type: 'tree';
    slots: {
        top: string | null;
        bottom: string | null;
        left: string | null;
        right: string | null;
    };
}

export interface SplitCardHalf {
    name: string;
    type: CardType[];
    cost: number;
    effect?: string;
    tags?: string[];
}

export interface SplitCard extends BaseCard {
    type: 'split';
    top?: SplitCardHalf;
    bottom?: SplitCardHalf;
    left?: SplitCardHalf;
    right?: SplitCardHalf;
}

export type GameCard = TreeCard | SplitCard;

// ===== New Enhanced Card Interface =====

/**
 * Enhanced card with complete game data
 * Combines CardData from reference with SpeciesData for full game mechanics
 */
export interface EnhancedCard {
    cardId: number;
    cardData: CardData;
    orientation: CardOrientation;
    deck: DeckType;

    // Species information (1 or 2 species per card)
    species: {
        name: string;
        speciesData: SpeciesData;
        treeSymbol: string;
    }[];

    // Game play info
    isWinterCard: boolean;
    isSplitCard: boolean;
}

/**
 * Convert reference card data to enhanced card format
 */
export function createEnhancedCard(cardId: number): EnhancedCard | null {
    const cardData = CARDS_DATA[cardId];
    if (!cardData) return null;

    const isWinterCard = cardData.type === 'wCard';
    const isSplitCard = cardData.type === 'hCard' || cardData.type === 'vCard';

    // Build species information
    const species = cardData.species
        .filter(name => name) // Filter empty species names (winter cards)
        .map((name, index) => {
            const speciesData = getSpeciesData(name);
            if (!speciesData) {
                throw new Error(`Missing species data for card ${cardId}: ${name}`);
            }
            return {
                name,
                speciesData,
                treeSymbol: (cardData.tree_symbol && cardData.tree_symbol[index]) || '',
            };
        });

    return {
        cardId,
        cardData,
        orientation: cardData.type as CardOrientation,
        deck: cardData.deck,
        species,
        isWinterCard,
        isSplitCard,
    };
}

/**
 * Get all enhanced cards for specific decks
 */
export function getEnhancedCards(includedDecks: DeckType[] = ['basic']): EnhancedCard[] {
    return Object.keys(CARDS_DATA)
        .map(Number)
        .filter(cardId => {
            const card = CARDS_DATA[cardId];
            return includedDecks.includes(card.deck);
        })
        .map(cardId => createEnhancedCard(cardId))
        .filter((card): card is EnhancedCard => card !== null);
}

/**
 * Helper to get card cost (handles split cards properly)
 */
export function getCardCost(card: EnhancedCard, speciesIndex: number = 0): number {
    if (card.species[speciesIndex]) {
        return card.species[speciesIndex].speciesData.cost;
    }
    return 0;
}

/**
 * Helper to get card effect
 */
export function getCardEffect(card: EnhancedCard, speciesIndex: number = 0): string {
    if (card.species[speciesIndex]) {
        return card.species[speciesIndex].speciesData.effect;
    }
    return '';
}

/**
 * Helper to get card bonus
 */
export function getCardBonus(card: EnhancedCard, speciesIndex: number = 0): string {
    if (card.species[speciesIndex]) {
        return card.species[speciesIndex].speciesData.bonus;
    }
    return '';
}

/**
 * Helper to get card points
 */
export function getCardPoints(card: EnhancedCard, speciesIndex: number = 0): string {
    if (card.species[speciesIndex]) {
        return card.species[speciesIndex].speciesData.points;
    }
    return '';
}
