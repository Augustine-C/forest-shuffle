import { GameState } from './gameState';

export function serializeGameState(game: GameState, viewerId: string) {
    return {
        players: Array.from(game.players.values()).map(player => ({
            id: player.id,
            name: player.name,
            isHost: player.isHost,
            hand: player.id === viewerId ? player.hand : [],
            handCount: player.hand.length,
            forest: player.forest,
            cave: player.id === viewerId ? player.cave : [],
            caveCount: player.cave.length
        })),
        clearing: game.clearing,
        activePlayerIndex: game.activePlayerIndex,
        deckCount: game.deck.length,
        winterCardsDrawn: game.winterCardsDrawn,
        gameEnded: game.gameEnded,
        turnNumber: game.turnNumber,
        startingPlayerId: game.startingPlayerId,
        pendingAction: game.pendingAction,
        finalScores: game.gameEnded ? Object.fromEntries(game.calculateScores()) : undefined
    };
}
