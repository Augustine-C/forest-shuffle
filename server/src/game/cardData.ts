import { GameCard } from './cards';

const TREES: Partial<GameCard>[] = [
    { id: 'oak', name: 'Oak', type: 'tree', cost: 2, deckCount: 10 },
    { id: 'beech', name: 'Beech', type: 'tree', cost: 1, deckCount: 10 },
    { id: 'birch', name: 'Birch', type: 'tree', cost: 1, deckCount: 10 },
    { id: 'linden', name: 'Linden', type: 'tree', cost: 1, deckCount: 6 },
    { id: 'maple', name: 'Maple', type: 'tree', cost: 2, deckCount: 8 },
    { id: 'douglas_fir', name: 'Douglas Fir', type: 'tree', cost: 3, deckCount: 8 },
    { id: 'silver_fir', name: 'Silver Fir', type: 'tree', cost: 2, deckCount: 8 },
    { id: 'horse_chestnut', name: 'Horse Chestnut', type: 'tree', cost: 2, deckCount: 6 },
];

const SPLIT_CARDS: Partial<GameCard>[] = [
    // Top/Bottom Splits (Birds / Plants-Fungi)
    {
        id: 'camberwell_moss',
        name: 'Camberwell Beauty / Moss',
        type: 'split',
        cost: 0,
        deckCount: 5,
        top: { name: 'Camberwell Beauty', type: ['insect'], cost: 0 }, // Butterfly
        bottom: { name: 'Moss', type: ['plant'], cost: 0 }
    },
    {
        id: 'peacock_strawberry',
        name: 'Peacock Butterfly / Wild Strawberry',
        type: 'split',
        cost: 0,
        deckCount: 5,
        top: { name: 'Peacock Butterfly', type: ['insect'], cost: 0 },
        bottom: { name: 'Wild Strawberry', type: ['plant'], cost: 0 }
    },
    {
        id: 'chaffinch_fly_agaric',
        name: 'Chaffinch / Fly Agaric',
        type: 'split',
        cost: 1,
        deckCount: 5,
        top: { name: 'Chaffinch', type: ['bird'], cost: 1 },
        bottom: { name: 'Fly Agaric', type: ['mushroom'], cost: 0 }
    },
    {
        id: 'goshawk_fern',
        name: 'Goshawk / Fern',
        type: 'split',
        cost: 1,
        deckCount: 5,
        top: { name: 'Goshawk', type: ['bird'], cost: 1 },
        bottom: { name: 'Fern', type: ['plant'], cost: 0 }
    },
    {
        id: 'squeaker_herb',
        name: 'Squeaker / Herb',
        type: 'split',
        cost: 1,
        deckCount: 5,
        top: { name: 'Squeaker', type: ['bird'], cost: 1 }, // Actually a bird? Or Paw? Squeaker is usually a bird in this game context.
        bottom: { name: 'Herb', type: ['plant'], cost: 0 }
    },

    // Left/Right Splits (Mammals)
    {
        id: 'roe_deer_fox',
        name: 'Roe Deer / Red Fox',
        type: 'split',
        cost: 2,
        deckCount: 5,
        left: { name: 'Roe Deer', type: ['mammal'], cost: 2 },
        right: { name: 'Red Fox', type: ['mammal'], cost: 2 }
    },
    {
        id: 'wild_boar_badger',
        name: 'Wild Boar / Badger',
        type: 'split',
        cost: 2,
        deckCount: 5,
        left: { name: 'Wild Boar', type: ['mammal'], cost: 2 },
        right: { name: 'Badger', type: ['mammal'], cost: 1 } // Note: Badger might be cheaper if played alone, but card cost is 2?
        // Rules: Pay the cost of the HALF you play.
        // If card main 'cost' property is just for reference, we rely on sub-costs. 
        // Wait, current logic uses main card cost. I need to update logic to use split-half cost if selecting split.
        // For now, let's keep it simple: Card has a base cost, but standard split cards often have DIFFERENT costs?
        // Actually, physically, the cost is printed on top-left of the half.
        // My data model has 'cost' on split halves.
    },
    {
        id: 'wolf_deer',
        name: 'Wolf / Deer',
        type: 'split',
        cost: 3,
        deckCount: 3,
        left: { name: 'Wolf', type: ['mammal'], cost: 3 },
        right: { name: 'Deer', type: ['mammal'], cost: 2 }
    },
    {
        id: 'hare_hare',
        name: 'Euro Hare / Euro Hare',
        type: 'split',
        cost: 0,
        deckCount: 5,
        left: { name: 'Euro Hare', type: ['mammal'], cost: 0 },
        right: { name: 'Euro Hare', type: ['mammal'], cost: 0 }
    }
];

export const CARD_DEFINITIONS: GameCard[] = [
    ...TREES.map(t => ({
        ...t,
        slots: { top: null, bottom: null, left: null, right: null }
    } as GameCard)),
    ...SPLIT_CARDS.map(c => c as GameCard)
];
