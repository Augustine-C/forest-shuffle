import assert from 'node:assert/strict';
import { getEnhancedCards, isShrubCard } from './cards';
import { GameState, type PlacedTree } from './gameState';

const expectedSingleCardScores: Record<string, number> = {
    'Blackberries': 2,
    'Bullfinch': 0,
    'Camberwell Beauty': 0,
    'Chaffinch': 0,
    'Common Toad': 0,
    'Eurasian Jay': 3,
    'Fire Salamander': 5,
    'Fireflies': 0,
    'Goshawk': 3,
    'Great Spotted Woodpecker': 10,
    'Hedgehog': 0,
    'Large Tortoiseshell': 0,
    'Moss': 0,
    'Peacock Butterfly': 0,
    'Pond Turtle': 5,
    'Purple Emperor': 0,
    'Red Squirrel': 0,
    'Silver-Washed Fritillary': 0,
    'Stag Beetle': 0,
    'Tawny Owl': 5,
    'Tree Ferns': 0,
    'Tree Frog': 0,
    'Wild Strawberries': 0,
    'Wood Ant': 2,
    'Barbastelle Bat': 0,
    "Bechstein's Bat": 0,
    'Beech Marten': 0,
    'Brown Long-Eared Bat': 0,
    'European Badger': 2,
    'European Fat Dormouse': 0,
    'European Hare': 1,
    'Fallow Deer': 3,
    'Gnat': 0,
    'Greater Horseshoe Bat': 0,
    'Lynx': 0,
    'Red Deer': 1,
    'Red Fox': 0,
    'Roe Deer': 3,
    'Squeaker': 1,
    'Wild Boar': 0,
    'Wolf': 0,
    'Linden': 3,
    'Oak': 0,
    'Silver Fir': 0,
    'Birch': 1,
    'Beech': 0,
    'Sycamore': 1,
    'Douglas Fir': 5,
    'Horse Chestnut': 1,
    'Hypsugo savii': 0,
    'Larix decidua': 3,
    'Pinus cembra': 1,
    'Parnassius phoebus': 0,
    'Gentiana': 0,
    'Vaccinium myrtillus': 0,
    'Ichthyosaura Alpestris': 0,
    'Aquila chrysaetos': 0,
    'Corvus corax': 5,
    'Leontopodium nivale': 3,
    'Gypaetus barbatus': 0,
    'Capra ibex': 10,
    'Lepus timidus': 1,
    'Marmota marmota': 0,
    'Rupicapra rupicapra': 3,
    'Tetrao urogallus': 0,
    'Wild Boar (Female)': 0,
    'Bee Swarm': 0,
    'European Bison': 2,
    'European Wildcat': 1,
    'Common Pipistrelle': 0,
    'Crane Fly': 0,
    'European Polecat': 10,
    'Map Butterfly': 0,
    'Digitalis': 1,
    'Stinging Nettle': 0,
    'Great Green Bush-Cricket': 1,
    'Eurasian Magpie': 3,
    'Nightingale': 0,
    'Barn Owl': 0
};

const allCards = getEnhancedCards(['basic', 'alpine', 'edge']);
const scoredSpecies = new Set(allCards.flatMap(card => card.species
    .filter(species => species.speciesData.points)
    .map(species => species.speciesData.name)
));
assert.deepEqual(
    [...Object.keys(expectedSingleCardScores)].sort(),
    [...scoredSpecies].sort(),
    'every scored species must have an exact deterministic unit-test expectation'
);

Object.entries(expectedSingleCardScores).forEach(([speciesName, expected]) => {
    const card = allCards.find(candidate => candidate.species.some(species =>
        species.speciesData.name === speciesName
    ));
    assert.ok(card, `missing physical card for ${speciesName}`);
    const speciesIndex = card.species.findIndex(species => species.speciesData.name === speciesName);
    const game = new GameState(2);
    game.addPlayer('scorer', 'socket-scorer', 'Scorer', true);
    game.addPlayer('other', 'socket-other', 'Other');
    const player = game.players.get('scorer')!;

    if (card.orientation === 'Tree') {
        player.forest = [{ tree: card, isShrub: isShrubCard(card) }];
    } else {
        const host: PlacedTree = { tree: allCards.find(candidate => candidate.cardId === 1)!, isSapling: true };
        const slot = card.orientation === 'vCard'
            ? speciesIndex === 0 ? 'top' : 'bottom'
            : speciesIndex === 0 ? 'left' : 'right';
        host[slot] = [{ card, speciesIndex }];
        player.forest = [host];
    }

    assert.equal(game.calculateScores().get('scorer'), expected, speciesName);
});

console.log('✅ Deterministic scoring checks passed for every supported species');
