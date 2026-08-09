import { EnhancedCard, getCardCost } from './cards';
import { createDeck } from './deck';
import { executeEffect, executeBonus, drawCardsOneByOne, revealCardToClearing } from './effectsEngine';
import { calculatePlayerScore } from './scoringEngine';
import type { PendingAction } from '../../../shared/types';
import type { CardTag } from './cardDefinitions';

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
    pendingAction?: PendingAction;
    private pendingActions: PendingAction[];
    private extraTurnsPending: number;

    constructor(playerCount: number = 2) {
        this.players = new Map();
        this.deck = createDeck(playerCount);
        this.clearing = [];
        this.activePlayerIndex = 0;
        this.winterCardsDrawn = 0;
        this.gameEnded = false;
        this.pendingActions = [];
        this.extraTurnsPending = 0;
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
        this.pendingAction = undefined;
        this.pendingActions = [];
        this.extraTurnsPending = 0;
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
    playerDrawsTwo(playerId: string, clearingCardIds: number[] = []) {
        this.assertActionAllowed(playerId);
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

        this.finishTurn();
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
        this.playCardInternal(
            playerId,
            cardIdNum,
            costCardIds,
            speciesIndex,
            targetTreeIndex,
            targetSlot,
            asSapling,
            false,
            false
        );
    }

    private playCardInternal(
        playerId: string,
        cardIdNum: number,
        costCardIds: number[],
        speciesIndex: number,
        targetTreeIndex: number | undefined,
        targetSlot: 'top' | 'bottom' | 'left' | 'right' | undefined,
        asSapling: boolean,
        freePlay: boolean = false,
        suppressEffectsAndBonus: boolean = false,
        pendingPaidPlay: boolean = false
    ) {
        if (freePlay) this.assertPendingFreePlayAllowed(playerId, cardIdNum, speciesIndex);
        else if (pendingPaidPlay) this.assertPendingPaidPlayAllowed(playerId);
        else this.assertActionAllowed(playerId);
        const resolvingPendingAction = freePlay || pendingPaidPlay ? this.pendingAction : undefined;
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
        const requiredCost = asSapling || freePlay ? 0 : getCardCost(cardToPlay, speciesIndex);

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
            if (this.gameEnded) {
                this.clearPendingActions();
                return;
            }
        }

        if (placedTree && !asSapling && !suppressEffectsAndBonus) {
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

            if (this.gameEnded) {
                this.clearPendingActions();
                return;
            }

            const pendingActions = [
                ...this.createPendingActions(player, effectResult.bonusActions),
                ...this.createPendingActions(player, bonusResult?.bonusActions ?? [])
            ];
            const awardedExtraTurns = Number(effectResult.extraTurn) + Number(Boolean(bonusResult?.extraTurn));
            this.extraTurnsPending += awardedExtraTurns;
            if (pendingActions.length > 0) {
                const resumeActions = resolvingPendingAction
                    ? [resolvingPendingAction, ...this.pendingActions]
                    : this.pendingActions;
                this.pendingActions = [...pendingActions, ...resumeActions];
                this.pendingAction = this.pendingActions.shift();
                return;
            }

            if (resolvingPendingAction) return;
            if (awardedExtraTurns > 0) {
                this.finishTurn();
                return;
            }
        }

        if (freePlay) {
            if (this.pendingAction?.kind === 'playFreeCard' && this.pendingAction.repeatable) return;
            this.completePendingAction();
            return;
        }
        if (pendingPaidPlay) return;

        // 5. Update Clearing Wipe Logic
        if (this.clearing.length >= 10) {
            this.clearing = [];
        }

        this.finishTurn();
    }

    resolvePendingAction(playerId: string, cardIds: number[] = [], decline: boolean = false) {
        if (this.gameEnded) throw new Error('The game has ended');
        const action = this.pendingAction;
        if (!action) throw new Error('There is no pending action');
        if (action.playerId !== playerId) throw new Error('This pending action belongs to another player');

        const activePlayerId = Array.from(this.players.keys())[this.activePlayerIndex];
        if (activePlayerId !== playerId) throw new Error('Not your turn');
        if (decline) {
            if (!action.optional) throw new Error('This action cannot be declined');
            if (cardIds.length > 0) throw new Error('Do not select cards when declining an action');
            this.completePendingAction();
            return;
        }

        if (action.kind !== 'selectClearingCards') {
            if (action.kind === 'exchangeHandForDeck') {
                this.resolveHandExchange(playerId, cardIds);
                return;
            }
            if (action.kind === 'playSaplings') {
                this.resolveSaplingSelection(playerId, cardIds);
                return;
            }
            throw new Error('This pending action must be completed by playing a card');
        }

        if (new Set(cardIds).size !== cardIds.length) {
            throw new Error('Selection contains duplicate cards');
        }
        if (cardIds.length !== action.count) {
            throw new Error(`Select exactly ${action.count} card(s)`);
        }

        const player = this.players.get(playerId)!;
        if (action.destination === 'hand' && player.hand.length + cardIds.length > 10) {
            throw new Error('Selected cards exceed the hand limit');
        }
        const indexes = cardIds.map(cardId => this.clearing.findIndex(card => card.cardId === cardId));
        if (indexes.some(index => index < 0)) {
            throw new Error('A selected card is no longer in the clearing');
        }

        const selectedCards = indexes.map(index => this.clearing[index]);
        indexes.sort((a, b) => b - a).forEach(index => this.clearing.splice(index, 1));
        if (action.destination === 'hand') player.hand.push(...selectedCards);
        else player.cave.push(...selectedCards);

        this.completePendingAction();
    }

    playPendingFreeCard(
        playerId: string,
        cardIdNum: number,
        speciesIndex: number = 0,
        targetTreeIndex?: number,
        targetSlot?: 'top' | 'bottom' | 'left' | 'right'
    ) {
        const action = this.pendingAction;
        if (!action || action.kind !== 'playFreeCard') {
            throw new Error('There is no pending free-card action');
        }
        this.playCardInternal(
            playerId,
            cardIdNum,
            [],
            speciesIndex,
            targetTreeIndex,
            targetSlot,
            false,
            true,
            action.suppressEffectsAndBonus
        );
    }

    playPendingPaidCard(
        playerId: string,
        cardIdNum: number,
        costCardIds: number[],
        speciesIndex: number = 0,
        targetTreeIndex?: number,
        targetSlot?: 'top' | 'bottom' | 'left' | 'right',
        asSapling: boolean = false
    ) {
        this.playCardInternal(
            playerId,
            cardIdNum,
            costCardIds,
            speciesIndex,
            targetTreeIndex,
            targetSlot,
            asSapling,
            false,
            false,
            true
        );
    }

    private assertActionAllowed(playerId: string) {
        if (this.gameEnded) throw new Error('The game has ended');
        const activePlayerId = Array.from(this.players.keys())[this.activePlayerIndex];
        if (activePlayerId !== playerId) throw new Error('Not your turn');
        if (this.pendingAction) throw new Error('Resolve the pending action first');
    }

    private resolveHandExchange(playerId: string, cardIds: number[]) {
        if (new Set(cardIds).size !== cardIds.length) {
            throw new Error('Selection contains duplicate cards');
        }
        const player = this.players.get(playerId)!;
        const indexes = cardIds.map(cardId => player.hand.findIndex(card => card.cardId === cardId));
        if (indexes.some(index => index < 0)) {
            throw new Error('Every exchanged card must be in your hand');
        }

        const selectedCards = indexes.map(index => player.hand[index]);
        indexes.sort((a, b) => b - a).forEach(index => player.hand.splice(index, 1));
        player.cave.push(...selectedCards);
        drawCardsOneByOne(this, player, selectedCards.length);

        if (this.gameEnded) {
            this.clearPendingActions();
            return;
        }
        this.completePendingAction();
    }

    private resolveSaplingSelection(playerId: string, cardIds: number[]) {
        if (new Set(cardIds).size !== cardIds.length) {
            throw new Error('Selection contains duplicate cards');
        }
        const player = this.players.get(playerId)!;
        const indexes = cardIds.map(cardId => player.hand.findIndex(card => card.cardId === cardId));
        if (indexes.some(index => index < 0)) {
            throw new Error('Every sapling card must be in your hand');
        }

        const selectedCards = indexes.map(index => player.hand[index]);
        indexes.sort((a, b) => b - a).forEach(index => player.hand.splice(index, 1));
        player.forest.push(...selectedCards.map(card => ({ tree: card, isSapling: true })));

        for (let index = 0; index < selectedCards.length && !this.gameEnded; index++) {
            revealCardToClearing(this);
        }
        if (this.gameEnded) {
            this.clearPendingActions();
            return;
        }
        this.completePendingAction();
    }

    private assertPendingFreePlayAllowed(playerId: string, cardIdNum: number, speciesIndex: number) {
        if (this.gameEnded) throw new Error('The game has ended');
        const action = this.pendingAction;
        if (!action || action.kind !== 'playFreeCard') {
            throw new Error('There is no pending free-card action');
        }
        if (action.playerId !== playerId) throw new Error('This pending action belongs to another player');
        const activePlayerId = Array.from(this.players.keys())[this.activePlayerIndex];
        if (activePlayerId !== playerId) throw new Error('Not your turn');

        const player = this.players.get(playerId);
        const card = player?.hand.find(candidate => candidate.cardId === cardIdNum);
        if (!card) throw new Error('Card is not in player hand');
        const species = card.species[speciesIndex];
        if (!species) throw new Error('Invalid card side');
        if (action.eligibleTag && !species.speciesData.tags.some(tag =>
            tag.toLowerCase() === action.eligibleTag!.toLowerCase()
        )) {
            throw new Error(`The selected card side must have a ${action.eligibleTag} symbol`);
        }
        if (action.eligibleSpecies && species.name.toLowerCase() !== action.eligibleSpecies.toLowerCase()) {
            throw new Error(`The selected card side must be ${action.eligibleSpecies}`);
        }
    }

    private assertPendingPaidPlayAllowed(playerId: string) {
        if (this.gameEnded) throw new Error('The game has ended');
        const action = this.pendingAction;
        if (!action || action.kind !== 'playPaidCards') {
            throw new Error('There is no pending paid-card action');
        }
        if (action.playerId !== playerId) throw new Error('This pending action belongs to another player');
        const activePlayerId = Array.from(this.players.keys())[this.activePlayerIndex];
        if (activePlayerId !== playerId) throw new Error('Not your turn');
    }

    private createPendingActions(player: Player, actionCodes: string[]): PendingAction[] {
        return actionCodes.flatMap<PendingAction>(actionCode => {
            const match = actionCode.match(/^SELECT_(\d+)_FROM_CLEARING_TO_(HAND|CAVE)$/);
            if (match) {
                const destination = match[2] === 'HAND' ? 'hand' : 'cave';
                const capacity = destination === 'hand' ? Math.max(0, 10 - player.hand.length) : this.clearing.length;
                const count = Math.min(Number(match[1]), this.clearing.length, capacity);
                if (count === 0) return [];
                return [{
                    kind: 'selectClearingCards' as const,
                    playerId: player.id,
                    destination,
                    count,
                    optional: true,
                    prompt: `${destination === 'hand' ? 'Take' : 'Place'} ${count} clearing card(s) ${destination === 'hand' ? 'into your hand' : 'in your cave'}`
                }];
            }

            if (actionCode === 'PLAY_FREE_SQUEAKER') {
                return [{
                    kind: 'playFreeCard' as const,
                    playerId: player.id,
                    eligibleSpecies: 'Squeaker',
                    suppressEffectsAndBonus: true,
                    optional: true,
                    prompt: 'Play a Squeaker for free'
                }];
            }

            if (actionCode === 'PLAY_MULTIPLE_WITH_COST') {
                return [{
                    kind: 'playPaidCards' as const,
                    playerId: player.id,
                    optional: true,
                    prompt: 'Play any number of cards by paying their combined costs'
                }];
            }

            if (actionCode === 'EXCHANGE_HAND_FOR_DECK') {
                return [{
                    kind: 'exchangeHandForDeck' as const,
                    playerId: player.id,
                    optional: true,
                    prompt: 'Place any number of hand cards in your cave, then draw the same number'
                }];
            }

            if (actionCode === 'PLAY_AS_SAPLINGS') {
                return [{
                    kind: 'playSaplings' as const,
                    playerId: player.id,
                    optional: true,
                    prompt: 'Play any number of cards from your hand as tree saplings'
                }];
            }

            const freeAnyMatch = actionCode.match(/^PLAY_FREE_ANY_(.+?)(?: CARDS?)?$/);
            if (freeAnyMatch) {
                const tag = this.normalizeCardTag(freeAnyMatch[1]);
                if (!tag) return [];
                return [{
                    kind: 'playFreeCard' as const,
                    playerId: player.id,
                    eligibleTag: tag,
                    repeatable: true,
                    suppressEffectsAndBonus: false,
                    optional: true,
                    prompt: `Play any number of cards with a ${tag} symbol for free`
                }];
            }

            const freePlayMatch = actionCode.match(/^PLAY_FREE_ONE_(.+)$/);
            if (!freePlayMatch) return [];
            const tag = this.normalizeCardTag(freePlayMatch[1]);
            if (!tag) return [];
            return [{
                kind: 'playFreeCard' as const,
                playerId: player.id,
                eligibleTag: tag,
                suppressEffectsAndBonus: true,
                optional: true,
                prompt: `Play a card with a ${tag} symbol for free`
            }];
        });
    }

    private normalizeCardTag(value: string): CardTag | undefined {
        const tags: CardTag[] = [
            'Tree', 'Bird', 'Plant', 'Butterfly', 'Mammal', 'Amphibian', 'Insect',
            'Arachnid', 'Mushroom', 'Alpine', 'Bat', 'Deer', 'Beetle', 'Paw', 'Wing',
            'Cloven-hoofed animal', 'Mountain', 'Woodland Edge', 'Shrub'
        ];
        return tags.find(tag => tag.toLowerCase() === value.trim().toLowerCase());
    }

    private completePendingAction() {
        this.pendingAction = this.pendingActions.shift();
        if (this.pendingAction) return;

        this.finishTurn();
    }

    private clearPendingActions() {
        this.pendingAction = undefined;
        this.pendingActions = [];
        this.extraTurnsPending = 0;
    }

    private finishTurn() {
        if (this.clearing.length >= 10) this.clearing = [];
        if (this.extraTurnsPending > 0) {
            this.extraTurnsPending--;
            return;
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
