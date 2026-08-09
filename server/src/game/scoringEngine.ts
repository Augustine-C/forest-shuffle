/** Explicit scoring rules for every species represented by the card data. */

import { EnhancedCard } from './cards';
import type { CardTag } from './cardDefinitions';
import { GameState, PlacedTree, Player } from './gameState';
import {
    countCardsBelowTrees,
    countCardsWithTag,
    countDifferentBirds,
    countDifferentPlants,
    countFullyOccupiedTrees,
    countSpeciesByName,
    forestSlots,
    getAllPlacedCards,
    getButterfliesInForest,
    getPlacedSpecies,
    getSharedSlotSizeForCard,
    getSlotCards,
    getTreeSpecies,
    isCardOnTreeType
} from './cardMatching';

const VARIABLE_SCORING: Record<string, number[]> = {
    'Fireflies': [0, 0, 10, 15, 20],
    'Fire Salamander': [0, 5, 15, 25],
    'Horse Chestnut': [0, 1, 4, 9, 16, 25, 36, 49]
};

const BUTTERFLY_SET_POINTS: Record<number, number> = {
    1: 0,
    2: 3,
    3: 6,
    4: 12,
    5: 20,
    6: 35,
    7: 55,
    8: 80
};

const butterflySpecies = new Set([
    'Camberwell Beauty',
    'Large Tortoiseshell',
    'Peacock Butterfly',
    'Purple Emperor',
    'Silver-Washed Fritillary',
    'Parnassius phoebus',
    'Map Butterfly',
    'Brimstone'
]);

const batSpecies = new Set([
    'Barbastelle Bat',
    "Bechstein's Bat",
    'Brown Long-Eared Bat',
    'Greater Horseshoe Bat',
    'Hypsugo savii',
    'Common Pipistrelle'
]);

const fixedPoints: Record<string, number> = {
    'Eurasian Jay': 3,
    'Pond Turtle': 5,
    'Tawny Owl': 5,
    'European Badger': 2,
    'Squeaker': 1,
    'Birch': 1,
    'Douglas Fir': 5,
    'Larix decidua': 3,
    'Corvus corax': 5,
    'Leontopodium nivale': 3,
    'Capra ibex': 10,
    'Eurasian Magpie': 3
};

const scoringSpecies = new Set([
    ...Object.keys(fixedPoints),
    ...butterflySpecies,
    ...batSpecies,
    'Blackberries',
    'Bullfinch',
    'Chaffinch',
    'Common Toad',
    'Fire Salamander',
    'Fireflies',
    'Goshawk',
    'Great Spotted Woodpecker',
    'Hedgehog',
    'Moss',
    'Red Squirrel',
    'Stag Beetle',
    'Tree Ferns',
    'Tree Frog',
    'Wild Strawberries',
    'Wood Ant',
    'Beech Marten',
    'European Fat Dormouse',
    'European Hare',
    'Fallow Deer',
    'Gnat',
    'Lynx',
    'Red Deer',
    'Red Fox',
    'Roe Deer',
    'Wild Boar',
    'Wolf',
    'Linden',
    'Oak',
    'Silver Fir',
    'Beech',
    'Sycamore',
    'Horse Chestnut',
    'Pinus cembra',
    'Gentiana',
    'Vaccinium myrtillus',
    'Ichthyosaura Alpestris',
    'Aquila chrysaetos',
    'Gypaetus barbatus',
    'Lepus timidus',
    'Marmota marmota',
    'Rupicapra rupicapra',
    'Tetrao urogallus',
    'Wild Boar (Female)',
    'Bee Swarm',
    'European Bison',
    'European Wildcat',
    'Crane Fly',
    'European Polecat',
    'Digitalis',
    'Stinging Nettle',
    'Great Green Bush-Cricket',
    'Nightingale',
    'Barn Owl'
]);

export function hasScoringRule(speciesName: string): boolean {
    return scoringSpecies.has(speciesName);
}

