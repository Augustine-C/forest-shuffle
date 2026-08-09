/**
 * Effects Engine - Execute card effects and bonuses
 * Handles parsing and execution of card effect strings
 */

import { EnhancedCard, getCardEffect, getCardBonus } from './cards';
import { GameState, Player, PlacedTree } from './gameState';
import { countCardsWithTag, hasAnyCardWithTag } from './cardMatching';

/**
 * Context for executing effects
 */
export interface EffectContext {
    gameState: GameState;
    player: Player;
    card: EnhancedCard;
    speciesIndex: number;
    targetTree?: PlacedTree;
    targetSlot?: 'top' | 'bottom' | 'left' | 'right';
}

/**
 * Result of effect execution
 */
export interface EffectResult {
    cardsDrawn: number;
    cardsMoved: EnhancedCard[];
    extraTurn: boolean;
    bonusActions: string[];
    message?: string;
}

/**
 * Execute a card's effect
 */
export function executeEffect(context: EffectContext): EffectResult {
    const effectText = getCardEffect(context.card, context.speciesIndex);

    const result: EffectResult = {
        cardsDrawn: 0,
        cardsMoved: [],
        extraTurn: false,
        bonusActions: [],
    };

    if (!effectText) return result;

    // Parse and execute effect based on text pattern

    // Pattern: "Receive N card(s)"
    const drawMatch = effectText.match(/Receive (\d+) cards?/i);
    if (drawMatch) {
        const count = parseInt(drawMatch[1]);
        result.cardsDrawn = count;
        result.message = `Drew ${count} card(s)`;
        return result;
    }

    // Pattern: "Take another turn after this one"
    if (effectText.includes('Take another turn')) {
        result.extraTurn = true;
        result.message = 'Extra turn granted!';
        return result;
    }

    // Pattern: "Place all cards from the clearing in your cave"
    if (effectText.includes('Place all cards from the clearing in your cave')) {
        const clearingCards = [...context.gameState.clearing];
        result.cardsMoved = clearingCards;
        result.message = `Moved ${clearingCards.length} cards from clearing to cave`;
        return result;
    }

    // Pattern: "Place N cards from the clearing in your cave"
    const caveMatch = effectText.match(/Place (\d+) cards? from the clearing in your cave/i);
    if (caveMatch) {
        const count = parseInt(caveMatch[1]);
        result.bonusActions.push(`SELECT_${count}_FROM_CLEARING_TO_CAVE`);
        result.message = `Select ${count} card(s) from clearing to move to cave`;
        return result;
    }

    // Pattern: "Take N card(s) from the clearing"
    const takeMatch = effectText.match(/Take (\d+) cards? from the clearing/i);
    if (takeMatch) {
        const count = parseInt(takeMatch[1]);
        result.bonusActions.push(`SELECT_${count}_FROM_CLEARING_TO_HAND`);
        result.message = `Select ${count} card(s) from clearing`;
        return result;
    }

    // Pattern: "Any number of [species] may share this spot"
    if (effectText.includes('may share this spot')) {
        result.message = 'Special slot sharing enabled';
        // This is a passive effect - needs special handling in game state
        return result;
    }

    // Pattern: "Up to N [species] may share this spot"
    const shareMatch = effectText.match(/Up to (\d+) .+ may share this spot/i);
    if (shareMatch) {
        result.message = `Up to ${shareMatch[1]} cards can share this slot`;
        // Passive effect
        return result;
    }

    // Pattern: "Counts as a [species]"
    if (effectText.includes('Counts as')) {
        result.message = 'Card counts as another species';
        // Passive effect for scoring
        return result;
    }

    // Pattern: "Play any number of [tag] cards for free"
    const playFreeAnyMatch = effectText.match(/Play any number of (.+) cards for free/i);
    if (playFreeAnyMatch) {
        result.bonusActions.push(`PLAY_FREE_ANY_${playFreeAnyMatch[1].toUpperCase()}`);
        result.message = `Can play any number of ${playFreeAnyMatch[1]} cards for free`;
        return result;
    }

    // Pattern: "immediately play any number of cards by paying their cost"
    if (effectText.includes('immediately play any number of cards')) {
        result.bonusActions.push('PLAY_MULTIPLE_WITH_COST');
        result.message = 'Can play multiple cards immediately';
        return result;
    }

    // Pattern: "Place any number of cards from hand in your cave; draw an equal number"
    if (effectText.includes('Place any number of cards from hand in your cave')) {
        result.bonusActions.push('EXCHANGE_HAND_FOR_DECK');
        result.message = 'Exchange cards from hand to cave and draw equal amount';
        return result;
    }

    // Pattern: "Receive 1 card for each [species/tag]"
    const drawPerMatch = effectText.match(/Receive (\d+) cards? for each (.+)/i);
    if (drawPerMatch) {
        const perCard = parseInt(drawPerMatch[1]);
        const target = drawPerMatch[2];

        // Count the cards
        let count = 0;
        if (target.includes('Deer')) {
            count = countCardsWithTag(context.player.forest, 'Deer');
        } else if (target.includes('European Hare')) {
            // Count specific species
            // count = countSpeciesByName(context.player.forest, 'European Hare');
        }

        result.cardsDrawn = count * perCard;
        result.message = `Drew ${result.cardsDrawn} cards (${count} × ${perCard})`;
        return result;
    }

    // Pattern: "Whenever you play a card with [tag] receive 1 card"
    if (effectText.includes('Whenever you play a card with')) {
        // This is an ongoing trigger effect - needs to be registered
        result.bonusActions.push(`REGISTER_TRIGGER:${effectText}`);
        result.message = 'Ongoing effect registered';
        return result;
    }

    // Pattern: "The tree this [card] occupies counts as one additional tree"
    if (effectText.includes('counts as one additional tree')) {
        result.message = 'Tree counts double for scoring';
        // Passive scoring effect
        return result;
    }

    // Pattern: "Remove all cards in the clearing from the game"
    if (effectText.includes('Remove all cards in the clearing from the game')) {
        result.cardsMoved = [...context.gameState.clearing];
        result.message = `Removed ${result.cardsMoved.length} cards from game`;
        return result;
    }

    // Pattern: "Immediately play any number of cards as tree saplings"
    if (effectText.includes('play any number of cards from hand as tree saplings')) {
        result.bonusActions.push('PLAY_AS_SAPLINGS');
        result.message = 'Can play cards as tree saplings';
        return result;
    }

    // Default: Unknown effect
    result.message = `Effect not yet implemented: "${effectText}"`;
    return result;
}

