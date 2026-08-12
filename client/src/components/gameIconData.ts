import type { CardTag, DeckType, TreeSymbol } from '../../../shared/types';

export type GameIconName =
  | 'alps' | 'amphibian' | 'bat' | 'beech' | 'birch' | 'bird' | 'butterfly'
  | 'cave' | 'cloven-hoofed-animal' | 'deer' | 'douglas-fir' | 'european-larch'
  | 'exploration' | 'horse-chestnut' | 'insect' | 'linden' | 'mushroom' | 'oak'
  | 'pawed-animal' | 'plant' | 'points' | 'silver-fir' | 'stone-pine'
  | 'sycamore' | 'tree' | 'woodland-edge';

const tagIcons: Record<CardTag, GameIconName> = {
  Tree: 'tree', Bird: 'bird', Plant: 'plant', Butterfly: 'butterfly',
  Mammal: 'pawed-animal', Amphibian: 'amphibian', Insect: 'insect',
  Arachnid: 'insect', Mushroom: 'mushroom', Alpine: 'alps', Bat: 'bat',
  Deer: 'deer', Beetle: 'insect', Paw: 'pawed-animal', Wing: 'bird',
  'Cloven-hoofed animal': 'cloven-hoofed-animal', Mountain: 'alps',
  'Woodland Edge': 'woodland-edge', Shrub: 'plant',
};

const treeIcons: Record<TreeSymbol, GameIconName> = {
  Birch: 'birch', Beech: 'beech', Linden: 'linden', Oak: 'oak',
  'Horse Chestnut': 'horse-chestnut', 'Douglas Fir': 'douglas-fir',
  'Silver Fir': 'silver-fir', Sycamore: 'sycamore',
  Larix: 'european-larch', Pinus: 'stone-pine',
};

const deckIcons: Record<DeckType, GameIconName> = {
  basic: 'tree', alpine: 'alps', edge: 'woodland-edge',
};

export const iconForTag = (tag: CardTag) => tagIcons[tag];
export const iconForTreeSymbol = (symbol: TreeSymbol) => treeIcons[symbol];
export const iconForDeck = (deck: DeckType) => deckIcons[deck];
