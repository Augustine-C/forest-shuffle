/** Card matching and counting utilities for placed forest cards. */

import { EnhancedCard } from './cards';
import { PlacedCard, PlacedTree } from './gameState';
import { TreeSymbol } from './cardDefinitions';

export type ForestSlot = 'top' | 'bottom' | 'left' | 'right';
export const forestSlots: ForestSlot[] = ['top', 'bottom', 'left', 'right'];

export function getSlotCards(tree: PlacedTree, slot: ForestSlot): PlacedCard[] {
    return tree[slot] ?? [];
}

export function getPlacedSpecies(placedCard: PlacedCard) {
    return placedCard.card.species[placedCard.speciesIndex];
}

export function getAllPlacedCards(forest: PlacedTree[]): PlacedCard[] {
    return forest.flatMap(tree => forestSlots.flatMap(slot => getSlotCards(tree, slot)));
}

export function countCardsWithTag(forest: PlacedTree[], tag: string): number {
    const normalizedTag = tag.toLowerCase();
    const treeCount = forest.filter(tree => !tree.isSapling &&
        (normalizedTag !== 'tree' || !tree.isShrub) &&
        tree.tree.species.some(species =>
            species.speciesData.tags.some(cardTag => cardTag.toLowerCase() === normalizedTag)
        )
    ).length;
    const attachedCount = getAllPlacedCards(forest).filter(placedCard =>
        getPlacedSpecies(placedCard)?.speciesData.tags.some(cardTag =>
            cardTag.toLowerCase() === normalizedTag
        )
    ).length;
    return treeCount + attachedCount;
}

export function countSpeciesByName(forest: PlacedTree[], speciesName: string): number {
    const treeCount = forest.filter(tree => !tree.isSapling && tree.tree.species.some(species =>
        species.name === speciesName || species.speciesData.name === speciesName
    )).length;
    const attachedCount = getAllPlacedCards(forest).filter(placedCard => {
        const species = getPlacedSpecies(placedCard);
        return species?.name === speciesName || species?.speciesData.name === speciesName;
    }).length;
    return treeCount + attachedCount;
}

export function getButterfliesInForest(forest: PlacedTree[]): string[] {
    const butterflies: string[] = [];
    forest.forEach(tree => {
        if (!tree.isSapling && !tree.isShrub) tree.tree.species.forEach(species => {
            if (species.speciesData.tags.includes('Butterfly')) {
                butterflies.push(species.speciesData.name);
            }
        });
    });
    getAllPlacedCards(forest).forEach(placedCard => {
        const species = getPlacedSpecies(placedCard);
        if (species?.speciesData.tags.includes('Butterfly')) {
            butterflies.push(species.speciesData.name);
        }
    });
    return butterflies;
}

export function getTreeSpecies(forest: PlacedTree[]): Set<string> {
    const treeSpecies = new Set<string>();
    forest.forEach(tree => {
        if (!tree.isSapling && !tree.isShrub) tree.tree.species.forEach(species => {
            if (species.speciesData.tags.includes('Tree')) treeSpecies.add(species.name);
        });
    });
    return treeSpecies;
}

export function hasTreeSymbol(card: EnhancedCard, symbol: TreeSymbol): boolean {
    return card.species.some(species => species.treeSymbol === symbol);
}

export function countTrees(forest: PlacedTree[]): number {
    return forest.filter(tree => !tree.isShrub).length;
}

export function countFullyOccupiedTrees(forest: PlacedTree[]): number {
    return forest.filter(tree => !tree.isSapling && !tree.isShrub &&
        forestSlots.every(slot => getSlotCards(tree, slot).length > 0)
    ).length;
}

export function isCardOnTreeType(
    forest: PlacedTree[],
    cardId: number,
    treeSpeciesName: string
): boolean {
    return forest.some(tree =>
        forestSlots.some(slot => getSlotCards(tree, slot).some(placedCard =>
            placedCard.card.cardId === cardId
        )) && tree.tree.species.some(species => species.name === treeSpeciesName)
    );
}

export function countCardsBelowTrees(forest: PlacedTree[]): number {
    return forest.reduce((count, tree) =>
        count + (tree.isShrub ? 0 : getSlotCards(tree, 'bottom').length),
    0);
}

export function countCardsAtopTrees(forest: PlacedTree[]): number {
    return forest.reduce((count, tree) =>
        count + (tree.isShrub ? 0 : getSlotCards(tree, 'top').length),
    0);
}

export function countAllCardsInForest(forest: PlacedTree[]): number {
    return forest.length + getAllPlacedCards(forest).length;
}

export function getCardsWithMatchingTreeSymbol(
    forest: PlacedTree[],
    symbol: TreeSymbol
): EnhancedCard[] {
    const cards: EnhancedCard[] = [];
    forest.forEach(tree => {
        if (!tree.isSapling && !tree.isShrub && hasTreeSymbol(tree.tree, symbol)) cards.push(tree.tree);
    });
    getAllPlacedCards(forest).forEach(placedCard => {
        if (hasTreeSymbol(placedCard.card, symbol)) cards.push(placedCard.card);
    });
    return cards;
}

export function hasAnyCardWithTag(forest: PlacedTree[], tag: string): boolean {
    return countCardsWithTag(forest, tag) > 0;
}

export function countDifferentPlants(forest: PlacedTree[]): number {
    const plants = new Set<string>();
    forest.forEach(tree => {
        if (!tree.isSapling && !tree.isShrub) tree.tree.species.forEach(species => {
            if (species.speciesData.tags.includes('Plant')) plants.add(species.name);
        });
    });
    getAllPlacedCards(forest).forEach(placedCard => {
        const species = getPlacedSpecies(placedCard);
        if (species?.speciesData.tags.includes('Plant')) plants.add(species.name);
    });
    return plants.size;
}

export function countDifferentBirds(forest: PlacedTree[]): number {
    const birds = new Set<string>();
    forest.forEach(tree => {
        if (!tree.isSapling && !tree.isShrub) tree.tree.species.forEach(species => {
            if (species.speciesData.tags.includes('Bird')) birds.add(species.name);
        });
    });
    getAllPlacedCards(forest).forEach(placedCard => {
        const species = getPlacedSpecies(placedCard);
        if (species?.speciesData.tags.includes('Bird')) birds.add(species.name);
    });
    return birds.size;
}

export function checkSharedSlot(tree: PlacedTree, slot: ForestSlot): boolean {
    return getSlotCards(tree, slot).length > 1;
}

export function getSharedSlotSizeForCard(forest: PlacedTree[], cardId: number): number {
    for (const tree of forest) {
        for (const slot of forestSlots) {
            const cards = getSlotCards(tree, slot);
            if (cards.some(placedCard => placedCard.card.cardId === cardId)) return cards.length;
        }
    }
    return 0;
}
