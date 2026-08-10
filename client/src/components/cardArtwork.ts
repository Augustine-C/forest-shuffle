import hCardsUrl from '../../../help/assets/hCards.jpg';
import mountainUrl from '../../../help/assets/mountain.jpg';
import treesUrl from '../../../help/assets/trees.jpg';
import vCardsUrl from '../../../help/assets/vCards.jpg';
import woodlandsUrl from '../../../help/assets/woodlands.jpg';
import type { EnhancedCard } from '../../../shared/types';

export interface CardArtworkStyle {
  backgroundImage: string;
  backgroundPosition: string;
  backgroundSize: string;
}

const percentage = (index: number, lastIndex: number) => `${(index / lastIndex) * 100}%`;

const gridPosition = (index: number, columns: number, rows: number) => {
  const column = index % columns;
  const row = Math.floor(index / columns);
  return `${percentage(column, columns - 1)} ${percentage(row, rows - 1)}`;
};

const basicTreeCell = (cardId: number) => {
  if (cardId <= 9) return 0;
  if (cardId <= 16) return 1;
  if (cardId <= 22) return 2;
  if (cardId <= 32) return 3;
  if (cardId <= 42) return 4;
  if (cardId <= 48) return 5;
  if (cardId <= 55) return 6;
  return 7;
};

/**
 * Maps the card ids from cardsData.json to the sprite sheets in help/assets.
 * The sheet layouts mirror the original reference CSS without requiring one
 * generated selector for every physical card id.
 */
export function getCardArtwork(card: EnhancedCard): CardArtworkStyle | undefined {
  const { cardId, deck, orientation } = card;

  if (deck === 'basic' && orientation === 'Tree') {
    return {
      backgroundImage: `url(${treesUrl})`,
      backgroundPosition: gridPosition(basicTreeCell(cardId), 5, 5),
      backgroundSize: '500% 500%'
    };
  }

  if (deck === 'basic' && orientation === 'wCard') {
    return {
      backgroundImage: `url(${treesUrl})`,
      backgroundPosition: '75% 25%',
      backgroundSize: '500% 500%'
    };
  }

  if (deck === 'basic' && orientation === 'hCard') {
    return {
      backgroundImage: `url(${hCardsUrl})`,
      backgroundPosition: gridPosition(cardId - 70, 7, 7),
      backgroundSize: '700% 700%'
    };
  }

  if (deck === 'basic' && orientation === 'vCard') {
    const sheetIndex = cardId - 113;
    const column = 6 - (sheetIndex % 7);
    const row = 6 - Math.floor(sheetIndex / 7);
    return {
      backgroundImage: `url(${vCardsUrl})`,
      backgroundPosition: `${percentage(column, 6)} ${percentage(row, 6)}`,
      backgroundSize: '700% 700%'
    };
  }

  if (deck === 'alpine') {
    const sheetIndex = orientation === 'Tree'
      ? cardId <= 168 ? 0 : 1
      : cardId - 174;
    return {
      backgroundImage: `url(${mountainUrl})`,
      backgroundPosition: gridPosition(sheetIndex, 7, 4),
      backgroundSize: '700% 400%'
    };
  }

  if (deck === 'edge') {
    return {
      backgroundImage: `url(${woodlandsUrl})`,
      backgroundPosition: gridPosition(cardId - 198, 6, 6),
      backgroundSize: '600% 600%'
    };
  }

  return undefined;
}
