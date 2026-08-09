import assert from 'node:assert/strict';
import { createEnhancedCard, getEnhancedCards } from './cards';
import { GameState, type PlacedTree } from './gameState';

const allCards = getEnhancedCards(['basic', 'alpine', 'edge']);

function scoreVisibleSpecies(speciesNames: string[], caveCount = 0): number {
    const game = new GameState(2);
    game.addPlayer('fixture', 'socket-fixture', 'Fixture Player', true);
    game.addPlayer('other', 'socket-other', 'Other Player');
    const player = game.players.get('fixture')!;
    const usedCardIds = new Set<number>();

    player.forest = speciesNames.map(speciesName => {
        const card = allCards.find(candidate =>
            !usedCardIds.has(candidate.cardId) &&
            candidate.species.some(species => species.speciesData.name === speciesName)
        );
        assert.ok(card, `missing unused card for ${speciesName}`);
        usedCardIds.add(card.cardId);
        const speciesIndex = card.species.findIndex(species => species.speciesData.name === speciesName);
        if (card.orientation === 'Tree') return { tree: card };

        const slot = card.orientation === 'vCard'
            ? speciesIndex === 0 ? 'top' : 'bottom'
            : speciesIndex === 0 ? 'left' : 'right';
        const tree: PlacedTree = { tree: createEnhancedCard(1)!, isSapling: true };
        tree[slot] = [{ card, speciesIndex }];
        return tree;
    });
    player.cave = Array.from({ length: caveCount }, (_, index) => createEnhancedCard(30 + index)!);
    return game.calculateScores().get('fixture')!;
}

interface ScoringFixture {
    source: string;
    name: string;
    species: string[];
    caveCount?: number;
    expected: number;
}

const fixtures: ScoringFixture[] = [
    // help/game-rules/rules.md: visible forest points plus one point per cave card.
    { source: 'rulebook cave scoring', name: 'three cave cards', species: [], caveCount: 3, expected: 3 },

    // help/game-rules/appendix.md: European Hare total-points table.
    { source: 'appendix European Hare table', name: 'one hare', species: ['European Hare'], expected: 1 },
    { source: 'appendix European Hare table', name: 'two hares', species: ['European Hare', 'European Hare'], expected: 4 },
    { source: 'appendix European Hare table', name: 'three hares', species: ['European Hare', 'European Hare', 'European Hare'], expected: 9 },

    // help/game-rules/appendix.md: butterfly set table.
    {
        source: 'appendix butterfly table',
        name: 'two different butterflies',
        species: ['Camberwell Beauty', 'Large Tortoiseshell'],
        expected: 3
    },
    {
        source: 'appendix butterfly table',
        name: 'four different butterflies',
        species: ['Camberwell Beauty', 'Large Tortoiseshell', 'Peacock Butterfly', 'Purple Emperor'],
        expected: 12
    },

    // help/game-rules/appendix.md: Horse Chestnut and Beech total-points tables.
    {
        source: 'appendix Horse Chestnut table',
        name: 'four Horse Chestnuts',
        species: ['Horse Chestnut', 'Horse Chestnut', 'Horse Chestnut', 'Horse Chestnut'],
        expected: 16
    },
    {
        source: 'appendix Beech table',
        name: 'four Beeches',
        species: ['Beech', 'Beech', 'Beech', 'Beech'],
        expected: 20
    }
];

fixtures.forEach(fixture => {
    assert.equal(
        scoreVisibleSpecies(fixture.species, fixture.caveCount),
        fixture.expected,
        `${fixture.source}: ${fixture.name}`
    );
});

console.log(`✅ ${fixtures.length} published scoring fixtures passed`);
