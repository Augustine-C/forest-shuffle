import { useState } from 'react';
import { socket } from '../services/socket';
import Card from './Card';
import type {
    SerializedGameState,
    Player,
    EnhancedCard,
    PlacedTree,
    PlacedCard
} from '../../../shared/types';

type ForestSlot = 'top' | 'bottom' | 'left' | 'right';

interface SelectedPlacement {
    treeIndex: number;
    slot: ForestSlot;
}

interface GameProps {
    gameState: SerializedGameState;
    playerId: string | undefined;
    roomCode: string;
}

export default function Game({ gameState, playerId, roomCode }: GameProps) {
    const [selectedCardId, setSelectedCardId] = useState<number | null>(null);
    const [selectedSpeciesIndex, setSelectedSpeciesIndex] = useState<number>(0);
    const [selectedPlacement, setSelectedPlacement] = useState<SelectedPlacement | null>(null);
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
    const cardChoiceAction = myPendingAction?.kind === 'chooseCardEffectAndBonus' ? myPendingAction : undefined;
    const mulliganAction = myPendingAction?.kind === 'initialMulligan' ? myPendingAction : undefined;
    const drawSourceAction = myPendingAction?.kind === 'chooseDrawSource' ? myPendingAction : undefined;

    const resetCardSelection = () => {
        setSelectedCardId(null);
        setSelectedSpeciesIndex(0);
        setSelectedPlacement(null);
        setCostCardIds([]);
    };

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
            resetCardSelection();
        } else if (selectedCardId && costCardIds.includes(card.cardId)) {
            // Remove from cost
            setCostCardIds(prev => prev.filter(id => id !== card.cardId));
        } else if (selectedCardId) {
            // A split card's forest position determines its played species and cost.
            if (selectedCard?.isSplitCard && !selectedPlacement) return;
            // Add to cost if we still need to pay
            const requiredCost = selectedCard?.species[selectedSpeciesIndex]?.speciesData.cost || 0;
            if (costCardIds.length < requiredCost) {
                setCostCardIds(prev => [...prev, card.cardId]);
            }
        } else {
            // Select as card to play
            setSelectedCardId(card.cardId);
            setSelectedSpeciesIndex(0);
            setSelectedPlacement(null);
            setCostCardIds([]);
        }
    };

    const handleDrawTwo = () => {
        socket.emit('draw_card', { roomCode, playerId });
        setClearingCardIds([]);
    };

    const handleClearingCardClick = (cardId: number) => {
        if (!isMyTurn || selectedCardId !== null) return;
        const selectionLimit = drawSourceAction ? 1 : clearingPendingAction?.count ?? 2;
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

    const handleDrawSource = (choiceId: 'deck' | 'clearing') => {
        if (!drawSourceAction || !playerId) return;
        socket.emit('resolve_pending_action', {
            roomCode,
            playerId,
            choiceId,
            cardIds: choiceId === 'clearing' ? clearingCardIds : []
        });
        setClearingCardIds([]);
    };

    const handleCardChoices = (useEffect: boolean, useBonus: boolean) => {
        if (!cardChoiceAction || !playerId) return;
        socket.emit('resolve_pending_action', {
            roomCode,
            playerId,
            useEffect,
            useBonus
        });
    };

    const handleSelectPlacement = (treeIndex: number, slot: ForestSlot) => {
        if (!selectedCard) return;
        const speciesIndex = selectedCard.orientation === 'vCard'
            ? slot === 'top' ? 0 : 1
            : slot === 'left' ? 0 : 1;
        if (speciesIndex !== selectedSpeciesIndex) setCostCardIds([]);
        setSelectedSpeciesIndex(speciesIndex);
        setSelectedPlacement({ treeIndex, slot });
    };

    const handlePlayCard = (treeIndex?: number, slot?: ForestSlot, asSapling = false) => {
        if (selectedCardId === null || !selectedCard) return;

        const targetTreeIndex = asSapling ? undefined : treeIndex ?? selectedPlacement?.treeIndex;
        const targetSlot = asSapling ? undefined : slot ?? selectedPlacement?.slot;
        if (selectedCard.isSplitCard && !asSapling && (targetTreeIndex === undefined || !targetSlot)) {
            return;
        }

        let speciesIndex = selectedSpeciesIndex;

        // Smart auto-selection for split cards
        if (selectedCard.isSplitCard && targetSlot) {
            if (selectedCard.orientation === 'vCard') {
                speciesIndex = targetSlot === 'top' ? 0 : 1;
            } else if (selectedCard.orientation === 'hCard') {
                speciesIndex = targetSlot === 'left' ? 0 : 1;
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
            targetTreeIndex,
            targetSlot,
            asSapling
        });

        // Reset local state
        resetCardSelection();
        setClearingCardIds([]);
    };

    const canPlaceInSlot = (tree: PlacedTree, slot: ForestSlot) => {
        if (!selectedCard) return false;
        const orientationMatches = selectedCard.orientation === 'vCard'
            ? slot === 'top' || slot === 'bottom'
            : selectedCard.orientation === 'hCard' && (slot === 'left' || slot === 'right');
        if (!orientationMatches) return false;
        const speciesIndex = selectedCard.orientation === 'vCard'
            ? slot === 'top' ? 0 : 1
            : slot === 'left' ? 0 : 1;
        const species = selectedCard.species[speciesIndex];
        const existingCards = tree[slot] ?? [];
        if (species.speciesData.name === 'Cuckoo') {
            const existingSpecies = existingCards.map(placedCard =>
                placedCard.card.species[placedCard.speciesIndex]
            );
            return slot === 'top' && existingCards.length === 1 &&
                existingSpecies[0]?.speciesData.tags.includes('Bird') === true;
        }
        if (existingCards.length === 0) return true;
        const existingSpecies = existingCards.map(placedCard =>
            placedCard.card.species[placedCard.speciesIndex]
        );
        const playedViaEffect = Boolean(freePlayPendingAction || paidPlayPendingAction);

        if (species.speciesData.name === 'European Hare') {
            return existingSpecies.every(existing => existing?.speciesData.name === 'European Hare') &&
                (playedViaEffect || existingCards.some(existing =>
                    existing.playedTurn === undefined || existing.playedTurn < gameState.turnNumber
                ));
        }
        if (species.speciesData.name === 'Common Toad') {
            return existingCards.length === 1 &&
                existingSpecies[0]?.speciesData.name === 'Common Toad' &&
                (existingCards[0].playedTurn === undefined || existingCards[0].playedTurn < gameState.turnNumber);
        }
        const hasStingingNettle = (['top', 'bottom', 'left', 'right'] as ForestSlot[]).some(treeSlot =>
            (tree[treeSlot] ?? []).some(placedCard =>
                placedCard.card.species[placedCard.speciesIndex]?.speciesData.name === 'Stinging Nettle'
            )
        );
        return species.speciesData.tags.includes('Butterfly') && hasStingingNettle &&
            existingSpecies.every(existing => existing?.speciesData.tags.includes('Butterfly'));
    };

    const renderPlacedCards = (cards: PlacedCard[] | undefined, slot: ForestSlot) => {
        if (!cards || cards.length === 0) return null;
        return (
            <div className="shared-slot-stack">
                {cards.map((placedCard, index) => (
                    <div
                        key={placedCard.card.cardId}
                        className={`slot-${slot}-wrapper shared-slot-card`}
                        style={{
                            transform: slot === 'top' || slot === 'bottom'
                                ? `translateX(${index * 8}px)`
                                : `translateY(${index * 8}px)`
                        }}
                    >
                        <Card card={placedCard.card} slot={slot} />
                    </div>
                ))}
                {cards.length > 1 && <span className="shared-slot-count">×{cards.length}</span>}
            </div>
        );
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
                    {' | '}{gameState.includedDecks.map(deck => deck === 'edge' ? 'Woodland Edge' : deck[0].toUpperCase() + deck.slice(1)).join(' + ')}
                </div>
            </div>

            <div className="actions">
                {isMyTurn && mulliganAction && (
                    <div className="pending-action">
                        <strong>{mulliganAction.prompt}</strong>
                        <span>Your current six cards will be returned to the box.</span>
                        <button className="action-btn primary" onClick={() => handlePendingAction(false)}>
                            Draw replacement hand
                        </button>
                        <button className="action-btn" onClick={() => handlePendingAction(true)}>
                            Keep this hand
                        </button>
                    </div>
                )}
                {isMyTurn && drawSourceAction && (
                    <div className="pending-action">
                        <strong>{drawSourceAction.prompt}</strong>
                        <button className="action-btn primary" onClick={() => handleDrawSource('deck')}>
                            Draw from deck
                        </button>
                        <button
                            className="action-btn"
                            disabled={clearingCardIds.length !== 1}
                            onClick={() => handleDrawSource('clearing')}
                        >
                            Take selected clearing card
                        </button>
                    </div>
                )}
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
                        {selectedCard?.isSplitCard && !selectedPlacement && (
                            <span>Choose a highlighted forest slot to select the card half.</span>
                        )}
                        {selectedCard?.isSplitCard && selectedPlacement && (
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
                        {selectedCard?.isSplitCard && !selectedPlacement && (
                            <span>Choose a highlighted forest slot to select the card half and its cost.</span>
                        )}
                        {selectedCard?.isSplitCard && selectedPlacement && (
                            <button className="action-btn primary" onClick={() => handlePlayCard()}>
                                Play {selectedCard.species[selectedSpeciesIndex]?.name} (Pay {selectedCard.species[selectedSpeciesIndex]?.speciesData.cost})
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
                {isMyTurn && cardChoiceAction && (
                    <div className="pending-action">
                        <strong>{cardChoiceAction.cardName}: choose abilities</strong>
                        {cardChoiceAction.effectText && <span>Effect: {cardChoiceAction.effectText}</span>}
                        {cardChoiceAction.bonusText && <span>Bonus: {cardChoiceAction.bonusText}</span>}
                        {cardChoiceAction.effectText && cardChoiceAction.bonusText && (
                            <button className="action-btn primary" onClick={() => handleCardChoices(true, true)}>
                                Use effect, then bonus
                            </button>
                        )}
                        {cardChoiceAction.effectText && (
                            <button className="action-btn" onClick={() => handleCardChoices(true, false)}>
                                Use effect only
                            </button>
                        )}
                        {cardChoiceAction.bonusText && (
                            <button className="action-btn" onClick={() => handleCardChoices(false, true)}>
                                Use bonus only
                            </button>
                        )}
                        <button className="action-btn" onClick={() => handleCardChoices(false, false)}>
                            Use neither
                        </button>
                    </div>
                )}
                {isMyTurn && !gameState.pendingAction && (
                    <>
                        <button
                            className="action-btn"
                            onClick={handleDrawTwo}
                            disabled={myPlayer.hand.length >= 10}
                        >
                            {clearingCardIds.length > 0
                                ? `Take ${clearingCardIds.length} + Draw ${Math.max(0, Math.min(2, 10 - myPlayer.hand.length) - clearingCardIds.length)}`
                                : myPlayer.hand.length === 9 ? 'Draw 1 Card' : 'Draw 2 Cards'}
                        </button>
                        {selectedCard && selectedCard.orientation === 'Tree' && (
                            <button className="action-btn primary" onClick={() => handlePlayCard()}>
                                Plant {selectedCard.species[0].name} (Pay {selectedCard.species[0].speciesData.cost})
                            </button>
                        )}
                        {selectedCard?.isSplitCard && !selectedPlacement && (
                            <span className="placement-guidance">Choose a highlighted forest slot to select the card half and its cost.</span>
                        )}
                        {selectedCard?.isSplitCard && selectedPlacement && (
                            <button className="action-btn primary" onClick={() => handlePlayCard()}>
                                Play {selectedCard.species[selectedSpeciesIndex]?.name} (Pay {selectedCard.species[selectedSpeciesIndex]?.speciesData.cost})
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
                        👤 {p.name} - Hand: {p.handCount ?? p.hand.length} cards | Forest: {p.forest.length} trees | Cave: {p.caveCount ?? p.cave.length} cards
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
                            const showTop = canPlaceInSlot(slot, 'top');
                            const showBottom = canPlaceInSlot(slot, 'bottom');
                            const showLeft = canPlaceInSlot(slot, 'left');
                            const showRight = canPlaceInSlot(slot, 'right');

                            return (
                                <div key={treeIndex} className="tree-slot">
                                    <div className={`slot top ${showTop ? 'available' : ''} ${selectedPlacement?.treeIndex === treeIndex && selectedPlacement.slot === 'top' ? 'chosen' : ''}`} onClick={() => showTop && handleSelectPlacement(treeIndex, 'top')}>
                                        {renderPlacedCards(slot.top, 'top')}
                                        {showTop && <span className="placement-icon shared-placement-icon">+</span>}
                                    </div>
                                    <div className={`slot left ${showLeft ? 'available' : ''} ${selectedPlacement?.treeIndex === treeIndex && selectedPlacement.slot === 'left' ? 'chosen' : ''}`} onClick={() => showLeft && handleSelectPlacement(treeIndex, 'left')}>
                                        {renderPlacedCards(slot.left, 'left')}
                                        {showLeft && <span className="placement-icon shared-placement-icon">+</span>}
                                    </div>
                                    <div className="tree-card">
                                        {slot.isSapling ? <div className="card sapling-card">Sapling</div> : <Card card={slot.tree} />}
                                    </div>
                                    <div className={`slot right ${showRight ? 'available' : ''} ${selectedPlacement?.treeIndex === treeIndex && selectedPlacement.slot === 'right' ? 'chosen' : ''}`} onClick={() => showRight && handleSelectPlacement(treeIndex, 'right')}>
                                        {renderPlacedCards(slot.right, 'right')}
                                        {showRight && <span className="placement-icon shared-placement-icon">+</span>}
                                    </div>
                                    <div className={`slot bottom ${showBottom ? 'available' : ''} ${selectedPlacement?.treeIndex === treeIndex && selectedPlacement.slot === 'bottom' ? 'chosen' : ''}`} onClick={() => showBottom && handleSelectPlacement(treeIndex, 'bottom')}>
                                        {renderPlacedCards(slot.bottom, 'bottom')}
                                        {showBottom && <span className="placement-icon shared-placement-icon">+</span>}
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
                                selectedSpeciesIndex={selectedCardId === c.cardId && (!c.isSplitCard || selectedPlacement) ? selectedSpeciesIndex : undefined}
                                onClick={() => handleCardClick(c)}
                            />
                        ))}
                    </div>
                </div>

                <div className="my-cave">
                    <h3>My Cave ({myPlayer.caveCount ?? myPlayer.cave.length})</h3>
                    <div className="hand-cards">
                        {myPlayer.cave.map(card => <Card key={card.cardId} card={card} />)}
                    </div>
                </div>
            </div>
        </div>
    );
}
