"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDeck = createDeck;
const cardData_1 = require("./cardData");
// Helper to expand deck based on counts
function createDeck() {
    const deck = [];
    cardData_1.CARD_DEFINITIONS.forEach(def => {
        for (let i = 0; i < def.deckCount; i++) {
            deck.push(Object.assign(Object.assign({}, def), { id: `${def.id}_${i}` }));
        }
    });
    return deck;
}
