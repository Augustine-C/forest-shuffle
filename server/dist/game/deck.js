"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDeck = createDeck;
const cardData_1 = require("./cardData");
function createDeck(playerCount) {
    let rawDeck = [];
    // 1. Expand definitions into individual cards
    cardData_1.CARD_DEFINITIONS.forEach(def => {
        for (let i = 0; i < def.deckCount; i++) {
            rawDeck.push(Object.assign(Object.assign({}, def), { id: `${def.id}_${i}` }));
        }
    });
    // 2. Shuffle generic shuffle function
    rawDeck = shuffle(rawDeck);
    // 3. Remove cards based on player count
    // 2p: remove 30, 3p: remove 20, 4p: remove 10
    let removeCount = 0;
    if (playerCount === 2)
        removeCount = 30;
    else if (playerCount === 3)
        removeCount = 20;
    else if (playerCount === 4)
        removeCount = 10;
    if (removeCount > 0 && rawDeck.length > removeCount) {
        // "Return to box" - remove from beginning
        rawDeck = rawDeck.slice(removeCount);
    }
    // 4. Prepare Winter Cards
    const winterCards = [
        { id: 'winter_1', name: 'Winter is Coming', type: 'tree', cost: 0, deckCount: 1, slots: { top: null, bottom: null, left: null, right: null } }, // Using tree type as placeholder for now
        { id: 'winter_2', name: 'Winter is Coming', type: 'tree', cost: 0, deckCount: 1, slots: { top: null, bottom: null, left: null, right: null } },
        { id: 'winter_3', name: 'Winter Arrives', type: 'tree', cost: 0, deckCount: 1, slots: { top: null, bottom: null, left: null, right: null } }
    ];
    // 5. Divide into thirds
    const thirdSize = Math.floor(rawDeck.length / 3);
    const pile1 = rawDeck.slice(0, thirdSize);
    const pile2 = rawDeck.slice(thirdSize, thirdSize * 2);
    let pile3 = rawDeck.slice(thirdSize * 2);
    // 6. Add Winter cards to Pile 3 and shuffle
    pile3.push(...winterCards);
    pile3 = shuffle(pile3);
    // 7. Stack: Pile 1 (top) -> Pile 2 -> Pile 3 (bottom)
    return [...pile1, ...pile2, ...pile3];
}
function shuffle(array) {
    let currentIndex = array.length, randomIndex;
    // While there remain elements to shuffle.
    while (currentIndex != 0) {
        // Pick a remaining element.
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        // And swap it with the current element.
        [array[currentIndex], array[randomIndex]] = [
            array[randomIndex], array[currentIndex]
        ];
    }
    return array;
}
