/**
 * Scoring Engine - Calculate points for Forest Shuffle
 * Handles parsing and calculation of points strings
 */

import { EnhancedCard } from './cards';
import { GameState, Player } from './gameState';
import {
    countCardsWithTag,
    getButterfliesInForest,
    getTreeSpecies,
    countSpeciesByName,
    isCardOnTreeType,
    countCardsAtopTrees,
    countCardsBelowTrees,
    forestSlots,
    getSlotCards,
    getSharedSlotSizeForCard
} from './cardMatching';

/**
 * Table for variable scoring based on counts
 */
const VARIABLE_SCORING: Record<string, number[]> = {
    'Fireflies': [0, 1, 3, 6, 10, 15],
    'Fire Salamander': [0, 2, 5, 9, 14],
    'Horse Chestnut': [0, 1, 3, 6, 10, 15, 21, 28, 36, 45, 55],
};

/**
 * Points for sets of butterflies
 */
const BUTTERFLY_SET_POINTS: Record<number, number> = {
    1: 0,
    2: 3,
    3: 6,
    4: 12,
    5: 20,
    6: 35,
};

/**
 * Calculate total score for a player
 */
export function calculatePlayerScore(player: Player, gameState: GameState): number {
    let totalPoints = 0;

    // 1. Calculate points for each card in forest
    player.forest.forEach(treeSlot => {
        // Points for the tree itself
        if (!treeSlot.isSapling) totalPoints += calculateCardPoints(treeSlot.tree, player, gameState);

        // Points for attached cards
        forestSlots.forEach(slot => {
            getSlotCards(treeSlot, slot).forEach(placedCard => {
                totalPoints += calculateCardPoints(
                    placedCard.card,
                    player,
                    gameState,
                    placedCard.speciesIndex
                );
            });
        });
    });

    // 2. Add points for cards in cave (1 point each)
    totalPoints += player.cave.length;

    // 3. Handle global set/collection bonuses (like butterflies)
    totalPoints += calculateGlobalBonuses(player, gameState);

    return totalPoints;
}

/**
 * Calculate points for a specific card
 */
export function calculateCardPoints(card: EnhancedCard, player: Player, gameState: GameState, speciesIndex = 0): number {
    const speciesName = card.species[speciesIndex]?.speciesData.name;
    if (speciesName === 'European Hare') {
        return countSpeciesByName(player.forest, 'European Hare') +
            countSpeciesByName(player.forest, 'Mountain Hare');
    }
    if (speciesName === 'Common Toad') {
        return getSharedSlotSizeForCard(player.forest, card.cardId) === 2 ? 5 : 0;
    }
    const pointsText = card.species[speciesIndex]?.speciesData.points;
    return pointsText ? parseAndCalculatePoints(pointsText, card, player, gameState) : 0;
}

/**
 * Parse points string and calculate value
 */
function parseAndCalculatePoints(text: string, card: EnhancedCard, player: Player, gameState: GameState): number {
    // Pattern: "Gain N points" (Fixed)
    const fixedMatch = text.match(/Gain (\d+) points?/i);
    if (fixedMatch && !text.includes('for each') && !text.includes('if')) {
        return parseInt(fixedMatch[1]);
    }

    // Pattern: "Gain N points for each card with a [tag] symbol"
    const perTagMatch = text.match(/Gain (\d+) points? for each card with a (.+) symbol/i);
    if (perTagMatch) {
        const pointsPer = parseInt(perTagMatch[1]);
        const tagName = perTagMatch[2].trim();
        return countCardsWithTag(player.forest, tagName) * pointsPer;
    }

    // Pattern: "Gain points according to the number of [species] you have"
    if (text.includes('according to the number of')) {
        for (const speciesName in VARIABLE_SCORING) {
            if (text.includes(speciesName)) {
                const count = countSpeciesByName(player.forest, speciesName);
                const table = VARIABLE_SCORING[speciesName];
                return table[Math.min(count, table.length - 1)] || 0;
            }
        }
    }

    // Pattern: "N points if it's on a [TreeType]"
    const onTreeMatch = text.match(/(\d+) points if it's on a (.+)/i);
    if (onTreeMatch) {
        const points = parseInt(onTreeMatch[1]);
        const treeType = onTreeMatch[2].trim();
        if (isCardOnTreeType(player.forest, card.cardId, treeType)) {
            return points;
        }
    }

    // Pattern: "Gain 10 points if you have all 8 different tree species"
    if (text.includes('all 8 different tree species')) {
        const uniqueTrees = getTreeSpecies(player.forest);
        return uniqueTrees.size >= 8 ? 10 : 0;
    }

    // Pattern: "Gain 10 points if no other forest has more trees"
    if (text.includes('no other forest has more trees')) {
        const myTrees = player.forest.length;
        let mostTrees = 0;
        gameState.players.forEach(p => {
            if (p.forest.length > mostTrees) mostTrees = p.forest.length;
        });
        return myTrees >= mostTrees ? 10 : 0;
    }

    // Pattern: "Gain N points for each card below a tree"
    if (text.includes('for each card below a tree')) {
        const match = text.match(/Gain (\d+)/);
        const pointsPer = match ? parseInt(match[1]) : 0;
        return countCardsBelowTrees(player.forest) * pointsPer;
    }

    // Pattern: "Gain N points for each card atop a tree"
    if (text.includes('for each card atop a tree')) {
        const match = text.match(/Gain (\d+)/);
        const pointsPer = match ? parseInt(match[1]) : 0;
        return countCardsAtopTrees(player.forest) * pointsPer;
    }

    return 0;
}

/**
 * Calculate bonuses that apply globally across the forest
 */
function calculateGlobalBonuses(player: Player, gameState: GameState): number {
    let globalPoints = 0;

    // 1. Butterfly sets
    const butterflies = getButterfliesInForest(player.forest);
    const count = butterflies.size;
    if (count > 0) {
        globalPoints += BUTTERFLY_SET_POINTS[count] || (count > 5 ? 35 : 0);
    }

    return globalPoints;
}
