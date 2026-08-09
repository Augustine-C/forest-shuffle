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

export interface PlacedCard {
    card: EnhancedCard;
    speciesIndex: number;
    playedTurn?: number;
}

export interface PlacedTree {
    tree: EnhancedCard;
    isSapling?: boolean;
    treePlayedTurn?: number;
    top?: PlacedCard[];
    bottom?: PlacedCard[];
    left?: PlacedCard[];
    right?: PlacedCard[];
}

export interface Player {
    id: string;
    name: string;
    isHost?: boolean;
    hand: EnhancedCard[];
    handCount?: number;
    forest: PlacedTree[];
    cave: EnhancedCard[];
}

export interface PendingClearingSelection {
    kind: 'selectClearingCards';
    playerId: string;
    destination: 'hand' | 'cave';
    count: number;
    optional: boolean;
    prompt: string;
}

export interface PendingFreeCardPlay {
    kind: 'playFreeCard';
    playerId: string;
    eligibleTag?: CardTag;
    eligibleSpecies?: string;
    repeatable?: boolean;
    suppressEffectsAndBonus: boolean;
    optional: boolean;
    prompt: string;
}

export interface PendingPaidCardPlays {
    kind: 'playPaidCards';
    playerId: string;
    optional: boolean;
    prompt: string;
}

export interface PendingHandExchange {
    kind: 'exchangeHandForDeck';
    playerId: string;
    optional: boolean;
    prompt: string;
}

export interface PendingSaplingSelection {
    kind: 'playSaplings';
    playerId: string;
    optional: boolean;
    prompt: string;
}

export interface PendingTakeAllMatching {
    kind: 'takeAllMatching';
    playerId: string;
    eligibleTag: CardTag;
    count: number;
    optional: boolean;
    prompt: string;
}

export interface TriggeredDrawChoice {
    id: string;
    sourceCardId: number;
    sourceName: string;
}

export interface PendingTriggeredDraws {
    kind: 'triggeredDraws';
    playerId: string;
    triggers: TriggeredDrawChoice[];
    optional: boolean;
    prompt: string;
}

export type PendingAction =
    | PendingClearingSelection
    | PendingFreeCardPlay
    | PendingPaidCardPlays
    | PendingHandExchange
    | PendingSaplingSelection
    | PendingTakeAllMatching
    | PendingTriggeredDraws;

export interface SerializedGameState {
    players: Player[];
    clearing: EnhancedCard[];
    activePlayerIndex: number;
    deckCount: number;
    winterCardsDrawn: number;
    gameEnded: boolean;
    turnNumber: number;
    pendingAction?: PendingAction;
    finalScores?: Record<string, number>;
}
