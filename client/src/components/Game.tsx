import { useState } from 'react';
import { socket } from '../services/socket';
import Card from './Card';

interface GameProps {
    gameState: any;
    playerId: string | undefined;
    roomCode: string;
}

export default function Game({ gameState, playerId, roomCode }: GameProps) {
    const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
    const [costCardIds, setCostCardIds] = useState<string[]>([]);

    const myPlayer = gameState.players.find((p: any) => p.id === playerId);
    const otherPlayers = gameState.players.filter((p: any) => p.id !== playerId);

    // Calculate active player
    const activePlayer = gameState.players[gameState.activePlayerIndex];
    const isMyTurn = activePlayer?.id === playerId;

    const selectedCard = myPlayer?.hand.find((c: any) => c.id === selectedCardId);

    const handleCardClick = (card: any) => {
        if (!isMyTurn) return;

        if (selectedCardId === card.id) {
            // Deselect everything
            setSelectedCardId(null);
            setCostCardIds([]);
        } else if (selectedCardId && costCardIds.includes(card.id)) {
            // Remove from cost
            setCostCardIds(prev => prev.filter(id => id !== card.id));
        } else if (selectedCardId) {
            // Add to cost if we still need to pay
            if (costCardIds.length < (selectedCard?.cost || 0)) {
                setCostCardIds(prev => [...prev, card.id]);
            }
        } else {
            // Select as card to play
            setSelectedCardId(card.id);
            setCostCardIds([]);
        }
    };

    const handleDrawTwo = () => {
        socket.emit('draw_card', { roomCode });
    };

    const handlePlantTree = () => {
        if (!selectedCardId || selectedCard?.type !== 'tree') return;
        if (costCardIds.length < (selectedCard?.cost || 0)) {
            alert(`Need ${selectedCard.cost} cards for cost. Selected ${costCardIds.length}.`);
            return;
        }

        socket.emit('play_card', {
            roomCode,
            cardId: selectedCardId,
            costCardIds,
        });

        // Reset local state
        setSelectedCardId(null);
        setCostCardIds([]);
    };

    const handlePlaySplit = (treeIndex: number, slot: string) => {
        if (!selectedCardId || selectedCard?.type !== 'split') return;
        if (costCardIds.length < (selectedCard?.cost || 0)) {
            alert(`Need ${selectedCard.cost} cards for cost.`);
            return;
        }

        socket.emit('play_card', {
            roomCode,
            cardId: selectedCardId,
            costCardIds,
            targetTreeIndex: treeIndex,
            targetSlot: slot
        });

        // Reset local state
        setSelectedCardId(null);
        setCostCardIds([]);
    };

    if (!myPlayer) return <div>Error: Player not found in game state</div>;

    return (
        <div className="game-board">
            <div className={`turn-indicator ${isMyTurn ? 'my-turn' : ''}`}>
                {isMyTurn ? "It's YOUR Turn!" : `Waiting for ${activePlayer?.name}...`}
            </div>

            <div className="actions">
                {isMyTurn && (
                    <>
                        <button className="action-btn" onClick={handleDrawTwo}>Draw 2 Cards</button>
                        {selectedCard?.type === 'tree' && (
                            <button className="action-btn primary" onClick={handlePlantTree}>
                                Plant {selectedCard.name} (Pay {selectedCard.cost})
                            </button>
                        )}
                    </>
                )}
            </div>

            <div className="opponents">
                <h3>Opponents</h3>
                {otherPlayers.map((p: any) => (
                    <div key={p.id} className="opponent">
                        👤 {p.name} - Hand: {p.hand?.length || 0} cards
                    </div>
                ))}
            </div>

            <div className="clearing-area">
                <h3>Clearing (Market)</h3>
                <div className="clearing-cards">
                    {gameState.clearing.length === 0 ? <p>Empty</p> :
                        gameState.clearing.map((c: any, i: number) => <Card key={i} card={c} />)
                    }
                </div>
            </div>

            <div className="my-area">
                <div className="my-forest">
                    <h3>My Forest</h3>
                    <div className="forest-grid">
                        {myPlayer.forest.length === 0 && <p>No trees yet. Plant one!</p>}
                        {myPlayer.forest.map((slot: any, treeIndex: number) => (
                            <div key={treeIndex} className="tree-slot">
                                <div className="slot top" onClick={() => handlePlaySplit(treeIndex, 'top')}>
                                    {slot.top ? <Card card={slot.top} /> : (selectedCard?.type === 'split' && selectedCard.top ? '+' : '')}
                                </div>
                                <div className="middle-row">
                                    <div className="slot left" onClick={() => handlePlaySplit(treeIndex, 'left')}>
                                        {slot.left ? <Card card={slot.left} /> : (selectedCard?.type === 'split' && selectedCard.left ? '+' : '')}
                                    </div>
                                    <div className="tree-card">
                                        <Card card={slot.tree} />
                                    </div>
                                    <div className="slot right" onClick={() => handlePlaySplit(treeIndex, 'right')}>
                                        {slot.right ? <Card card={slot.right} /> : (selectedCard?.type === 'split' && selectedCard.right ? '+' : '')}
                                    </div>
                                </div>
                                <div className="slot bottom" onClick={() => handlePlaySplit(treeIndex, 'bottom')}>
                                    {slot.bottom ? <Card card={slot.bottom} /> : (selectedCard?.type === 'split' && selectedCard.bottom ? '+' : '')}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="my-hand">
                    <h3>My Hand ({myPlayer.hand.length})</h3>
                    <div className="hand-cards">
                        {myPlayer.hand.map((c: any) => (
                            <Card
                                key={c.id}
                                card={c}
                                isSelected={selectedCardId === c.id}
                                isCostSelected={costCardIds.includes(c.id)}
                                onClick={() => handleCardClick(c)}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
