import { EnhancedCard, getCardBonus, getCardCost, getCardEffect } from './cards';
import { createDeck } from './deck';
import { executeEffect, executeBonus, drawCardsOneByOne, revealCardToClearing } from './effectsEngine';
import { calculatePlayerScore } from './scoringEngine';
import type { PendingAction, TriggeredDrawChoice } from '../../../shared/types';
import type { CardTag } from './cardDefinitions';
import type { DeckType } from './cardDefinitions';

export interface PlacedCard {
    card: EnhancedCard;
    speciesIndex: number;
    playedTurn?: number;
}

export interface PlacedTree {
    tree: EnhancedCard;
    isSapling?: boolean;
    treePlayedTurn?: number;
    top?: PlacedCard[];
    bottom?: PlacedCard[];
    left?: PlacedCard[];
    right?: PlacedCard[];
}

interface DeferredCardResolution {
    player: Player;
    card: EnhancedCard;
    speciesIndex: number;
    placedTree: PlacedTree;
    targetSlot?: 'top' | 'bottom' | 'left' | 'right';
    bonusActive: boolean;
    resolvingPendingAction?: PendingAction;
    freePlay: boolean;
    pendingPaidPlay: boolean;
    suppressEffectsAndBonus: boolean;
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
    cardsRemovedFromGame: EnhancedCard[];
    pendingAction?: PendingAction;
    private pendingActions: PendingAction[];
    private extraTurnsPending: number;
    turnNumber: number;
    startingPlayerId: string;
    includedDecks: DeckType[];
    private deferredCardResolution?: DeferredCardResolution;
    private triggeredDrawCompletion?: 'resumeCard' | 'completeAction';
    private deferredChoiceResolutions: Map<string, DeferredCardResolution>;
    private deferredBonusResolutions: Map<string, { resolution: DeferredCardResolution; useBonus: boolean }>;
    private resolutionSequence: number;
    private mulliganResolved: Set<string>;

