export type CardType = 'tree' | 'bird' | 'mammal' | 'amphibian' | 'insect' | 'plant' | 'mushroom' | 'paw';

export interface BaseCard {
    id: string;
    name: string;
    cost: number;
    deckCount: number; // How many copies in the deck
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
    type: CardType[]; // Could be multiple types or tags
    cost: number;
    effect?: string; // Description of effect
    tags?: string[]; // e.g., 'deer', 'cloven-hoofed'
}

export interface SplitCard extends BaseCard {
    type: 'split';
    top?: SplitCardHalf;
    bottom?: SplitCardHalf;
    left?: SplitCardHalf;
    right?: SplitCardHalf;
}

export type GameCard = TreeCard | SplitCard;

import { CARD_DEFINITIONS } from './cardData';

// Helper to expand deck based on counts
export function createDeck(): GameCard[] {
    const deck: GameCard[] = [];
    CARD_DEFINITIONS.forEach(def => {
        for (let i = 0; i < def.deckCount; i++) {
            deck.push({ ...def, id: `${def.id}_${i}` } as GameCard);
        }
    });
    return deck;
}
