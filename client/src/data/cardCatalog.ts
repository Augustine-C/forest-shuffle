import cardsDataJson from '../../../server/src/game/data/cardsData.json';
import speciesDataJson from '../../../server/src/game/data/speciesData.json';
import type { CardData, EnhancedCard, SpeciesData } from '../../../shared/types';

const cardsData = cardsDataJson as Record<string, CardData>;
const speciesData = speciesDataJson as Record<string, SpeciesData>;
const normalizeSpeciesKey = (name: string) => name.toLowerCase().replace(/[^a-z0-9]/g, '');

const speciesByNormalizedKey = Object.entries(speciesData).reduce<Record<string, SpeciesData>>(
  (index, [key, species]) => {
    index[normalizeSpeciesKey(key)] = species;
    return index;
  },
  {}
);

const getSpeciesData = (name: string) => {
  const data = speciesData[name] ?? speciesByNormalizedKey[normalizeSpeciesKey(name)];
  if (!data) throw new Error(`Missing species data for ${name}`);
  return data;
};

export const cardCatalog: EnhancedCard[] = Object.entries(cardsData)
  .map(([cardId, cardData]) => ({
    cardId: Number(cardId),
    cardData,
    orientation: cardData.type as EnhancedCard['orientation'],
    deck: cardData.deck,
    species: cardData.species
      .filter(Boolean)
      .map((name, index) => ({
        name,
        speciesData: getSpeciesData(name),
        treeSymbol: cardData.tree_symbol?.[index]
      })),
    isWinterCard: cardData.type === 'wCard',
    isSplitCard: cardData.type === 'hCard' || cardData.type === 'vCard'
  }))
  .sort((left, right) => left.cardId - right.cardId);