export function calculatePlayerScore(player: Player, gameState: GameState): number {
    let totalPoints = 0;

    player.forest.forEach(treeSlot => {
        if (!treeSlot.isSapling) totalPoints += calculateCardPoints(treeSlot.tree, player, gameState);

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

    totalPoints += player.cave.length;
    totalPoints += calculateGlobalBonuses(player);
    return totalPoints;
}

export function calculateCardPoints(
    card: EnhancedCard,
    player: Player,
    gameState: GameState,
    speciesIndex = 0
): number {
    const species = card.species[speciesIndex];
    if (!species?.speciesData.points) return 0;

    const speciesName = species.speciesData.name;
    if (!hasScoringRule(speciesName)) {
        throw new Error(`Missing scoring rule for ${speciesName}`);
    }

    if (fixedPoints[speciesName] !== undefined) return fixedPoints[speciesName];
    if (butterflySpecies.has(speciesName)) return 0;
    if (batSpecies.has(speciesName)) return countDifferentSpeciesWithTag(player, 'Bat') >= 3 ? 5 : 0;

    switch (speciesName) {
        case 'Blackberries': return countCardsWithTag(player.forest, 'Plant') * 2;
        case 'Bullfinch': return countCardsWithTag(player.forest, 'Insect') * 2;
        case 'Chaffinch': return isCardOnTreeType(player.forest, card.cardId, 'Beech') ? 5 : 0;
        case 'Common Toad': return getSharedSlotSizeForCard(player.forest, card.cardId) === 2 ? 5 : 0;
        case 'Fire Salamander':
        case 'Fireflies': return 0;
        case 'Goshawk': return countCardsWithTag(player.forest, 'Bird') * 3;
        case 'Great Spotted Woodpecker': return hasMostTrees(player, gameState) ? 10 : 0;
        case 'Hedgehog': return countCardsWithTag(player.forest, 'Butterfly') * 2;
        case 'Moss': return player.forest.length >= 10 ? 10 : 0;
        case 'Red Squirrel': return isCardOnTreeType(player.forest, card.cardId, 'Oak') ? 5 : 0;
        case 'Stag Beetle': return countCardsWithTag(player.forest, 'Paw');
        case 'Tree Ferns': return countCardsWithTag(player.forest, 'Amphibian') * 6;
        case 'Tree Frog': return countSpeciesByName(player.forest, 'Gnat') * 5;
        case 'Wild Strawberries': return getTreeSpecies(player.forest).size >= 8 ? 10 : 0;
        case 'Wood Ant': return countCardsBelowTrees(player.forest) * 2;
        case 'Beech Marten': return countFullyOccupiedTrees(player.forest) * 5;
        case 'European Fat Dormouse': return hasBatOpposite(player.forest, card.cardId) ? 15 : 0;
        case 'European Hare': return countHares(player);
        case 'Fallow Deer': return countCardsWithTag(player.forest, 'Cloven-hoofed animal') * 3;
        case 'Gnat': return countCardsWithTag(player.forest, 'Bat');
        case 'Lynx': return countSpeciesByName(player.forest, 'Roe Deer') > 0 ? 10 : 0;
        case 'Red Deer': return countCardsWithAnyTag(player, ['Tree', 'Plant']);
        case 'Red Fox': return countHares(player) * 2;
        case 'Roe Deer': return countMatchingTreeSymbols(player, species.treeSymbol) * 3;
        case 'Wild Boar': return countSpeciesByName(player.forest, 'Squeaker') > 0 ? 10 : 0;
        case 'Wolf': return countCardsWithTag(player.forest, 'Deer') * 5;
        case 'Linden': return hasMostSpecies(player, gameState, 'Linden') ? 3 : 1;
        case 'Oak': return getTreeSpecies(player.forest).size >= 8 ? 10 : 0;
        case 'Silver Fir': return countAttachedCards(player.forest, card.cardId) * 2;
        case 'Beech': return countSpeciesByName(player.forest, 'Beech') >= 4 ? 5 : 0;
        case 'Sycamore': return player.forest.length;
        case 'Horse Chestnut': return 0;
        case 'Pinus cembra': return countCardsWithTag(player.forest, 'Mountain');
        case 'Gentiana': return countCardsWithTag(player.forest, 'Butterfly') * 3;
        case 'Vaccinium myrtillus': return countDifferentBirds(player.forest) * 2;
        case 'Ichthyosaura Alpestris': return countCardsWithTag(player.forest, 'Insect') * 2;
        case 'Aquila chrysaetos': return countCardsWithAnyTag(player, ['Paw', 'Amphibian']);
        case 'Gypaetus barbatus': return player.cave.length;
        case 'Lepus timidus': return countHares(player);
        case 'Marmota marmota': return countDifferentPlants(player.forest) * 3;
        case 'Rupicapra rupicapra': return countMatchingTreeSymbols(player, species.treeSymbol) * 3;
        case 'Tetrao urogallus': return countCardsWithTag(player.forest, 'Plant');
        case 'Wild Boar (Female)': return countSpeciesByName(player.forest, 'Squeaker') * 10;
        case 'Bee Swarm': return countCardsWithTag(player.forest, 'Plant');
        case 'European Bison': return countMatchingTreeSymbols(player, 'Oak', 'Beech') * 2;
        case 'European Wildcat': return countCardsWithTag(player.forest, 'Woodland Edge');
        case 'Crane Fly': return countCardsWithTag(player.forest, 'Bat');
        case 'European Polecat': return isOnlyAttachedCard(player.forest, card.cardId) ? 10 : 0;
        case 'Digitalis': return [0, 1, 3, 6, 10, 15][Math.min(countDifferentPlants(player.forest), 5)];
        case 'Stinging Nettle': return countCardsWithTag(player.forest, 'Butterfly') * 2;
        case 'Great Green Bush-Cricket': return countCardsWithTag(player.forest, 'Insect');
        case 'Nightingale': return isCardOnShrub(player.forest, card.cardId) ? 5 : 0;
        case 'Barn Owl': return countCardsWithTag(player.forest, 'Bat') * 3;
        default: throw new Error(`Missing scoring calculation for ${speciesName}`);
    }
}

function variableScore(player: Player, speciesName: string, adjustment = 0): number {
    const table = VARIABLE_SCORING[speciesName];
    const count = countSpeciesByName(player.forest, speciesName) + adjustment;
    return table[Math.min(count, table.length - 1)] ?? 0;
}

function countVioletCarpenterBeesAtTreeSpecies(forest: PlacedTree[], speciesName: string): number {
    return forest.reduce((total, tree) => {
        if (tree.isSapling || tree.tree.species[0]?.speciesData.name !== speciesName) return total;
        return total + forestSlots.reduce((slotTotal, slot) =>
            slotTotal + getSlotCards(tree, slot).filter(placedCard =>
                getPlacedSpecies(placedCard)?.speciesData.name === 'Violet Carpenter Bee'
            ).length,
        0);
    }, 0);
}

function countDifferentSpeciesWithTag(player: Player, tag: CardTag): number {
    const names = new Set<string>();
    player.forest.forEach(tree => {
        if (!tree.isSapling) {
            tree.tree.species.forEach(species => {
                if (species.speciesData.tags.includes(tag)) names.add(species.speciesData.name);
            });
        }
    });
    getAllPlacedCards(player.forest).forEach(placedCard => {
        const species = getPlacedSpecies(placedCard);
        if (species?.speciesData.tags.includes(tag)) names.add(species.speciesData.name);
    });
    return names.size;
}

function countCardsWithAnyTag(player: Player, tags: CardTag[]): number {
    return tags.reduce((total, tag) => total + countCardsWithTag(player.forest, tag), 0);
}

function countHares(player: Player): number {
    return countSpeciesByName(player.forest, 'European Hare') +
        countSpeciesByName(player.forest, 'Lepus timidus');
}

function hasMostTrees(player: Player, gameState: GameState): boolean {
    return Array.from(gameState.players.values()).every(other =>
        player.forest.length >= other.forest.length
    );
}

function hasMostSpecies(player: Player, gameState: GameState, speciesName: string): boolean {
    const playerCount = countSpeciesByName(player.forest, speciesName);
    return Array.from(gameState.players.values()).every(other =>
        playerCount >= countSpeciesByName(other.forest, speciesName)
    );
}

function countAttachedCards(forest: PlacedTree[], cardId: number): number {
    const tree = forest.find(candidate => candidate.tree.cardId === cardId);
    return tree ? forestSlots.reduce((total, slot) => total + getSlotCards(tree, slot).length, 0) : 0;
}

function countMatchingTreeSymbols(player: Player, ...symbols: string[]): number {
    const wanted = new Set(symbols);
    let count = 0;
    player.forest.forEach(tree => {
        if (!tree.isSapling && tree.tree.species[0] && wanted.has(tree.tree.species[0].treeSymbol)) count++;
    });
    getAllPlacedCards(player.forest).forEach(placedCard => {
        const species = placedCard.card.species[placedCard.speciesIndex];
        if (species && wanted.has(species.treeSymbol)) count++;
    });
    return count;
}

function findAttachedCard(forest: PlacedTree[], cardId: number) {
    for (const tree of forest) {
        for (const slot of forestSlots) {
            if (getSlotCards(tree, slot).some(placedCard => placedCard.card.cardId === cardId)) {
                return { tree, slot };
            }
        }
    }
    return undefined;
}

function hasBatOpposite(forest: PlacedTree[], cardId: number): boolean {
    const placement = findAttachedCard(forest, cardId);
    if (!placement) return false;
    const opposite = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' } as const;
    return getSlotCards(placement.tree, opposite[placement.slot]).some(placedCard =>
        getPlacedSpecies(placedCard)?.speciesData.tags.includes('Bat')
    );
}

function isOnlyAttachedCard(forest: PlacedTree[], cardId: number): boolean {
    const placement = findAttachedCard(forest, cardId);
    return Boolean(placement) && forestSlots.reduce(
        (total, slot) => total + getSlotCards(placement!.tree, slot).length,
        0
    ) === 1;
}

function isCardOnShrub(forest: PlacedTree[], cardId: number): boolean {
    const placement = findAttachedCard(forest, cardId);
    if (!placement) return false;
    const treeName = placement.tree.tree.species[0]?.speciesData.name;
    return treeName === 'Blackthorn' || treeName === 'Common Hazel' || treeName === 'Elderberry';
}

function calculateGlobalBonuses(player: Player): number {
    const butterflyPoints = calculateButterflySets(player);
    const horseChestnutAdjustment = countVioletCarpenterBeesAtTreeSpecies(
        player.forest,
        'Horse Chestnut'
    );
    return butterflyPoints +
        variableScore(player, 'Fireflies') +
        variableScore(player, 'Fire Salamander') +
        variableScore(player, 'Horse Chestnut', horseChestnutAdjustment);
}

function calculateButterflySets(player: Player): number {
    const speciesCounts = new Map<string, number>();
    getButterfliesInForest(player.forest).forEach(speciesName => {
        speciesCounts.set(speciesName, (speciesCounts.get(speciesName) ?? 0) + 1);
    });

    const numberOfSets = Math.max(0, ...speciesCounts.values());
    let points = 0;
    for (let setIndex = 0; setIndex < numberOfSets; setIndex++) {
        const differentSpecies = Array.from(speciesCounts.values()).filter(count => count > setIndex).length;
        points += BUTTERFLY_SET_POINTS[Math.min(differentSpecies, 8)] ?? 0;
    }
    return points;
}
