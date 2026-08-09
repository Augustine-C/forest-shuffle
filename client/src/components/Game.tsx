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
    const [clearingCardIds, setClearingCardIds] = useState<number[]>([]);

    const myPlayer = gameState.players.find((p: Player) => p.id === playerId);
    const otherPlayers = gameState.players.filter((p: Player) => p.id !== playerId);

    // Calculate active player
    const activePlayer = gameState.players[gameState.activePlayerIndex];
    const isMyTurn = activePlayer?.id === playerId;

    const selectedCard = myPlayer?.hand.find((c: EnhancedCard) => c.cardId === selectedCardId);
    const pendingAction = gameState.pendingAction;
    const myPendingAction = pendingAction?.playerId === playerId ? pendingAction : undefined;
    const clearingPendingAction = myPendingAction?.kind === 'selectClearingCards' ? myPendingAction : undefined;
    const freePlayPendingAction = myPendingAction?.kind === 'playFreeCard' ? myPendingAction : undefined;
    const paidPlayPendingAction = myPendingAction?.kind === 'playPaidCards' ? myPendingAction : undefined;
    const handExchangePendingAction = myPendingAction?.kind === 'exchangeHandForDeck' ? myPendingAction : undefined;
    const saplingPendingAction = myPendingAction?.kind === 'playSaplings' ? myPendingAction : undefined;
    const handSelectionPendingAction = handExchangePendingAction ?? saplingPendingAction;
    const takeAllPendingAction = myPendingAction?.kind === 'takeAllMatching' ? myPendingAction : undefined;
    const triggeredDrawAction = myPendingAction?.kind === 'triggeredDraws' ? myPendingAction : undefined;

    const handleCardClick = (card: EnhancedCard) => {
        if (!isMyTurn) return;
        if (handSelectionPendingAction) {
            setCostCardIds(current => current.includes(card.cardId)
                ? current.filter(cardId => cardId !== card.cardId)
                : [...current, card.cardId]
            );
            return;
        }
        if (myPendingAction && !freePlayPendingAction && !paidPlayPendingAction) return;

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
        socket.emit('draw_card', { roomCode, playerId, clearingCardIds });
        setClearingCardIds([]);
    };

    const handleClearingCardClick = (cardId: number) => {
        if (!isMyTurn || selectedCardId !== null) return;
        const selectionLimit = clearingPendingAction?.count ?? 2;
        setClearingCardIds(current => current.includes(cardId)
            ? current.filter(id => id !== cardId)
            : current.length < selectionLimit ? [...current, cardId] : current
        );
    };

    const handlePendingAction = (decline: boolean) => {
        if (!myPendingAction || !playerId) return;
        socket.emit('resolve_pending_action', {
            roomCode,
            playerId,
            cardIds: decline ? [] : handSelectionPendingAction ? costCardIds : clearingCardIds,
            decline
        });
        setClearingCardIds([]);
        setCostCardIds([]);
    };

    const handleTriggeredDraw = (choiceId?: string) => {
        if (!triggeredDrawAction || !playerId) return;
        socket.emit('resolve_pending_action', {
            roomCode,
            playerId,
            choiceId,
            decline: choiceId === undefined
        });
    };

    const handlePlayCard = (treeIndex?: number, slot?: string, asSapling = false) => {
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

        const requiredCost = asSapling || freePlayPendingAction
            ? 0
            : selectedCard.species[speciesIndex]?.speciesData.cost || 0;
        if (costCardIds.length < requiredCost) {
            alert(`Need ${requiredCost} cards for cost. Selected ${costCardIds.length}.`);
            return;
        }

        const playEvent = freePlayPendingAction
            ? 'play_pending_card'
            : paidPlayPendingAction ? 'play_pending_paid_card' : 'play_card';
        socket.emit(playEvent, {
            roomCode,
            playerId,
            cardId: selectedCardId,
            costCardIds: freePlayPendingAction ? [] : costCardIds,
            speciesIndex,
            targetTreeIndex: treeIndex,
            targetSlot: slot,
            asSapling
        });

        // Reset local state
        setSelectedCardId(null);
        setSelectedSpeciesIndex(0);
        setCostCardIds([]);
        setClearingCardIds([]);
    };

    if (!myPlayer) return <div>Error: Player not found in game state</div>;

    if (gameState.gameEnded) {
        return (
            <div className="game-over">
                <h1>Game Over!</h1>
                <div className="final-scores">
                    {gameState.players.map(p => (
                        <div key={p.id}>
                            {p.name}: {gameState.finalScores?.[p.id] ?? 0} points {p.id === playerId ? '(You)' : ''}
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
                {isMyTurn && clearingPendingAction && (
                    <div className="pending-action">
                        <strong>{clearingPendingAction.prompt}</strong>
                        <span>Select exactly {clearingPendingAction.count} card(s) from the clearing.</span>
                        <button
                            className="action-btn primary"
                            disabled={clearingCardIds.length !== clearingPendingAction.count}
                            onClick={() => handlePendingAction(false)}
                        >
                            Confirm selection
                        </button>
                        {clearingPendingAction.optional && (
                            <button className="action-btn" onClick={() => handlePendingAction(true)}>
                                Decline
                            </button>
                        )}
                    </div>
                )}
                {isMyTurn && freePlayPendingAction && (
                    <div className="pending-action">
                        <strong>{freePlayPendingAction.prompt}</strong>
                        <span>Select an eligible card from your hand, then choose its forest position.</span>
                        {selectedCard?.orientation === 'Tree' && (
                            <button className="action-btn primary" onClick={() => handlePlayCard()}>
                                Play {selectedCard.species[selectedSpeciesIndex]?.name} for free
                            </button>
                        )}
                        {freePlayPendingAction.optional && (
                            <button className="action-btn" onClick={() => handlePendingAction(true)}>
                                {freePlayPendingAction.repeatable ? 'Done' : 'Decline'}
                            </button>
                        )}
                    </div>
                )}
                {isMyTurn && paidPlayPendingAction && (
                    <div className="pending-action">
                        <strong>{paidPlayPendingAction.prompt}</strong>
                        <span>Select and place cards normally. Choose Done after your final play.</span>
                        {selectedCard?.orientation === 'Tree' && (
                            <button className="action-btn primary" onClick={() => handlePlayCard()}>
                                Plant {selectedCard.species[0].name} (Pay {selectedCard.species[0].speciesData.cost})
                            </button>
                        )}
                        <button className="action-btn" onClick={() => handlePendingAction(true)}>
                            Done
                        </button>
                    </div>
                )}
                {isMyTurn && handExchangePendingAction && (
                    <div className="pending-action">
                        <strong>{handExchangePendingAction.prompt}</strong>
                        <span>{costCardIds.length} hand card(s) selected.</span>
                        <button className="action-btn primary" onClick={() => handlePendingAction(false)}>
                            Exchange selected cards
                        </button>
                        <button className="action-btn" onClick={() => handlePendingAction(true)}>
                            Decline
                        </button>
                    </div>
                )}
                {isMyTurn && saplingPendingAction && (
                    <div className="pending-action">
                        <strong>{saplingPendingAction.prompt}</strong>
                        <span>{costCardIds.length} hand card(s) selected.</span>
                        <button className="action-btn primary" onClick={() => handlePendingAction(false)}>
                            Play selected saplings
                        </button>
                        <button className="action-btn" onClick={() => handlePendingAction(true)}>
                            Decline
                        </button>
                    </div>
                )}
                {isMyTurn && takeAllPendingAction && (
                    <div className="pending-action">
                        <strong>{takeAllPendingAction.prompt}</strong>
                        <span>The matching cards will all move to your hand.</span>
                        <button
                            className="action-btn primary"
                            disabled={myPlayer.hand.length + takeAllPendingAction.count > 10}
                            onClick={() => handlePendingAction(false)}
                        >
                            Take all matching cards
                        </button>
                        <button className="action-btn" onClick={() => handlePendingAction(true)}>
                            Decline
                        </button>
                    </div>
                )}
                {isMyTurn && triggeredDrawAction && (
                    <div className="pending-action">
                        <strong>{triggeredDrawAction.prompt}</strong>
                        <span>Resolve any triggers you want in your chosen order.</span>
                        {triggeredDrawAction.triggers.map(trigger => (
                            <button
                                key={trigger.id}
                                className="action-btn primary"
                                onClick={() => handleTriggeredDraw(trigger.id)}
                            >
                                Draw for {trigger.sourceName}
                            </button>
                        ))}
                        <button className="action-btn" onClick={() => handleTriggeredDraw()}>
                            Finish triggers
                        </button>
                    </div>
                )}
                {isMyTurn && !gameState.pendingAction && (
                    <>
                        <button className="action-btn" onClick={handleDrawTwo}>
                            {clearingCardIds.length > 0
                                ? `Take ${clearingCardIds.length} + Draw ${2 - clearingCardIds.length}`
                                : 'Draw 2 Cards'}
                        </button>
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
                        {selectedCard && (
                            <button className="action-btn" onClick={() => handlePlayCard(undefined, undefined, true)}>
                                Play as Sapling
                            </button>
                        )}
                    </>
                )}
                {isMyTurn && gameState.pendingAction && !myPendingAction && (
                    <span>Waiting for the pending action to be resolved.</span>
                )}
            </div>

            <div className="opponents">
                <h3>Opponents</h3>
                {otherPlayers.map((p: Player) => (
                    <div key={p.id} className="opponent">
                        👤 {p.name} - Hand: {p.handCount ?? p.hand.length} cards | Forest: {p.forest.length} trees
                    </div>
                ))}
            </div>

            <div className="clearing-area">
                <h3>Clearing (Market)</h3>
                <div className="clearing-cards">
                    {gameState.clearing.length === 0 ? <p>Empty</p> :
                        gameState.clearing.map(c => (
                            <Card
                                key={c.cardId}
                                card={c}
                                isCostSelected={clearingCardIds.includes(c.cardId)}
                                onClick={() => handleClearingCardClick(c.cardId)}
                            />
                        ))
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
                                        {slot.isSapling ? <div className="card sapling-card">Sapling</div> : <Card card={slot.tree} />}
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
