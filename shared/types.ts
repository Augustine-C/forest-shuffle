/**
 * Shared types for Forest Shuffle (Client and Server)
 */

export type CardOrientation = 'Tree' | 'hCard' | 'vCard' | 'wCard';

export type CardTag =
    | 'Tree' | 'Bird' | 'Plant' | 'Butterfly' | 'Mammal' | 'Amphibian' | 'Insect'
    | 'Arachnid' | 'Mushroom' | 'Alpine' | 'Bat' | 'Deer' | 'Beetle' | 'Paw' | 'Wing'
    | 'Cloven-hoofed animal' | 'Mountain' | 'Woodland Edge' | 'Shrub';

export type DeckType = 'basic' | 'alpine' | 'edge';

export type TreeSymbol =
    | 'Birch' | 'Beech' | 'Linden' | 'Oak' | 'Horse Chestnut'
    | 'Douglas Fir' | 'Silver Fir' | 'Sycamore' | 'Larix' | 'Pinus';

export interface SpeciesData {
    name: string;
    nb: number;
    tags: CardTag[];
    cost: number;
    type: string;
    effect: string;
    bonus: string;
    points: string;
}

export interface CardData {
    id?: number; // Optional on server sometimes
    type: string;
    deck: DeckType;
    species: string[];
    tree_symbol?: TreeSymbol[];
}

export interface EnhancedSpecies {
    name: string;
    speciesData: SpeciesData;
    treeSymbol?: TreeSymbol;
}

export interface EnhancedCard {
    cardId: number;
    cardData: CardData;
    orientation: CardOrientation;
    deck: DeckType;
    species: EnhancedSpecies[];
    isWinterCard: boolean;
    isSplitCard: boolean;
}

export interface PlacedTree {
    tree: EnhancedCard;
    top?: EnhancedCard;
    bottom?: EnhancedCard;
    left?: EnhancedCard;
    right?: EnhancedCard;
}

export interface Player {
    id: string;
    name: string;
    hand: EnhancedCard[];
    forest: PlacedTree[];
    cave: EnhancedCard[];
}

export interface SerializedGameState {
    players: Player[];
    clearing: EnhancedCard[];
    activePlayerIndex: number;
    deckCount: number;
    winterCardsDrawn: number;
    gameEnded: boolean;
}
