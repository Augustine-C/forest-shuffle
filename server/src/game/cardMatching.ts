/**
 * Card matching and counting utilities
 * Helper functions for card effects and scoring
 */

import { EnhancedCard } from './cards';
import { PlacedTree } from './gameState';
import { CardTag, TreeSymbol } from './cardDefinitions';

/**
 * Count cards with specific tag in player's forest (case-insensitive)
 */
export function countCardsWithTag(forest: PlacedTree[], tag: string): number {
    let count = 0;
    const normalizedTag = tag.toLowerCase();

    forest.forEach(tree => {
        // Check tree card
        if (tree.tree.species.some(s => s.speciesData.tags.some(t => t.toLowerCase() === normalizedTag))) {
            count++;
        }

        // Check cards on tree
        [tree.top, tree.bottom, tree.left, tree.right].forEach(card => {
            if (card?.species.some(s => s.speciesData.tags.some(t => t.toLowerCase() === normalizedTag))) {
                count++;
            }
        });
    });

    return count;
}

/**
 * Count specific species by name
 */
export function countSpeciesByName(forest: PlacedTree[], speciesName: string): number {
    let count = 0;

    forest.forEach(tree => {
        // Check tree card
        if (tree.tree.species.some(s => s.name === speciesName)) {
            count++;
        }

        // Check cards on tree
        [tree.top, tree.bottom, tree.left, tree.right].forEach(card => {
            if (card?.species.some(s => s.name === speciesName)) {
                count++;
            }
        });
    });

    return count;
}

/**
 * Get all unique butterfly species in forest
 */
export function getButterfliesInForest(forest: PlacedTree[]): Set<string> {
    const butterflies = new Set<string>();

    forest.forEach(tree => {
        // Check tree card
        tree.tree.species.forEach(s => {
            if (s.speciesData.tags.some(t => t === 'Butterfly')) {
                butterflies.add(s.name);
            }
        });

        // Check cards on tree
        [tree.top, tree.bottom, tree.left, tree.right].forEach(card => {
            card?.species.forEach(s => {
                if (s.speciesData.tags.some(t => t === 'Butterfly')) {
                    butterflies.add(s.name);
                }
            });
        });
    });

    return butterflies;
}

/**
 * Get all unique tree species in forest
 */
export function getTreeSpecies(forest: PlacedTree[]): Set<string> {
    const treeSpecies = new Set<string>();

    forest.forEach(tree => {
        tree.tree.species.forEach(s => {
            if (s.speciesData.tags.some(t => t === 'Tree')) {
                treeSpecies.add(s.name);
            }
        });
    });

    return treeSpecies;
}

/**
 * Check if card has specific tree symbol
 */
export function hasTreeSymbol(card: EnhancedCard, symbol: TreeSymbol): boolean {
    return card.species.some(s => s.treeSymbol === symbol);
}

/**
 * Count trees in forest
 */
export function countTrees(forest: PlacedTree[]): number {
    return forest.length;
}

/**
 * Count fully occupied trees (all 4 slots filled)
 */
export function countFullyOccupiedTrees(forest: PlacedTree[]): number {
    return forest.filter(tree =>
        tree.top && tree.bottom && tree.left && tree.right
    ).length;
}

/**
 * Check if a card is on a specific tree type
 */
export function isCardOnTreeType(
    forest: PlacedTree[],
    cardId: number,
    treeSpeciesName: string
): boolean {
    for (const tree of forest) {
        const placedOnThisTree =
            tree.top?.cardId === cardId ||
            tree.bottom?.cardId === cardId ||
            tree.left?.cardId === cardId ||
            tree.right?.cardId === cardId;

        if (placedOnThisTree) {
            return tree.tree.species.some(s => s.name === treeSpeciesName);
        }
    }
    return false;
}

/**
 * Count cards below trees (bottom slot)
 */
export function countCardsBelowTrees(forest: PlacedTree[]): number {
    return forest.filter(tree => tree.bottom !== undefined).length;
}

/**
 * Count cards atop trees (top slot)
 */
export function countCardsAtopTrees(forest: PlacedTree[]): number {
    return forest.filter(tree => tree.top !== undefined).length;
}

/**
 * Count all cards in forest (trees + attached cards)
 */
export function countAllCardsInForest(forest: PlacedTree[]): number {
    let count = 0;
    forest.forEach(tree => {
        count++; // The tree itself
        if (tree.top) count++;
        if (tree.bottom) count++;
        if (tree.left) count++;
        if (tree.right) count++;
    });
    return count;
}

/**
 * Get cards with matching tree symbol
 */
export function getCardsWithMatchingTreeSymbol(
    forest: PlacedTree[],
    symbol: TreeSymbol
): EnhancedCard[] {
    const cards: EnhancedCard[] = [];

    forest.forEach(tree => {
        if (hasTreeSymbol(tree.tree, symbol)) {
            cards.push(tree.tree);
        }
        [tree.top, tree.bottom, tree.left, tree.right].forEach(card => {
            if (card && hasTreeSymbol(card, symbol)) {
                cards.push(card);
            }
        });
    });

    return cards;
}

/**
 * Check if player has at least one card with specific tag
 */
export function hasAnyCardWithTag(forest: PlacedTree[], tag: string): boolean {
    return countCardsWithTag(forest, tag) > 0;
}

/**
 * Get count of different plant species
 */
export function countDifferentPlants(forest: PlacedTree[]): number {
    const plants = new Set<string>();

    forest.forEach(tree => {
        tree.tree.species.forEach(s => {
            if (s.speciesData.tags.some(t => t === 'Plant')) {
                plants.add(s.name);
            }
        });

        [tree.top, tree.bottom, tree.left, tree.right].forEach(card => {
            card?.species.forEach(s => {
                if (s.speciesData.tags.some(t => t === 'Plant')) {
                    plants.add(s.name);
                }
            });
        });
    });

    return plants.size;
}

/**
 * Get count of different bird species
 */
export function countDifferentBirds(forest: PlacedTree[]): number {
    const birds = new Set<string>();

    forest.forEach(tree => {
        tree.tree.species.forEach(s => {
            if (s.speciesData.tags.some(t => t === 'Bird')) {
                birds.add(s.name);
            }
        });

        [tree.top, tree.bottom, tree.left, tree.right].forEach(card => {
            card?.species.forEach(s => {
                if (s.speciesData.tags.some(t => t === 'Bird')) {
                    birds.add(s.name);
                }
            });
        });
    });

    return birds.size;
}

/**
 * Check if two cards share a slot
 */
export function checkSharedSlot(tree: PlacedTree, slot: 'top' | 'bottom' | 'left' | 'right'): boolean {
    return false;
}
