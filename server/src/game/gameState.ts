import { EnhancedCard, getCardCost } from './cards';
import { createDeck } from './deck';
import { executeEffect, executeBonus, drawCardsOneByOne, revealCardToClearing } from './effectsEngine';
import { calculatePlayerScore } from './scoringEngine';

export interface PlacedTree {
    tree: EnhancedCard;
    isSapling?: boolean;
    top?: EnhancedCard;
    bottom?: EnhancedCard;
    left?: EnhancedCard;
    right?: EnhancedCard;
    speciesIndices?: Partial<Record<'top' | 'bottom' | 'left' | 'right', number>>;
}

export interface Player {
    id: string;      // Stable persistent ID (UUID)
    socketId: string; // Current temporary socket ID
    name: string;
    isHost: boolean;
    hand: EnhancedCard[];
    forest: PlacedTree[];
    cave: EnhancedCard[]; // Cards in cave (score 1 point each)
}

export class GameState {
    players: Map<string, Player>;
    deck: EnhancedCard[];
    clearing: EnhancedCard[];
    activePlayerIndex: number;
    winterCardsDrawn: number;
    gameEnded: boolean;

    constructor(playerCount: number = 2) {
        this.players = new Map();
        this.deck = createDeck(playerCount);
        this.clearing = [];
        this.activePlayerIndex = 0;
        this.winterCardsDrawn = 0;
        this.gameEnded = false;
    }

    addPlayer(id: string, socketId: string, name: string, isHost: boolean = false) {
        this.players.set(id, {
            id,
            socketId,
            name,
            isHost,
            hand: [],
            forest: [],
            cave: []
        });
    }

    removePlayer(id: string) {
        this.players.delete(id);
    }

    startGame() {
        if (this.players.size < 2 || this.players.size > 5) {
            throw new Error('Forest Shuffle requires 2-5 players');
        }
        this.deck = createDeck(this.players.size);
        this.clearing = [];
        this.winterCardsDrawn = 0;
        this.gameEnded = false;
        this.activePlayerIndex = 0;
        this.players.forEach(player => {
            player.hand = [];
            player.forest = [];
            player.cave = [];
            // Draw 6 cards for each player
            this.drawCards(6, player);
        });
    }

    drawCards(count: number, targetPlayer?: Player): EnhancedCard[] {
        // Use provided player, or find the active player for context
        let player = targetPlayer;
        if (!player) {
            const activePlayerId = Array.from(this.players.keys())[this.activePlayerIndex];
            player = this.players.get(activePlayerId);
        }

        if (player) {
            return drawCardsOneByOne(this, player, count);
        } else {
            // Fallback for draws before game start
            const drawn: EnhancedCard[] = [];
            for (let i = 0; i < count; i++) {
                const card = this.deck.shift();
                if (card) {
                    drawn.push(card);
                    if (card.isWinterCard) {
                        this.winterCardsDrawn++;
                        if (this.winterCardsDrawn >= 3) this.gameEnded = true;
                    }
                }
            }
            return drawn;
        }
    }

    // Actions
    playerDrawsTwo(clearingCardIds: number[] = []) {
        const activePlayerId = Array.from(this.players.keys())[this.activePlayerIndex];
        const player = this.players.get(activePlayerId);
        if (!player) return;

        if (clearingCardIds.length > 2 || new Set(clearingCardIds).size !== clearingCardIds.length) {
            throw new Error('Choose at most two distinct clearing cards');
        }
        if (player.hand.length + clearingCardIds.length > 10) {
            throw new Error('Selected clearing cards exceed the hand limit');
        }

        const clearingIndexes = clearingCardIds.map(cardId =>
            this.clearing.findIndex(card => card.cardId === cardId)
        );
        if (clearingIndexes.some(index => index < 0)) {
            throw new Error('A selected card is no longer in the clearing');
        }

        clearingIndexes.sort((a, b) => b - a).forEach(index => {
            const [card] = this.clearing.splice(index, 1);
            player.hand.push(card);
        });
        this.drawCards(2 - clearingCardIds.length);

        this.nextTurn();
    }

