"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameState = void 0;
const deck_1 = require("./deck");
class GameState {
    constructor(playerCount = 2) {
        this.players = new Map();
        this.deck = (0, deck_1.createDeck)(playerCount);
        this.clearing = [];
        this.activePlayerIndex = 0;
    }
    addPlayer(id, name) {
        this.players.set(id, {
            id,
            name,
            hand: [],
            forest: []
        });
    }
    removePlayer(id) {
        this.players.delete(id);
    }
    startGame() {
        this.players.forEach(player => {
            player.hand = this.drawCards(6);
        });
    }
    drawCards(count) {
        const drawn = [];
        for (let i = 0; i < count; i++) {
            const card = this.deck.shift();
            if (card) {
                drawn.push(card);
                // In a real implementation, we'd check for Winter cards here.
                // If card.type === 'winter', we'd trigger game end logic.
            }
        }
        return drawn;
    }
    // Actions
    playerDrawsTwo() {
        const activePlayerId = Array.from(this.players.keys())[this.activePlayerIndex];
        const player = this.players.get(activePlayerId);
        if (!player)
            return;
        const drawn = this.drawCards(2);
        player.hand.push(...drawn);
        this.nextTurn();
    }
    playCard(playerId, cardId, costCardIds, targetTreeIndex, targetSlot) {
        const player = this.players.get(playerId);
        if (!player)
            return;
        // 1. Find the card in hand
        const cardIndex = player.hand.findIndex(c => c.id === cardId);
        if (cardIndex === -1)
            return;
        const cardToPlay = player.hand[cardIndex];
        // 2. Validate and Pay Cost
        let requiredCost = cardToPlay.cost;
        // For Split cards, cost depends on the selected half
        if (cardToPlay.type === 'split' && targetSlot) {
            // Determine which half is being played based on targetSlot
            // Top/Bottom slots imply Top/Bottom halves. Left/Right slots imply Left/Right halves.
            // But wait, a card might be Top/Bottom split, but user clicks 'top' slot.
            // My data model:
            // Top/Bottom Split: has .top and .bottom properties.
            // Left/Right Split: has .left and .right properties.
            if (targetSlot === 'top' && cardToPlay.top)
                requiredCost = cardToPlay.top.cost;
            else if (targetSlot === 'bottom' && cardToPlay.bottom)
                requiredCost = cardToPlay.bottom.cost;
            else if (targetSlot === 'left' && cardToPlay.left)
                requiredCost = cardToPlay.left.cost;
            else if (targetSlot === 'right' && cardToPlay.right)
                requiredCost = cardToPlay.right.cost;
            else {
                // Invalid slot for this card type (e.g. trying to play Left/Right card in Top slot)
                throw new Error("Invalid slot for this card type");
            }
        }
        if (player.hand.length - 1 < requiredCost) {
            throw new Error(`Not enough cards! Need ${requiredCost}, have ${player.hand.length - 1}`);
        }
        // Remove cost cards from hand and add to clearing
        // (If provided costCardIds don't match requiredCost, we might want to error, or just take first N?)
        // Let's enforce exact payment for now or assume UI handles selection.
        if (costCardIds.length < requiredCost) {
            throw new Error("Insufficient payment selected");
        }
        costCardIds.forEach(cid => {
            const idx = player.hand.findIndex(c => c.id === cid);
            if (idx !== -1) {
                const discarded = player.hand.splice(idx, 1)[0];
                this.clearing.push(discarded);
            }
        });
        // Remove the played card from hand (it might have shifted index)
        const newCardIndex = player.hand.findIndex(c => c.id === cardId);
        player.hand.splice(newCardIndex, 1);
        // 3. Place the card
        if (cardToPlay.type === 'tree') {
            player.forest.push({ tree: cardToPlay });
        }
        else if (cardToPlay.type === 'split') {
            if (targetTreeIndex !== undefined && targetSlot !== undefined) {
                const treeSlot = player.forest[targetTreeIndex];
                if (treeSlot) {
                    treeSlot[targetSlot] = cardToPlay;
                }
            }
            else {
                // If it's a split card but no target, it's a sapling or error?
                // For now, let's assume valid target is provided.
            }
        }
        // 4. Update Clearing Wipe Logic
        if (this.clearing.length >= 10) {
            this.clearing = [];
        }
        this.nextTurn();
    }
    nextTurn() {
        this.activePlayerIndex = (this.activePlayerIndex + 1) % this.players.size;
    }
}
exports.GameState = GameState;