/**
 * Execute a card's bonus (triggered when completing trees)
 */
export function executeBonus(context: EffectContext): EffectResult {
    const bonusText = getCardBonus(context.card, context.speciesIndex);

    const result: EffectResult = {
        cardsDrawn: 0,
        cardsMoved: [],
        extraTurn: false,
        bonusActions: [],
    };

    if (!bonusText) return result;

    // Most bonus patterns are similar to effects

    // Pattern: "Receive N card(s)"
    const drawMatch = bonusText.match(/Receive (\d+) cards?/i);
    if (drawMatch) {
        const count = parseInt(drawMatch[1]);
        result.cardsDrawn = count;
        result.message = `Bonus: Drew ${count} card(s)`;
        return result;
    }

    // Pattern: "Take another turn after this one"
    if (bonusText.includes('Take another turn')) {
        result.extraTurn = true;
        result.message = 'Bonus: Extra turn!';
        return result;
    }

    // Pattern: "Receive N cards and take another turn"
    const drawAndTurnMatch = bonusText.match(/Receive (\d+) cards? and take another turn/i);
    if (drawAndTurnMatch) {
        result.cardsDrawn = parseInt(drawAndTurnMatch[1]);
        result.extraTurn = true;
        result.message = `Bonus: Drew ${result.cardsDrawn} card(s) and get extra turn!`;
        return result;
    }

    // Pattern: "Play a card with [tag] for free"
    const playFreeMatch = bonusText.match(/Play a card with a (.+) symbol for free/i);
    if (playFreeMatch) {
        result.bonusActions.push(`PLAY_FREE_ONE_${playFreeMatch[1].toUpperCase()}`);
        result.message = `Bonus: Can play one ${playFreeMatch[1]} card for free`;
        return result;
    }

    // Pattern: "Play [specific cards] for free"
    if (bonusText.includes('Play a squeaker for free')) {
        result.bonusActions.push('PLAY_FREE_SQUEAKER');
        result.message = 'Bonus: Can play a squeaker for free';
        return result;
    }

    // Pattern: "Put N cards from the clearing into your cave"
    const caveBonusMatch = bonusText.match(/Put (\d+) cards? from the clearing into your cave/i);
    if (caveBonusMatch) {
        const count = parseInt(caveBonusMatch[1]);
        result.bonusActions.push(`SELECT_${count}_FROM_CLEARING_TO_CAVE`);
        result.message = `Bonus: Select ${count} card(s) from clearing for cave`;
        return result;
    }

    // Pattern: "Take all cards with [tag] from the clearing into your hand"
    const takeAllMatch = bonusText.match(/Take all cards with a (.+) symbol from the clearing/i);
    if (takeAllMatch) {
        result.bonusActions.push(`TAKE_ALL_${takeAllMatch[1].toUpperCase()}_FROM_CLEARING`);
        result.message = `Bonus: Take all ${takeAllMatch[1]} cards from clearing`;
        return result;
    }

    // Default
    result.message = `Bonus not yet implemented: "${bonusText}"`;
    return result;
}

/**
 * Helper: Draw cards one by one (as requested by user)
 * Checks for winter cards after each draw
 */
export function drawCardsOneByOne(
    gameState: GameState,
    player: Player,
    count: number
): EnhancedCard[] {
    const drawn: EnhancedCard[] = [];

    for (let i = 0; i < count; i++) {
        if (player.hand.length >= 10) {
            console.log(`✋ Hand limit reached (10 cards). Skipping draw.`);
            // Note: We don't shift the card if we can't take it, or we shift and put back? 
            // In FS, you just don't draw. So we should peek or break.
            break;
        }

        const card = gameState.deck.shift();
        if (!card) break; // Deck empty

        drawn.push(card);
        player.hand.push(card);

        // Check for winter card
        if (card.isWinterCard) {
            gameState.winterCardsDrawn++;
            console.log(`❄️ Winter card ${gameState.winterCardsDrawn}/3 drawn!`);

            if (gameState.winterCardsDrawn >= 3) {
                gameState.gameEnded = true;
                console.log('❄️❄️❄️ Game ends - all winter cards drawn!');
            }
        }
    }

    return drawn;
}