    /**
     * Play a card - refactored for EnhancedCard
     * @param playerId Player ID
     * @param cardIdNum Numeric card ID from card database
     * @param costCardIds Array of card IDs to pay as cost
     * @param speciesIndex Which species on the card to play (0 or 1 for split cards)
     * @param targetTreeIndex Index of tree in forest to attach to (for non-tree cards)
     * @param targetSlot Which slot to place in
     */
    playCard(
        playerId: string,
        cardIdNum: number,
        costCardIds: number[],
        speciesIndex: number = 0,
        targetTreeIndex?: number,
        targetSlot?: 'top' | 'bottom' | 'left' | 'right',
        asSapling: boolean = false
    ) {
        const player = this.players.get(playerId);
        if (!player) throw new Error('Player not found');

        // 1. Find the card in hand by cardId
        const cardIndex = player.hand.findIndex(c => c.cardId === cardIdNum);
        if (cardIndex === -1) throw new Error('Card is not in player hand');
        const cardToPlay = player.hand[cardIndex];

        if (!Number.isInteger(speciesIndex) || !cardToPlay.species[speciesIndex]) {
            throw new Error('Invalid card side');
        }

        // 2. Validate and Pay Cost
        const requiredCost = asSapling ? 0 : getCardCost(cardToPlay, speciesIndex);

        if (player.hand.length - 1 < requiredCost) {
            throw new Error(`Not enough cards! Need ${requiredCost}, have ${player.hand.length - 1}`);
        }

        // Validate cost cards provided
        if (costCardIds.length !== requiredCost) {
            throw new Error(`Payment must contain exactly ${requiredCost} cards`);
        }

        if (new Set(costCardIds).size !== costCardIds.length) {
            throw new Error('Payment contains duplicate cards');
        }
        if (costCardIds.includes(cardIdNum)) {
            throw new Error('The played card cannot pay for itself');
        }
        if (costCardIds.some(id => !player.hand.some(card => card.cardId === id))) {
            throw new Error('Payment contains a card that is not in hand');
        }

        let targetTree: PlacedTree | undefined;
        if (!asSapling && cardToPlay.isSplitCard) {
            if (targetTreeIndex === undefined || targetSlot === undefined) {
                throw new Error('Split cards require a target tree and slot');
            }
            const validSlots = cardToPlay.orientation === 'vCard'
                ? ['top', 'bottom']
                : ['left', 'right'];
            if (!validSlots.includes(targetSlot)) {
                throw new Error('Card orientation is incompatible with target slot');
            }
            targetTree = player.forest[targetTreeIndex];
            if (!targetTree) throw new Error('Target tree does not exist');
            if (targetTree[targetSlot]) throw new Error('Target slot is already occupied');
        }

        // Remove cost cards from hand and add to clearing
        const paymentCards = costCardIds.map(cid => player.hand.find(card => card.cardId === cid)!);
        costCardIds.forEach(cid => {
            const idx = player.hand.findIndex(c => c.cardId === cid);
            if (idx !== -1) {
                const discarded = player.hand.splice(idx, 1)[0];
                this.clearing.push(discarded);
            }
        });

        // Remove the played card from hand (it might have shifted index)
        const newCardIndex = player.hand.findIndex(c => c.cardId === cardIdNum);
        player.hand.splice(newCardIndex, 1);

        // 3. Place the card
        let placedTree: PlacedTree | undefined = undefined;
        if (asSapling) {
            placedTree = { tree: cardToPlay, isSapling: true };
            player.forest.push(placedTree);
        } else if (cardToPlay.orientation === 'Tree') {
            // Playing as a tree
            placedTree = { tree: cardToPlay };
            player.forest.push(placedTree);
        } else if (cardToPlay.isSplitCard) {
            // Playing a split card (hCard or vCard) on a tree
            placedTree = targetTree;
            placedTree![targetSlot!] = cardToPlay;
            placedTree!.speciesIndices = {
                ...placedTree!.speciesIndices,
                [targetSlot!]: speciesIndex
            };
        } else {
            // Playing as sapling (face down)
            placedTree = { tree: cardToPlay };
            player.forest.push(placedTree);
        }

        // 4. Execute Effect
        if (cardToPlay.orientation === 'Tree' && !asSapling) {
            revealCardToClearing(this);
            if (this.gameEnded) return;
        }

        if (placedTree && !asSapling) {
            const effectResult = executeEffect({
                gameState: this,
                player,
                card: cardToPlay,
                speciesIndex,
                targetTree: placedTree,
                targetSlot
            });

            // Apply results (drawing cards, etc.)
            if (effectResult.cardsDrawn > 0) {
                drawCardsOneByOne(this, player, effectResult.cardsDrawn);
            }

            // Check for bonus if tree is completed
            const playedSpecies = cardToPlay.species[speciesIndex];
            const bonusActive = requiredCost > 0 && paymentCards.every(payment =>
                payment.species.some(species => species.treeSymbol === playedSpecies.treeSymbol)
            );
            const bonusResult = bonusActive ? executeBonus({
                gameState: this,
                player,
                card: cardToPlay,
                speciesIndex,
                targetTree: placedTree,
                targetSlot
            }) : undefined;
            if (bonusResult?.cardsDrawn) {
                drawCardsOneByOne(this, player, bonusResult.cardsDrawn);
            }

            if (effectResult.extraTurn || bonusResult?.extraTurn) {
                // Handle extra turn logic (don't call nextTurn)
                return;
            }
        }

        // 5. Update Clearing Wipe Logic
        if (this.clearing.length >= 10) {
            this.clearing = [];
        }

        this.nextTurn();
    }

    nextTurn() {
        if (!this.gameEnded) {
            this.activePlayerIndex = (this.activePlayerIndex + 1) % this.players.size;
        }
    }

    calculateScores(): Map<string, number> {
        const scores = new Map<string, number>();
        this.players.forEach(player => {
            scores.set(player.id, calculatePlayerScore(player, this));
        });
        return scores;
    }
}
