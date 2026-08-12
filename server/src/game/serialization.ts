import { GameState } from './gameState';
import { calculatePlayerScore } from './scoringEngine';

export function serializeGameState(game: GameState, viewerId: string) {
    const viewer = game.players.get(viewerId);
    if (!viewer) throw new Error('Cannot serialize game state for an unknown player');

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
        myScore: calculatePlayerScore(viewer, game),
        clearing: game.clearing,
        activePlayerIndex: game.activePlayerIndex,
        deckCount: game.deck.length,
        winterCardsDrawn: game.winterCardsDrawn,
        gameEnded: game.gameEnded,
        turnNumber: game.turnNumber,
        startingPlayerId: game.startingPlayerId,
        includedDecks: game.includedDecks,
        pendingAction: game.pendingAction,
        finalScores: game.gameEnded ? Object.fromEntries(game.calculateScores()) : undefined
    };
}
