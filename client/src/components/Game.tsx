import { useState } from 'react';
import { socket } from '../services/socket';
import Card from './Card';
import type { SerializedGameState, Player, EnhancedCard } from '../../../shared/types';

interface GameProps {
    gameState: SerializedGameState;
    playerId: string | undefined;
    roomCode: string;
}

export default function Game({ gameState, playerId, roomCode }: GameProps) {
    const [selectedCardId, setSelectedCardId] = useState<number | null>(null);
    const [selectedSpeciesIndex, setSelectedSpeciesIndex] = useState<number>(0);
    const [costCardIds, setCostCardIds] = useState<number[]>([]);

    const myPlayer = gameState.players.find((p: Player) => p.id === playerId);
    const otherPlayers = gameState.players.filter((p: Player) => p.id !== playerId);

    // Calculate active player
    const activePlayer = gameState.players[gameState.activePlayerIndex];
    const isMyTurn = activePlayer?.id === playerId;

    const selectedCard = myPlayer?.hand.find((c: EnhancedCard) => c.cardId === selectedCardId);

    const handleCardClick = (card: EnhancedCard) => {
        if (!isMyTurn) return;

        if (selectedCardId === card.cardId) {
            // If it's a split card, cycle species index or deselect
            if (card.isSplitCard) {
                const nextIndex = (selectedSpeciesIndex + 1) % card.species.length;
                if (nextIndex === 0 && selectedSpeciesIndex !== 0) {
                    setSelectedCardId(null);
                    setCostCardIds([]);
                } else {
                    setSelectedSpeciesIndex(nextIndex);
                    setCostCardIds([]); // Reset cost if cost might change (though usually same)
                }
            } else {
                setSelectedCardId(null);
                setCostCardIds([]);
            }
        } else if (selectedCardId && costCardIds.includes(card.cardId)) {
            // Remove from cost
            setCostCardIds(prev => prev.filter(id => id !== card.cardId));
        } else if (selectedCardId) {
            // Add to cost if we still need to pay
            const requiredCost = selectedCard?.species[selectedSpeciesIndex]?.speciesData.cost || 0;
            if (costCardIds.length < requiredCost) {
                setCostCardIds(prev => [...prev, card.cardId]);
            }
        } else {
            // Select as card to play
            setSelectedCardId(card.cardId);
            setSelectedSpeciesIndex(0);
            setCostCardIds([]);
        }
    };

    const handleDrawTwo = () => {
        socket.emit('draw_card', { roomCode, playerId });
    };

    const handlePlayCard = (treeIndex?: number, slot?: string) => {
        if (selectedCardId === null || !selectedCard) return;

        let speciesIndex = selectedSpeciesIndex;

        // Smart auto-selection for split cards
        if (selectedCard.isSplitCard && slot) {
            if (selectedCard.orientation === 'vCard') {
                speciesIndex = slot === 'top' ? 0 : 1;
            } else if (selectedCard.orientation === 'hCard') {
                speciesIndex = slot === 'left' ? 0 : 1;
            }
        }

        const requiredCost = selectedCard.species[speciesIndex]?.speciesData.cost || 0;
        if (costCardIds.length < requiredCost) {
            alert(`Need ${requiredCost} cards for cost. Selected ${costCardIds.length}.`);
            return;
        }

        socket.emit('play_card', {
            roomCode,
            playerId,
            cardId: selectedCardId,
            costCardIds,
            speciesIndex,
            targetTreeIndex: treeIndex,
            targetSlot: slot
        });

        // Reset local state
        setSelectedCardId(null);
        setSelectedSpeciesIndex(0);
        setCostCardIds([]);
    };

    if (!myPlayer) return <div>Error: Player not found in game state</div>;

    if (gameState.gameEnded) {
        return (
            <div className="game-over">
                <h1>Game Over!</h1>
                <div className="final-scores">
                    {gameState.players.map(p => (
                        <div key={p.id}>
                            {p.name}: {p.id === playerId ? 'You' : ''}
                        </div>
                    ))}
                </div>
                <button onClick={() => window.location.reload()}>Back to Home</button>
            </div>
        );
    }

    return (
        <div className="game-board">
            <div className="game-meta">
                <div className={`turn-indicator ${isMyTurn ? 'my-turn' : ''}`}>
                    {isMyTurn ? "It's YOUR Turn!" : `Waiting for ${activePlayer?.name}...`}
                </div>
                <div className="deck-info">
                    🎴 Deck: {gameState.deckCount} cards | ❄️ Winter: {gameState.winterCardsDrawn}/3
                </div>
            </div>

            <div className="actions">
                {isMyTurn && (
                    <>
                        <button className="action-btn" onClick={handleDrawTwo}>Draw 2 Cards</button>
                        {selectedCard && selectedCard.orientation === 'Tree' && (
                            <button className="action-btn primary" onClick={() => handlePlayCard()}>
                                Plant {selectedCard.species[0].name} (Pay {selectedCard.species[0].speciesData.cost})
                            </button>
                        )}
                        {selectedCard && !selectedCard.isSplitCard && selectedCard.orientation !== 'Tree' && (
                            <button className="action-btn primary" onClick={() => handlePlayCard()}>
                                Play Sapling
                            </button>
                        )}
                    </>
                )}
            </div>

            <div className="opponents">
                <h3>Opponents</h3>
                {otherPlayers.map((p: Player) => (
                    <div key={p.id} className="opponent">
                        👤 {p.name} - Hand: {p.hand?.length || 0} cards | Forest: {p.forest.length} trees
                    </div>
                ))}
            </div>

            <div className="clearing-area">
                <h3>Clearing (Market)</h3>
                <div className="clearing-cards">
                    {gameState.clearing.length === 0 ? <p>Empty</p> :
                        gameState.clearing.map((c, i) => <Card key={i} card={c} />)
                    }
                </div>
            </div>

            <div className="my-area">
                <div className="my-forest">
                    <h3>My Forest</h3>
                    <div className="forest-grid">
                        {myPlayer.forest.length === 0 && <p>No trees yet. Plant one!</p>}
                        {myPlayer.forest.map((slot, treeIndex) => {
                            const showTop = selectedCard?.orientation === 'vCard' && !slot.top;
                            const showBottom = selectedCard?.orientation === 'vCard' && !slot.bottom;
                            const showLeft = selectedCard?.orientation === 'hCard' && !slot.left;
                            const showRight = selectedCard?.orientation === 'hCard' && !slot.right;

                            return (
                                <div key={treeIndex} className="tree-slot">
                                    <div className="slot top" onClick={() => showTop && handlePlayCard(treeIndex, 'top')}>
                                        {slot.top ? <div className="slot-top-wrapper"><Card card={slot.top} slot="top" /></div> : (showTop ? <span className="placement-icon">+</span> : '')}
                                    </div>
                                    <div className="slot left" onClick={() => showLeft && handlePlayCard(treeIndex, 'left')}>
                                        {slot.left ? <div className="slot-left-wrapper"><Card card={slot.left} slot="left" /></div> : (showLeft ? <span className="placement-icon">+</span> : '')}
                                    </div>
                                    <div className="tree-card">
                                        <Card card={slot.tree} />
                                    </div>
                                    <div className="slot right" onClick={() => showRight && handlePlayCard(treeIndex, 'right')}>
                                        {slot.right ? <div className="slot-right-wrapper"><Card card={slot.right} slot="right" /></div> : (showRight ? <span className="placement-icon">+</span> : '')}
                                    </div>
                                    <div className="slot bottom" onClick={() => showBottom && handlePlayCard(treeIndex, 'bottom')}>
                                        {slot.bottom ? <div className="slot-bottom-wrapper"><Card card={slot.bottom} slot="bottom" /></div> : (showBottom ? <span className="placement-icon">+</span> : '')}
                                    </div>
                                </div>
                            );
                        })}
                        <div className="new-tree-zone" onClick={() => selectedCard && handlePlayCard()}>
                            {selectedCard && (selectedCard.orientation === 'Tree' || !selectedCard.isSplitCard) ? <span className="placement-icon">+</span> : ''}
                        </div>
                    </div>
                </div>

                <div className="my-hand">
                    <h3>My Hand ({myPlayer.hand.length})</h3>
                    <div className="hand-cards">
                        {myPlayer.hand.map((c) => (
                            <Card
                                key={c.cardId}
                                card={c}
                                isSelected={selectedCardId === c.cardId}
                                isCostSelected={costCardIds.includes(c.cardId)}
                                selectedSpeciesIndex={selectedCardId === c.cardId ? selectedSpeciesIndex : undefined}
                                onClick={() => handleCardClick(c)}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
