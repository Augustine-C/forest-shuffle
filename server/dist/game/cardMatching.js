"use strict";
/**
 * Card matching and counting utilities
 * Helper functions for card effects and scoring
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.countCardsWithTag = countCardsWithTag;
exports.countSpeciesByName = countSpeciesByName;
exports.getButterfliesInForest = getButterfliesInForest;
exports.getTreeSpecies = getTreeSpecies;
exports.hasTreeSymbol = hasTreeSymbol;
exports.countTrees = countTrees;
exports.countFullyOccupiedTrees = countFullyOccupiedTrees;
exports.isCardOnTreeType = isCardOnTreeType;
exports.countCardsBelowTrees = countCardsBelowTrees;
exports.countCardsAtopTrees = countCardsAtopTrees;
exports.countAllCardsInForest = countAllCardsInForest;
exports.getCardsWithMatchingTreeSymbol = getCardsWithMatchingTreeSymbol;
exports.hasAnyCardWithTag = hasAnyCardWithTag;
exports.countDifferentPlants = countDifferentPlants;
exports.countDifferentBirds = countDifferentBirds;
exports.checkSharedSlot = checkSharedSlot;
/**
 * Count cards with specific tag in player's forest
 */
function countCardsWithTag(forest, tag) {
    let count = 0;
    forest.forEach(tree => {
        // Check tree card
        if (tree.tree.species.some(s => s.speciesData.tags.includes(tag))) {
            count++;
        }
        // Check cards on tree
        [tree.top, tree.bottom, tree.left, tree.right].forEach(card => {
            if (card === null || card === void 0 ? void 0 : card.species.some(s => s.speciesData.tags.includes(tag))) {
                count++;
            }
        });
    });
    return count;
}
/**
 * Count specific species by name
 */
function countSpeciesByName(forest, speciesName) {
    let count = 0;
    forest.forEach(tree => {
        // Check tree card
        if (tree.tree.species.some(s => s.name === speciesName)) {
            count++;
        }
        // Check cards on tree
        [tree.top, tree.bottom, tree.left, tree.right].forEach(card => {
            if (card === null || card === void 0 ? void 0 : card.species.some(s => s.name === speciesName)) {
                count++;
            }
        });
    });
    return count;
}
/**
 * Get all unique butterfly species in forest
 */
function getButterfliesInForest(forest) {
    const butterflies = new Set();
    forest.forEach(tree => {
        // Check tree card
        tree.tree.species.forEach(s => {
            if (s.speciesData.tags.includes('Butterfly')) {
                butterflies.add(s.name);
            }
        });
        // Check cards on tree
        [tree.top, tree.bottom, tree.left, tree.right].forEach(card => {
            card === null || card === void 0 ? void 0 : card.species.forEach(s => {
                if (s.speciesData.tags.includes('Butterfly')) {
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
function getTreeSpecies(forest) {
    const treeSpecies = new Set();
    forest.forEach(tree => {
        tree.tree.species.forEach(s => {
            if (s.speciesData.tags.includes('Tree')) {
                treeSpecies.add(s.name);
            }
        });
    });
    return treeSpecies;
}
/**
 * Check if card has specific tree symbol
 */
function hasTreeSymbol(card, symbol) {
    return card.species.some(s => s.treeSymbol === symbol);
}
/**
 * Count trees in forest
 */
function countTrees(forest) {
    return forest.length;
}
/**
 * Count fully occupied trees (all 4 slots filled)
 */
function countFullyOccupiedTrees(forest) {
    return forest.filter(tree => tree.top && tree.bottom && tree.left && tree.right).length;
}
/**
 * Check if a card is on a specific tree type
 */
function isCardOnTreeType(forest, cardId, treeSpeciesName) {
    var _a, _b, _c, _d;
    for (const tree of forest) {
        const placedOnThisTree = ((_a = tree.top) === null || _a === void 0 ? void 0 : _a.cardId) === cardId ||
            ((_b = tree.bottom) === null || _b === void 0 ? void 0 : _b.cardId) === cardId ||
            ((_c = tree.left) === null || _c === void 0 ? void 0 : _c.cardId) === cardId ||
            ((_d = tree.right) === null || _d === void 0 ? void 0 : _d.cardId) === cardId;
        if (placedOnThisTree) {
            return tree.tree.species.some(s => s.name === treeSpeciesName);
        }
    }
    return false;
}
/**
 * Count cards below trees (bottom slot)
 */
function countCardsBelowTrees(forest) {
    return forest.filter(tree => tree.bottom !== undefined).length;
}
/**
 * Count cards atop trees (top slot)
 */
function countCardsAtopTrees(forest) {
    return forest.filter(tree => tree.top !== undefined).length;
}
/**
 * Count all cards in forest (trees + attached cards)
 */
function countAllCardsInForest(forest) {
    let count = 0;
    forest.forEach(tree => {
        count++; // The tree itself
        if (tree.top)
            count++;
        if (tree.bottom)
            count++;
        if (tree.left)
            count++;
        if (tree.right)
            count++;
    });
    return count;
}
/**
 * Get cards with matching tree symbol
 */
function getCardsWithMatchingTreeSymbol(forest, symbol) {
    const cards = [];
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
function hasAnyCardWithTag(forest, tag) {
    return countCardsWithTag(forest, tag) > 0;
}
/**
 * Get count of different plant species
 */
function countDifferentPlants(forest) {
    const plants = new Set();
    forest.forEach(tree => {
        tree.tree.species.forEach(s => {
            if (s.speciesData.tags.includes('Plant')) {
                plants.add(s.name);
            }
        });
        [tree.top, tree.bottom, tree.left, tree.right].forEach(card => {
            card === null || card === void 0 ? void 0 : card.species.forEach(s => {
                if (s.speciesData.tags.includes('Plant')) {
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
function countDifferentBirds(forest) {
    const birds = new Set();
    forest.forEach(tree => {
        tree.tree.species.forEach(s => {
            if (s.speciesData.tags.includes('Bird')) {
                birds.add(s.name);
            }
        });
        [tree.top, tree.bottom, tree.left, tree.right].forEach(card => {
            card === null || card === void 0 ? void 0 : card.species.forEach(s => {
                if (s.speciesData.tags.includes('Bird')) {
                    birds.add(s.name);
                }
            });
        });
    });
    return birds.size;
}
/**
 * Check if two cards share a slot (special mechanic for Common Toad, European Hare)
 */
function checkSharedSlot(tree, slot) {
    // This would need special tracking in game state
    // For now, return false - will implement when adding special card mechanics
    return false;
}