    constructor(playerCount: number = 2) {
        this.players = new Map();
        this.deck = createDeck(playerCount);
        this.clearing = [];
        this.activePlayerIndex = 0;
        this.winterCardsDrawn = 0;
        this.gameEnded = false;
        this.cardsRemovedFromGame = [];
        this.pendingActions = [];
        this.extraTurnsPending = 0;
        this.turnNumber = 0;
        this.startingPlayerId = '';
        this.includedDecks = ['basic'];
        this.deferredChoiceResolutions = new Map();
        this.deferredBonusResolutions = new Map();
        this.resolutionSequence = 0;
        this.mulliganResolved = new Set();
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

    startGame(startingPlayerId?: string, includedDecks: DeckType[] = ['basic']) {
        if (this.players.size < 2 || this.players.size > 5) {
            throw new Error('Forest Shuffle requires 2-5 players');
        }
        const selectedStartingPlayerId = startingPlayerId ?? Array.from(this.players.keys())[0];
        if (!this.players.has(selectedStartingPlayerId)) {
            throw new Error('Starting player must be in the game');
        }
        const uniqueDecks = [...new Set(includedDecks)];
        if (!uniqueDecks.includes('basic') || uniqueDecks.some(deck =>
            deck !== 'basic' && deck !== 'alpine' && deck !== 'edge'
        )) {
            throw new Error('The base deck is required and every selected deck must be supported');
        }
        this.startingPlayerId = selectedStartingPlayerId;
        this.includedDecks = uniqueDecks;
        this.deck = createDeck(this.players.size, this.includedDecks);
        this.clearing = [];
        this.winterCardsDrawn = 0;
        this.gameEnded = false;
        this.cardsRemovedFromGame = [];
        this.pendingAction = undefined;
        this.pendingActions = [];
        this.extraTurnsPending = 0;
        this.turnNumber = 0;
        this.deferredCardResolution = undefined;
        this.triggeredDrawCompletion = undefined;
        this.deferredChoiceResolutions.clear();
        this.deferredBonusResolutions.clear();
        this.resolutionSequence = 0;
        this.mulliganResolved.clear();
        this.activePlayerIndex = 0;
        this.players.forEach(player => {
            player.hand = [];
            player.forest = [];
            player.cave = [];
            // Draw 6 cards for each player
            this.drawCards(6, player);
        });
        this.prepareInitialMulligans();
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
    playerDrawsTwo(playerId: string) {
        this.assertActionAllowed(playerId);
        const activePlayerId = Array.from(this.players.keys())[this.activePlayerIndex];
        const player = this.players.get(activePlayerId);
        if (!player) return;

        const drawCapacity = 10 - player.hand.length;
        if (drawCapacity <= 0) {
            throw new Error('A player with 10 cards must play a card');
        }
        const cardsToDraw = Math.min(2, drawCapacity);
        this.pendingAction = {
            kind: 'chooseDrawSource',
            playerId,
            remaining: cardsToDraw,
            optional: false,
            prompt: `Choose the source for card 1 of ${cardsToDraw}`
        };
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
            const existingCards = targetTree[targetSlot] ?? [];
            const playedSpeciesName = cardToPlay.species[speciesIndex].speciesData.name;
            if (playedSpeciesName === 'Cuckoo' && !this.canShareSlot(
                targetTree,
                targetSlot,
                cardToPlay,
                speciesIndex,
                freePlay || pendingPaidPlay
            )) {
                throw new Error('Cuckoo must share a top slot with exactly one bird');
            }
            if (playedSpeciesName !== 'Cuckoo' && existingCards.length > 0 && !this.canShareSlot(
                targetTree,
                targetSlot,
                cardToPlay,
                speciesIndex,
                freePlay || pendingPaidPlay
            )) {
                throw new Error('The selected card cannot share this occupied slot');
            }
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
            placedTree = { tree: cardToPlay, isSapling: true, treePlayedTurn: this.turnNumber };
            player.forest.push(placedTree);
        } else if (cardToPlay.orientation === 'Tree') {
            // Playing as a tree
            placedTree = { tree: cardToPlay, treePlayedTurn: this.turnNumber };
            player.forest.push(placedTree);
        } else if (cardToPlay.isSplitCard) {
            // Playing a split card (hCard or vCard) on a tree
            placedTree = targetTree;
            const slotCards = placedTree![targetSlot!] ?? [];
            placedTree![targetSlot!] = [
                ...slotCards,
                { card: cardToPlay, speciesIndex, playedTurn: this.turnNumber }
            ];
        } else {
            // Playing as sapling (face down)
            placedTree = { tree: cardToPlay, treePlayedTurn: this.turnNumber };
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

        if (placedTree && !asSapling) {
            const playedSpecies = cardToPlay.species[speciesIndex];
            const bonusActive = requiredCost > 0 && paymentCards.every(payment =>
                payment.species.some(species => species.treeSymbol === playedSpecies.treeSymbol)
            );
            const resolution: DeferredCardResolution = {
                player,
                card: cardToPlay,
                speciesIndex,
                placedTree,
                targetSlot,
                bonusActive,
                resolvingPendingAction,
                freePlay,
                pendingPaidPlay,
                suppressEffectsAndBonus
            };
            const triggers = this.getPermanentTriggers(player, cardToPlay, speciesIndex, placedTree, targetSlot);
            if (triggers.length > 0) {
                this.deferredCardResolution = resolution;
                this.triggeredDrawCompletion = 'resumeCard';
                this.pendingAction = {
                    kind: 'triggeredDraws',
                    playerId: player.id,
                    triggers,
                    optional: true,
                    prompt: 'Choose the order of permanent-effect draws'
                };
                return;
            }
            this.resolveCardEffects(resolution);
            return;
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

    resolvePendingAction(
        playerId: string,
        cardIds: number[] = [],
        decline: boolean = false,
        choiceId?: string,
        useEffect: boolean = false,
        useBonus: boolean = false
    ) {
        if (this.gameEnded) throw new Error('The game has ended');
        const action = this.pendingAction;
        if (!action) throw new Error('There is no pending action');
        if (action.playerId !== playerId) throw new Error('This pending action belongs to another player');

        if (action.kind === 'initialMulligan') {
            if (cardIds.length > 0) throw new Error('Do not select cards for a mulligan');
            this.resolveInitialMulligan(playerId, decline);
            return;
        }

        const activePlayerId = Array.from(this.players.keys())[this.activePlayerIndex];
        if (activePlayerId !== playerId) throw new Error('Not your turn');
        if (action.kind === 'chooseDrawSource') {
            if (decline) throw new Error('A draw-source choice cannot be declined');
            this.resolveDrawSource(action, cardIds, choiceId);
            return;
        }
        if (action.kind === 'chooseCardEffectAndBonus') {
            this.resolveCardChoices(action, useEffect, useBonus);
            return;
        }
        if (action.kind === 'triggeredDraws') {
            this.resolveTriggeredDraw(action, cardIds, decline, choiceId);
            return;
        }
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
            if (action.kind === 'takeAllMatching') {
                this.resolveTakeAllMatching(playerId, cardIds, action.eligibleTag);
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

    private canShareSlot(
        tree: PlacedTree,
        slot: 'top' | 'bottom' | 'left' | 'right',
        card: EnhancedCard,
        speciesIndex: number,
        playedViaEffect: boolean
    ): boolean {
        const existingCards = tree[slot] ?? [];
        const species = card.species[speciesIndex];
        const existingSpecies = existingCards.map(placedCard =>
            placedCard.card.species[placedCard.speciesIndex]
        );

        if (species.speciesData.name === 'European Hare') {
            return existingSpecies.every(existing => existing?.speciesData.name === 'European Hare') &&
                (playedViaEffect || existingCards.some(existing =>
                    existing.playedTurn === undefined || existing.playedTurn < this.turnNumber
                ));
        }
        if (species.speciesData.name === 'Common Toad') {
            return existingCards.length === 1 &&
                existingSpecies[0]?.speciesData.name === 'Common Toad' &&
                (existingCards[0].playedTurn === undefined || existingCards[0].playedTurn < this.turnNumber);
        }
        if (species.speciesData.name === 'Cuckoo') {
            return slot === 'top' && existingCards.length === 1 &&
                existingSpecies[0]?.speciesData.tags.includes('Bird') === true;
        }
        if (species.speciesData.tags.includes('Butterfly') && this.treeHasStingingNettle(tree)) {
            return existingSpecies.every(existing => existing?.speciesData.tags.includes('Butterfly'));
        }
        return false;
    }

    private treeHasStingingNettle(tree: PlacedTree): boolean {
        return (['top', 'bottom', 'left', 'right'] as const).some(slot =>
            (tree[slot] ?? []).some(placedCard =>
                placedCard.card.species[placedCard.speciesIndex]?.speciesData.name === 'Stinging Nettle'
            )
        );
    }

    private resolveCardEffects(resolution: DeferredCardResolution) {
        if (resolution.suppressEffectsAndBonus) {
            if (resolution.freePlay && resolution.resolvingPendingAction?.kind === 'playFreeCard') {
                this.pendingAction = resolution.resolvingPendingAction;
                if (!resolution.resolvingPendingAction.repeatable) this.completePendingAction();
                return;
            }
            if (resolution.resolvingPendingAction) {
                this.pendingAction = resolution.resolvingPendingAction;
                return;
            }
            this.finishTurn();
            return;
        }
        const effectText = getCardEffect(resolution.card, resolution.speciesIndex);
        const bonusText = resolution.bonusActive
            ? getCardBonus(resolution.card, resolution.speciesIndex)
            : '';
        const selectableEffectText = this.isSelectableEffect(effectText) ? effectText : undefined;
        const selectableBonusText = bonusText || undefined;
        if (!selectableEffectText && !selectableBonusText) {
            this.applyCardChoices(resolution, false, false);
            return;
        }

        const resolutionId = `resolution-${++this.resolutionSequence}`;
        this.deferredChoiceResolutions.set(resolutionId, resolution);
        this.pendingAction = {
            kind: 'chooseCardEffectAndBonus',
            playerId: resolution.player.id,
            resolutionId,
            cardName: resolution.card.species[resolution.speciesIndex].speciesData.name,
            effectText: selectableEffectText,
            bonusText: selectableBonusText,
            optional: false,
            prompt: 'Choose which card abilities to use'
        };
    }

    private isSelectableEffect(effectText: string): boolean {
        if (!effectText) return false;
        return ![
            'Whenever you play',
            'may share this spot',
            'Counts as',
            'counts as one additional tree'
        ].some(passiveText => effectText.includes(passiveText));
    }

    private resolveCardChoices(
        action: Extract<PendingAction, { kind: 'chooseCardEffectAndBonus' }>,
        useEffect: boolean,
        useBonus: boolean
    ) {
        if (useEffect && !action.effectText) throw new Error('This card has no selectable effect');
        if (useBonus && !action.bonusText) throw new Error('This card has no active bonus');
        const resolution = this.deferredChoiceResolutions.get(action.resolutionId);
        if (!resolution) throw new Error('Missing card ability resolution');
        this.deferredChoiceResolutions.delete(action.resolutionId);
        this.pendingAction = undefined;
        this.applyCardChoices(resolution, useEffect, useBonus);
    }

    private applyCardChoices(
        resolution: DeferredCardResolution,
        useEffect: boolean,
        useBonus: boolean
    ) {
        const { player, card, speciesIndex, placedTree, targetSlot } = resolution;
        const effectResult = useEffect ? executeEffect({
            gameState: this,
            player,
            card,
            speciesIndex,
            targetTree: placedTree,
            targetSlot
        }) : { cardsDrawn: 0, cardsMoved: [], extraTurn: false, bonusActions: [] };
        if (effectResult.cardsDrawn > 0) drawCardsOneByOne(this, player, effectResult.cardsDrawn);
        if (this.gameEnded) {
            this.clearPendingActions();
            return;
        }

        this.extraTurnsPending += Number(effectResult.extraTurn);
        const effectActions = this.createPendingActions(player, effectResult.bonusActions);
        if (effectActions.length > 0) {
            const resolutionId = `bonus-${++this.resolutionSequence}`;
            this.deferredBonusResolutions.set(resolutionId, { resolution, useBonus });
            const continuation: PendingAction = {
                kind: 'continueCardBonus',
                playerId: player.id,
                resolutionId,
                optional: false,
                prompt: ''
            };
            this.pendingActions = [
                ...effectActions.slice(1),
                continuation,
                ...this.pendingActions
            ];
            this.pendingAction = effectActions[0];
            return;
        }
        this.applyCardBonus(resolution, useBonus);
    }

    private applyCardBonus(resolution: DeferredCardResolution, useBonus: boolean) {
        const { player, card, speciesIndex, placedTree, targetSlot } = resolution;
        const bonusResult = useBonus ? executeBonus({
            gameState: this,
            player,
            card,
            speciesIndex,
            targetTree: placedTree,
            targetSlot
        }) : undefined;
        if (bonusResult?.cardsDrawn) drawCardsOneByOne(this, player, bonusResult.cardsDrawn);
        if (this.gameEnded) {
            this.clearPendingActions();
            return;
        }

        const bonusActions = this.createPendingActions(player, bonusResult?.bonusActions ?? []);
        this.extraTurnsPending += Number(Boolean(bonusResult?.extraTurn));
        if (bonusActions.length > 0) {
            const resumeActions = resolution.resolvingPendingAction
                ? [resolution.resolvingPendingAction, ...this.pendingActions]
                : this.pendingActions;
            this.pendingActions = [...bonusActions, ...resumeActions];
            this.pendingAction = this.pendingActions.shift();
            return;
        }

        if (resolution.resolvingPendingAction) {
            this.pendingAction = resolution.resolvingPendingAction;
            return;
        }
        this.pendingAction = this.pendingActions.shift();
        if (this.pendingAction) return;
        this.finishTurn();
    }

    private resolveDeferredBonus(resolutionId: string) {
        const deferred = this.deferredBonusResolutions.get(resolutionId);
        if (!deferred) throw new Error('Missing deferred bonus resolution');
        this.deferredBonusResolutions.delete(resolutionId);
        this.applyCardBonus(deferred.resolution, deferred.useBonus);
    }

    private resolveTriggeredDraw(
        action: Extract<PendingAction, { kind: 'triggeredDraws' }>,
        cardIds: number[],
        decline: boolean,
        choiceId?: string
    ) {
        if (cardIds.length > 0) throw new Error('Triggered draws do not accept card selections');
        if (!decline) {
            if (!choiceId) throw new Error('Choose a permanent effect to resolve');
            const triggerIndex = action.triggers.findIndex(trigger => trigger.id === choiceId);
            if (triggerIndex < 0) throw new Error('The selected permanent effect is not available');
            drawCardsOneByOne(this, this.players.get(action.playerId)!, 1);
            if (this.gameEnded) {
                this.clearPendingActions();
                return;
            }
            action.triggers.splice(triggerIndex, 1);
            if (action.triggers.length > 0) return;
        }
        const completion = this.triggeredDrawCompletion;
        this.triggeredDrawCompletion = undefined;
        if (completion === 'completeAction') {
            this.pendingAction = undefined;
            this.completePendingAction();
            return;
        }
        this.resumeDeferredCardResolution();
    }

    private resumeDeferredCardResolution() {
        const resolution = this.deferredCardResolution;
        if (!resolution) throw new Error('Missing deferred card resolution');
        this.deferredCardResolution = undefined;
        this.pendingAction = undefined;
        this.resolveCardEffects(resolution);
    }

    private getPermanentTriggers(
        player: Player,
        playedCard: EnhancedCard,
        speciesIndex: number,
        targetTree: PlacedTree,
        targetSlot?: 'top' | 'bottom' | 'left' | 'right'
    ): TriggeredDrawChoice[] {
        const playedSpecies = playedCard.species[speciesIndex];
        const playedTags = playedSpecies.speciesData.tags;
        const targetIsShrub = targetTree.tree.species.some(species =>
            species.speciesData.tags.includes('Shrub')
        );
        const delayedTriggers = new Set(['Chanterelle', 'Fly Agaric', 'Parasol Mushroom', 'Penny Bun']);
        const triggers: TriggeredDrawChoice[] = [];
        const addTrigger = (card: EnhancedCard, placedSpeciesIndex: number, playedTurn?: number) => {
            if (card.cardId === playedCard.cardId) return;
            const species = card.species[placedSpeciesIndex];
            if (!species) return;
            const name = species.speciesData.name;
            if (delayedTriggers.has(name) && playedTurn === this.turnNumber) return;

            const matches =
                (name === 'Chanterelle' && playedCard.orientation === 'Tree' && !targetIsShrub) ||
                (name === 'Fly Agaric' && playedTags.includes('Paw')) ||
                (name === 'Parasol Mushroom' && targetSlot === 'bottom' && !targetIsShrub) ||
                (name === 'Penny Bun' && targetSlot === 'top' && !targetIsShrub) ||
                (name === 'Craterellus Cornucopiodes' && playedTags.includes('Mountain')) ||
                (name === 'Blackthorn' && playedTags.includes('Butterfly')) ||
                (name === 'Common Hazel' && playedTags.includes('Bat')) ||
                (name === 'Elderberry' && playedTags.includes('Plant'));
            if (!matches) return;
            const sourceName = name === 'Craterellus Cornucopiodes' ? 'Black Trumpet' : name;
            triggers.push({
                id: `${card.cardId}:${placedSpeciesIndex}`,
                sourceCardId: card.cardId,
                sourceName
            });
        };

        player.forest.forEach(tree => {
            if (!tree.isSapling) addTrigger(tree.tree, 0, tree.treePlayedTurn);
            (['top', 'bottom', 'left', 'right'] as const).forEach(slot => {
                (tree[slot] ?? []).forEach(placedCard => {
                    addTrigger(placedCard.card, placedCard.speciesIndex, placedCard.playedTurn);
                });
            });
        });
        return triggers;
    }

    private getChanterelleSaplingTriggers(player: Player, saplingCount: number): TriggeredDrawChoice[] {
        const sources: Array<{ card: EnhancedCard; speciesIndex: number }> = [];
        player.forest.forEach(tree => {
            (['top', 'bottom', 'left', 'right'] as const).forEach(slot => {
                (tree[slot] ?? []).forEach(placedCard => {
                    if (placedCard.card.species[placedCard.speciesIndex]?.speciesData.name !== 'Chanterelle') return;
                    if (placedCard.playedTurn === this.turnNumber) return;
                    sources.push({ card: placedCard.card, speciesIndex: placedCard.speciesIndex });
                });
            });
        });

        return Array.from({ length: saplingCount }, (_, saplingIndex) =>
            sources.map(source => ({
                id: `${source.card.cardId}:${source.speciesIndex}:sapling:${saplingIndex}`,
                sourceCardId: source.card.cardId,
                sourceName: 'Chanterelle'
            }))
        ).flat();
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
        player.forest.push(...selectedCards.map(card => ({
            tree: card,
            isSapling: true,
            treePlayedTurn: this.turnNumber
        })));

        for (let index = 0; index < selectedCards.length && !this.gameEnded; index++) {
            revealCardToClearing(this);
        }
        if (this.gameEnded) {
            this.clearPendingActions();
            return;
        }
        const chanterelleTriggers = this.getChanterelleSaplingTriggers(player, selectedCards.length);
        if (chanterelleTriggers.length > 0) {
            this.pendingAction = {
                kind: 'triggeredDraws',
                playerId,
                triggers: chanterelleTriggers,
                optional: true,
                prompt: 'Resolve Chanterelle draws for the Water Vole saplings'
            };
            this.triggeredDrawCompletion = 'completeAction';
            return;
        }
        this.completePendingAction();
    }

    private resolveTakeAllMatching(playerId: string, cardIds: number[], eligibleTag: CardTag) {
        if (cardIds.length > 0) throw new Error('This action does not accept a card selection');
        const player = this.players.get(playerId)!;
        const matchingCards = this.clearing.filter(card => card.species.some(species =>
            species.speciesData.tags.some(tag => tag.toLowerCase() === eligibleTag.toLowerCase())
        ));
        if (player.hand.length + matchingCards.length > 10) {
            throw new Error('Taking all matching cards would exceed the hand limit');
        }

        const matchingIds = new Set(matchingCards.map(card => card.cardId));
        this.clearing = this.clearing.filter(card => !matchingIds.has(card.cardId));
        player.hand.push(...matchingCards);
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

            const takeAllMatch = actionCode.match(/^TAKE_ALL_(.+)_FROM_CLEARING$/);
            if (takeAllMatch) {
                const tag = this.normalizeCardTag(takeAllMatch[1]);
                if (!tag) return [];
                const count = this.clearing.filter(card => card.species.some(species =>
                    species.speciesData.tags.some(cardTag => cardTag.toLowerCase() === tag.toLowerCase())
                )).length;
                if (count === 0) return [];
                return [{
                    kind: 'takeAllMatching' as const,
                    playerId: player.id,
                    eligibleTag: tag,
                    count,
                    optional: true,
                    prompt: `Take all ${count} clearing card(s) with a ${tag} symbol`
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

    private prepareInitialMulligans() {
        const actions: PendingAction[] = Array.from(this.players.values())
            .filter(player => !player.hand.some(card => card.orientation === 'Tree'))
            .map(player => ({
                kind: 'initialMulligan' as const,
                playerId: player.id,
                optional: true as const,
                prompt: 'Your opening hand has no tree. Draw a replacement hand?'
            }));
        this.pendingAction = actions.shift();
        this.pendingActions = actions;
        this.focusActivePlayerOnPendingMulligan();
    }

    private resolveDrawSource(
        action: Extract<PendingAction, { kind: 'chooseDrawSource' }>,
        cardIds: number[],
        choiceId?: string
    ) {
        const player = this.players.get(action.playerId)!;
        if (player.hand.length >= 10) throw new Error('The hand limit has been reached');

        if (choiceId === 'deck') {
            if (cardIds.length > 0) throw new Error('Do not select a clearing card when drawing from the deck');
            this.drawCards(1, player);
        } else if (choiceId === 'clearing') {
            if (cardIds.length !== 1) throw new Error('Select exactly one clearing card');
            const clearingIndex = this.clearing.findIndex(card => card.cardId === cardIds[0]);
            if (clearingIndex < 0) throw new Error('The selected card is no longer in the clearing');
            const [card] = this.clearing.splice(clearingIndex, 1);
            player.hand.push(card);
        } else {
            throw new Error('Choose either the deck or the clearing');
        }

        if (this.gameEnded) {
            this.clearPendingActions();
            return;
        }

        const remaining = action.remaining - 1;
        if (remaining > 0 && player.hand.length < 10) {
            this.pendingAction = {
                ...action,
                remaining,
                prompt: 'Choose the source for your second card'
            };
            return;
        }
        this.pendingAction = undefined;
        this.finishTurn();
    }

    private resolveInitialMulligan(playerId: string, keepHand: boolean) {
        if (this.mulliganResolved.has(playerId)) throw new Error('Mulligan already resolved');
        const player = this.players.get(playerId);
        if (!player) throw new Error('Player not found');

        this.mulliganResolved.add(playerId);
        if (!keepHand) {
            this.cardsRemovedFromGame.push(...player.hand);
            player.hand = [];
            this.drawCards(6, player);
        }

        this.pendingAction = this.pendingActions.shift();
        if (this.gameEnded) {
            this.clearPendingActions();
            return;
        }
        this.focusActivePlayerOnPendingMulligan();
    }

    private focusActivePlayerOnPendingMulligan() {
        if (this.pendingAction?.kind !== 'initialMulligan') {
            const startingIndex = Array.from(this.players.keys()).indexOf(this.startingPlayerId);
            this.activePlayerIndex = startingIndex >= 0 ? startingIndex : 0;
            return;
        }
        const playerIndex = Array.from(this.players.keys()).indexOf(this.pendingAction.playerId);
        if (playerIndex >= 0) this.activePlayerIndex = playerIndex;
    }

    private completePendingAction() {
        this.pendingAction = this.pendingActions.shift();
        if (this.pendingAction?.kind === 'continueCardBonus') {
            const resolutionId = this.pendingAction.resolutionId;
            this.pendingAction = undefined;
            this.resolveDeferredBonus(resolutionId);
            return;
        }
        if (this.pendingAction) return;

        this.finishTurn();
    }

    private clearPendingActions() {
        this.pendingAction = undefined;
        this.pendingActions = [];
        this.extraTurnsPending = 0;
        this.deferredCardResolution = undefined;
        this.triggeredDrawCompletion = undefined;
        this.deferredChoiceResolutions.clear();
        this.deferredBonusResolutions.clear();
    }

    private finishTurn() {
        if (this.clearing.length >= 10) this.clearing = [];
        this.turnNumber++;
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
