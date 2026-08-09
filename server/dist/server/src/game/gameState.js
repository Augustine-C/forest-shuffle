"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameState = void 0;
const cards_1 = require("./cards");
const deck_1 = require("./deck");
const effectsEngine_1 = require("./effectsEngine");
const scoringEngine_1 = require("./scoringEngine");
class GameState {
    constructor(playerCount = 2) {
        this.players = new Map();
        this.deck = (0, deck_1.createDeck)(playerCount);
        this.clearing = [];
        this.activePlayerIndex = 0;
        this.winterCardsDrawn = 0;
        this.gameEnded = false;
    }
    addPlayer(id, socketId, name, isHost = false) {
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
    removePlayer(id) {
        this.players.delete(id);
    }
    startGame() {
        this.players.forEach(player => {
            // Draw 6 cards for each player
            this.drawCards(6, player);
        });
    }
    drawCards(count, targetPlayer) {
        // Use provided player, or find the active player for context
        let player = targetPlayer;
        if (!player) {
            const activePlayerId = Array.from(this.players.keys())[this.activePlayerIndex];
            player = this.players.get(activePlayerId);
        }
        if (player) {
            return (0, effectsEngine_1.drawCardsOneByOne)(this, player, count);
        }
        else {
            // Fallback for draws before game start
            const drawn = [];
            for (let i = 0; i < count; i++) {
                const card = this.deck.shift();
                if (card) {
                    drawn.push(card);
                    if (card.isWinterCard) {
                        this.winterCardsDrawn++;
                        if (this.winterCardsDrawn >= 3)
                            this.gameEnded = true;
                    }
                }
            }
            return drawn;
        }
    }
    // Actions
    playerDrawsTwo() {
        const activePlayerId = Array.from(this.players.keys())[this.activePlayerIndex];
        const player = this.players.get(activePlayerId);
        if (!player)
            return;
        this.drawCards(2);
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
    playCard(playerId, cardIdNum, costCardIds, speciesIndex = 0, targetTreeIndex, targetSlot) {
        const player = this.players.get(playerId);
        if (!player)
            return;
        // 1. Find the card in hand by cardId
        const cardIndex = player.hand.findIndex(c => c.cardId === cardIdNum);
        if (cardIndex === -1)
            return;
        const cardToPlay = player.hand[cardIndex];
        // 2. Validate and Pay Cost
        const requiredCost = (0, cards_1.getCardCost)(cardToPlay, speciesIndex);
        if (player.hand.length - 1 < requiredCost) {
            throw new Error(`Not enough cards! Need ${requiredCost}, have ${player.hand.length - 1}`);
        }
        // Validate cost cards provided
        if (costCardIds.length < requiredCost) {
            throw new Error("Insufficient payment selected");
        }
        // Remove cost cards from hand and add to clearing
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
        let placedTree = undefined;
        if (cardToPlay.orientation === 'Tree') {
            // Playing as a tree
            placedTree = { tree: cardToPlay };
            player.forest.push(placedTree);
        }
        else if (cardToPlay.isSplitCard) {
            // Playing a split card (hCard or vCard) on a tree
            if (targetTreeIndex !== undefined && targetSlot !== undefined) {
                placedTree = player.forest[targetTreeIndex];
                if (placedTree) {
                    placedTree[targetSlot] = cardToPlay;
                }
            }
            else {
                throw new Error("Split cards require a target tree and slot");
            }
        }
        else {
            // Playing as sapling (face down)
            placedTree = { tree: cardToPlay };
            player.forest.push(placedTree);
        }
        // 4. Execute Effect
        if (placedTree) {
            const effectResult = (0, effectsEngine_1.executeEffect)({
                gameState: this,
                player,
                card: cardToPlay,
                speciesIndex,
                targetTree: placedTree,
                targetSlot
            });
            // Apply results (drawing cards, etc.)
            if (effectResult.cardsDrawn > 0) {
                (0, effectsEngine_1.drawCardsOneByOne)(this, player, effectResult.cardsDrawn);
            }
            // Check for bonus if tree is completed
            if (placedTree.top && placedTree.bottom && placedTree.left && placedTree.right) {
                this.triggerTreeBonuses(player, placedTree);
            }
            if (effectResult.extraTurn) {
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
    triggerTreeBonuses(player, tree) {
        const parts = [tree.tree, tree.top, tree.bottom, tree.left, tree.right];
        parts.forEach(card => {
            if (card) {
                // Find which species was played (index)
                // For trees it's always 0. For attached cards we might need to know which half.
                // Simplified: execute bonus for all species on the card if they have one.
                card.species.forEach((_, idx) => {
                    const bonusResult = (0, effectsEngine_1.executeBonus)({
                        gameState: this,
                        player,
                        card,
                        speciesIndex: idx,
                        targetTree: tree
                    });
                    if (bonusResult.cardsDrawn > 0) {
                        (0, effectsEngine_1.drawCardsOneByOne)(this, player, bonusResult.cardsDrawn);
                    }
                });
            }
        });
    }
    calculateScores() {
        const scores = new Map();
        this.players.forEach(player => {
            scores.set(player.id, (0, scoringEngine_1.calculatePlayerScore)(player, this));
        });
        return scores;
    }
}
exports.GameState = GameState;
