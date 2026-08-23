import { useState } from 'react';
import { socket } from '../services/socket';
import Card from './Card';
import type {
    SerializedGameState,
    Player,
    EnhancedCard,
    PlacedTree,
    PlacedCard,
    PendingAction,
    ScoreBreakdownItem
} from '../../../shared/types';
import { useI18n } from '../i18n';
import { translateCardText, translateSpeciesName } from '../data/cardTranslations.zh-CN';
import GameIcon from './GameIcon';
import { iconForDeck } from './gameIconData';

type ForestSlot = 'top' | 'bottom' | 'left' | 'right';

interface SelectedPlacement {
    treeIndex: number;
    slot: ForestSlot;
}

interface GameProps {
    gameState: SerializedGameState;
    playerId: string | undefined;
    roomCode: string;
    onOpenRules: () => void;
    onBackToGames: () => void;
}

export default function Game({ gameState, playerId, roomCode, onOpenRules, onBackToGames }: GameProps) {
    const { language, t } = useI18n();
    const [selectedCardId, setSelectedCardId] = useState<number | null>(null);
    const [selectedSpeciesIndex, setSelectedSpeciesIndex] = useState<number>(0);
    const [selectedPlacement, setSelectedPlacement] = useState<SelectedPlacement | null>(null);
    const [costCardIds, setCostCardIds] = useState<number[]>([]);
    const [clearingCardIds, setClearingCardIds] = useState<number[]>([]);
    const [viewedForestPlayerId, setViewedForestPlayerId] = useState(playerId);

    const myPlayer = gameState.players.find((p: Player) => p.id === playerId);
    const scoreBreakdown = gameState.myScoreBreakdown;
    const otherPlayers = gameState.players.filter((p: Player) => p.id !== playerId);
    const viewedForestPlayer = gameState.players.find((p: Player) => p.id === viewedForestPlayerId) ?? myPlayer;
    const isViewingMyForest = viewedForestPlayer?.id === playerId;

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
    const deckLabel = (deck: string) => deck === 'edge' ? t('edge') : deck === 'alpine' ? t('alpine') : t('baseGame');
    const speciesName = (name: string | undefined) => language === 'zh-CN' && name ? translateSpeciesName(name) : name ?? '';
    const abilityText = (text: string, kind: 'effect' | 'bonus') => language === 'zh-CN' ? translateCardText(text, kind) : text;

    const scoreItemTitle = (item: ScoreBreakdownItem) => {
        if (item.kind === 'butterflySet') return t('butterflySet', { number: item.setNumber });
        if (item.kind === 'cave') return language === 'zh-CN' ? '洞穴' : 'Cave';
        return speciesName(item.speciesName);
    };

    const scoreItemDetail = (item: ScoreBreakdownItem) => {
        switch (item.kind) {
            case 'butterflySet':
                return `${t('differentButterflies', { count: item.speciesNames.length })} · ${item.speciesNames.map(speciesName).join(language === 'zh-CN' ? '、' : ', ')}`;
            case 'cards': return t('scoringCards', { count: item.count });
            case 'collection': return t('collectionCards', { count: item.count });
            case 'cave': return t('caveCards', { count: item.count });
        }
    };

    const pendingPrompt = (action: PendingAction) => {
        if (action.kind === 'chooseDrawSource') return t('chooseTurnAction');
        if (language === 'en') return action.prompt;
        switch (action.kind) {
            case 'initialMulligan': return '起始手牌中没有树，是否重抽？';
            case 'selectClearingCards': return '从林间空地选择卡牌';
            case 'playFreeCard': return '免费打出一张符合条件的卡牌';
            case 'playPaidCards': return '打出任意数量的卡牌';
            case 'exchangeHandForDeck': return '将手牌放入洞穴并抽取等量卡牌';
            case 'playSaplings': return '将任意数量的手牌作为树苗打出';
            case 'takeAllMatching': return '拿取所有符合条件的林间空地卡牌';
            case 'triggeredDraws': return '选择永久效果的抽牌结算顺序';
            case 'chooseCardEffectAndBonus': return '选择要使用的卡牌能力';
            case 'continueCardBonus': return '继续结算卡牌奖励';
        }
    };

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
            setViewedForestPlayerId(playerId);
            setSelectedCardId(card.cardId);
            setSelectedSpeciesIndex(0);
            setSelectedPlacement(null);
            setCostCardIds([]);
        }
    };

    const handleStartDraw = (source: 'deck' | 'clearing', cardId?: number) => {
        socket.emit('draw_card', { roomCode, source, cardId });
        setClearingCardIds([]);
    };

    const handleClearingCardClick = (cardId: number) => {
        if (!isMyTurn || selectedCardId !== null) return;
        if (drawSourceAction) {
            handleDrawSource('clearing', cardId);
            return;
        }
        if (!gameState.pendingAction) {
            handleStartDraw('clearing', cardId);
            return;
        }
        if (!clearingPendingAction) return;
        if (clearingPendingAction.count === 1) {
            socket.emit('resolve_pending_action', { roomCode, cardIds: [cardId] });
            return;
        }
        const selectionLimit = clearingPendingAction.count;
        setClearingCardIds(current => current.includes(cardId)
            ? current.filter(id => id !== cardId)
            : current.length < selectionLimit ? [...current, cardId] : current
        );
    };

    const handlePendingAction = (decline: boolean) => {
        if (!myPendingAction || !playerId) return;
        socket.emit('resolve_pending_action', {
            roomCode,
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
            choiceId,
            decline: choiceId === undefined
        });
    };

    const handleDrawSource = (choiceId: 'deck' | 'clearing', cardId?: number) => {
        if (!drawSourceAction || !playerId) return;
        socket.emit('resolve_pending_action', {
            roomCode,
            choiceId,
            cardIds: choiceId === 'clearing' ? [cardId ?? clearingCardIds[0]].filter((id): id is number => id !== undefined) : []
        });
        setClearingCardIds([]);
    };

    const handleCardChoices = (useEffect: boolean, useBonus: boolean) => {
        if (!cardChoiceAction || !playerId) return;
        socket.emit('resolve_pending_action', {
            roomCode,
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
            alert(t('needCost', { required: requiredCost, selected: costCardIds.length }));
            return;
        }

        const playEvent = freePlayPendingAction
            ? 'play_pending_card'
            : paidPlayPendingAction ? 'play_pending_paid_card' : 'play_card';
        socket.emit(playEvent, {
            roomCode,
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

    const selectedCost = selectedCard
        ? selectedCard.species[selectedSpeciesIndex]?.speciesData.cost ?? 0
        : 0;
    const effectiveCost = freePlayPendingAction ? 0 : selectedCost;
    const hasEnoughPayment = costCardIds.length >= effectiveCost;
    const selectedName = selectedCard
        ? speciesName(selectedCard.species[selectedSpeciesIndex]?.name)
        : '';
    const canClickClearing = isMyTurn && selectedCardId === null && Boolean(
        drawSourceAction || clearingPendingAction || !gameState.pendingAction
    );
    const canClickHand = isMyTurn && Boolean(
        handSelectionPendingAction || freePlayPendingAction || paidPlayPendingAction || !gameState.pendingAction
    );

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

    if (!myPlayer) return <div>{language === 'zh-CN' ? '错误：游戏状态中找不到该玩家' : 'Error: Player not found in game state'}</div>;

    if (gameState.gameEnded) {
        return (
            <div className="game-over">
                <h1>{t('gameOver')}</h1>
                <div className="final-scores">
                    {gameState.players.map(p => (
                        <div key={p.id}>
                            {p.name}: {t('pointCount', { count: gameState.finalScores?.[p.id] ?? 0 })} {p.id === playerId ? `(${t('you')})` : ''}
                        </div>
                    ))}
                </div>
                <button onClick={onOpenRules}>{t('viewRules')}</button>
                <button onClick={onBackToGames}>{t('backHome')}</button>
            </div>
        );
    }

    return (
        <div className="game-board">
            <div className="game-meta">
                <div className={`turn-indicator ${isMyTurn ? 'my-turn' : ''}`}>
                    {isMyTurn ? t('yourTurn') : t('waitingFor', { name: activePlayer?.name ?? '' })}
                </div>
                <div className="game-meta-actions">
                    <button type="button" className="rules-button" onClick={onBackToGames}>{t('backHome')}</button>
                    <details className="score-panel">
                        <summary className="live-score" aria-label={t('currentScore', { score: gameState.myScore })}>
                            <GameIcon name="points" />
                            <span>{t('myScore')}</span>
                            <strong>{gameState.myScore}</strong>
                            <span className="score-expand" aria-hidden="true">⌄</span>
                        </summary>
                        <div className="score-breakdown">
                            <h3>{t('scoreBreakdown')}</h3>
                            <div className="score-breakdown-list">
                                {!scoreBreakdown && <p className="score-breakdown-unavailable">{t('breakdownUnavailable')}</p>}
                                {scoreBreakdown?.items.map((item, index) => (
                                    <div className={`score-breakdown-item ${item.points === 0 ? 'zero' : ''}`} key={`${item.kind}-${item.kind === 'butterflySet' ? item.setNumber : item.kind === 'cave' ? 'cave' : item.speciesName}-${index}`}>
                                        <span>
                                            <strong>{scoreItemTitle(item)}</strong>
                                            <small>{scoreItemDetail(item)}</small>
                                        </span>
                                        <b>{item.points > 0 ? '+' : ''}{item.points}</b>
                                    </div>
                                ))}
                            </div>
                            <div className="score-breakdown-total">
                                <span>{t('totalScore')}</span>
                                <strong>{scoreBreakdown?.total ?? gameState.myScore}</strong>
                            </div>
                        </div>
                    </details>
                    <div className="deck-info">
                        <span>🎴 {t('deckCount', { count: gameState.deckCount })}</span>
                        <span>❄️ {t('winterCount', { count: gameState.winterCardsDrawn })}</span>
                        <span className="included-decks">
                            {gameState.includedDecks.map(deck => (
                                <span key={deck}><GameIcon name={iconForDeck(deck)} />{deckLabel(deck)}</span>
                            ))}
                        </span>
                    </div>
                    <button type="button" className="game-rules-button" onClick={onOpenRules}>
                        <span aria-hidden="true">?</span> {t('rules')}
                    </button>
                </div>
            </div>

            <div className="actions">
                {isMyTurn && mulliganAction && (
                    <div className="pending-action">
                        <strong>{pendingPrompt(mulliganAction)}</strong>
                        <span>{t('currentSixRemoved')}</span>
                        <button className="action-btn primary" onClick={() => handlePendingAction(false)}>
                            {t('replacementHand')}
                        </button>
                        <button className="action-btn" onClick={() => handlePendingAction(true)}>
                            {t('keepHand')}
                        </button>
                    </div>
                )}
                {isMyTurn && drawSourceAction && (
                    <div className="pending-action">
                        <strong>{pendingPrompt(drawSourceAction)}</strong>
                        <button className="action-btn primary" onClick={() => handleDrawSource('deck')}>
                            {t('takeDeckNow')}
                        </button>
                        {drawSourceAction.canCancel && (
                            <button className="action-btn" onClick={() => handlePendingAction(true)}>
                                {t('backTurn')}
                            </button>
                        )}
                    </div>
                )}
                {isMyTurn && clearingPendingAction && (
                    <div className="pending-action">
                        <strong>{pendingPrompt(clearingPendingAction)}</strong>
                        <span>{t('selectExact', { count: clearingPendingAction.count })}</span>
                        <button
                            className="action-btn primary"
                            disabled={clearingCardIds.length !== clearingPendingAction.count}
                            onClick={() => handlePendingAction(false)}
                        >
                            {t('confirmSelection')}
                        </button>
                        {clearingPendingAction.optional && (
                            <button className="action-btn" onClick={() => handlePendingAction(true)}>
                                {t('decline')}
                            </button>
                        )}
                    </div>
                )}
                {isMyTurn && freePlayPendingAction && (
                    <div className="pending-action">
                        <strong>{pendingPrompt(freePlayPendingAction)}</strong>
                        <span>{t('selectEligible')}</span>
                        {selectedCard?.orientation === 'Tree' && (
                            <button className="action-btn primary" disabled={!hasEnoughPayment} onClick={() => handlePlayCard()}>
                                {t('playFree', { name: speciesName(selectedCard.species[selectedSpeciesIndex]?.name) })}
                            </button>
                        )}
                        {selectedCard?.isSplitCard && !selectedPlacement && (
                            <span>{t('chooseHalf')}</span>
                        )}
                        {selectedCard?.isSplitCard && selectedPlacement && (
                            <button className="action-btn primary" disabled={!hasEnoughPayment} onClick={() => handlePlayCard()}>
                                {t('playFree', { name: speciesName(selectedCard.species[selectedSpeciesIndex]?.name) })}
                            </button>
                        )}
                        {freePlayPendingAction.optional && (
                            <button className="action-btn" onClick={() => handlePendingAction(true)}>
                                {freePlayPendingAction.repeatable ? t('done') : t('decline')}
                            </button>
                        )}
                    </div>
                )}
                {isMyTurn && paidPlayPendingAction && (
                    <div className="pending-action">
                        <strong>{pendingPrompt(paidPlayPendingAction)}</strong>
                        <span>{t('paidPlayHelp')}</span>
                        {selectedCard?.orientation === 'Tree' && (
                            <button className="action-btn primary" onClick={() => handlePlayCard()}>
                                {t('plantPay', { name: speciesName(selectedCard.species[0].name), cost: selectedCard.species[0].speciesData.cost })}
                            </button>
                        )}
                        {selectedCard?.isSplitCard && !selectedPlacement && (
                            <span>{t('chooseHalfCost')}</span>
                        )}
                        {selectedCard?.isSplitCard && selectedPlacement && (
                            <button className="action-btn primary" onClick={() => handlePlayCard()}>
                                {t('playPay', { name: speciesName(selectedCard.species[selectedSpeciesIndex]?.name), cost: selectedCard.species[selectedSpeciesIndex]?.speciesData.cost })}
                            </button>
                        )}
                        <button className="action-btn" onClick={() => handlePendingAction(true)}>
                            {t('done')}
                        </button>
                    </div>
                )}
                {isMyTurn && handExchangePendingAction && (
                    <div className="pending-action">
                        <strong>{pendingPrompt(handExchangePendingAction)}</strong>
                        <span>{t('selectedHandCards', { count: costCardIds.length })}</span>
                        <button className="action-btn primary" onClick={() => handlePendingAction(false)}>
                            {t('exchangeSelected')}
                        </button>
                        <button className="action-btn" onClick={() => handlePendingAction(true)}>
                            {t('decline')}
                        </button>
                    </div>
                )}
                {isMyTurn && saplingPendingAction && (
                    <div className="pending-action">
                        <strong>{pendingPrompt(saplingPendingAction)}</strong>
                        <span>{t('selectedHandCards', { count: costCardIds.length })}</span>
                        <button className="action-btn primary" onClick={() => handlePendingAction(false)}>
                            {t('playSaplings')}
                        </button>
                        <button className="action-btn" onClick={() => handlePendingAction(true)}>
                            {t('decline')}
                        </button>
                    </div>
                )}
                {isMyTurn && takeAllPendingAction && (
                    <div className="pending-action">
                        <strong>{pendingPrompt(takeAllPendingAction)}</strong>
                        <span>{t('matchingMove')}</span>
                        <button
                            className="action-btn primary"
                            disabled={myPlayer.hand.length + takeAllPendingAction.count > 10}
                            onClick={() => handlePendingAction(false)}
                        >
                            {t('takeMatching')}
                        </button>
                        <button className="action-btn" onClick={() => handlePendingAction(true)}>
                            {t('decline')}
                        </button>
                    </div>
                )}
                {isMyTurn && triggeredDrawAction && (
                    <div className="pending-action">
                        <strong>{pendingPrompt(triggeredDrawAction)}</strong>
                        <span>{t('triggerOrder')}</span>
                        {triggeredDrawAction.triggers.map(trigger => (
                            <button
                                key={trigger.id}
                                className="action-btn primary"
                                onClick={() => handleTriggeredDraw(trigger.id)}
                            >
                                {t('drawFor', { name: speciesName(trigger.sourceName) })}
                            </button>
                        ))}
                        <button className="action-btn" onClick={() => handleTriggeredDraw()}>
                            {t('finishTriggers')}
                        </button>
                    </div>
                )}
                {isMyTurn && cardChoiceAction && (
                    <div className="pending-action">
                        <strong>{t('chooseAbilities', { name: speciesName(cardChoiceAction.cardName) })}</strong>
                        {cardChoiceAction.effectText && <span>{t('effect')}: {abilityText(cardChoiceAction.effectText, 'effect')}</span>}
                        {cardChoiceAction.bonusText && <span>{t('bonus')}: {abilityText(cardChoiceAction.bonusText, 'bonus')}</span>}
                        {cardChoiceAction.effectText && cardChoiceAction.bonusText && (
                            <button className="action-btn primary" onClick={() => handleCardChoices(true, true)}>
                                {t('useBoth')}
                            </button>
                        )}
                        {cardChoiceAction.effectText && (
                            <button className="action-btn" onClick={() => handleCardChoices(true, false)}>
                                {t('useEffectOnly')}
                            </button>
                        )}
                        {cardChoiceAction.bonusText && (
                            <button className="action-btn" onClick={() => handleCardChoices(false, true)}>
                                {t('useBonusOnly')}
                            </button>
                        )}
                        <button className="action-btn" onClick={() => handleCardChoices(false, false)}>
                            {t('useNeither')}
                        </button>
                    </div>
                )}
                {isMyTurn && !gameState.pendingAction && (
                    <>
                        {!selectedCard && <strong className="action-prompt">{t('chooseTurnAction')}</strong>}
                        {!selectedCard && (
                            <button
                                className="action-btn"
                                onClick={() => handleStartDraw('deck')}
                                disabled={myPlayer.hand.length >= 10}
                            >
                                {t('takeDeckNow')}
                            </button>
                        )}
                        {selectedCard && selectedCard.orientation === 'Tree' && (
                            <button className="action-btn primary" disabled={!hasEnoughPayment} onClick={() => handlePlayCard()}>
                                {t('plantPay', { name: speciesName(selectedCard.species[0].name), cost: selectedCard.species[0].speciesData.cost })}
                            </button>
                        )}
                        {selectedCard?.isSplitCard && !selectedPlacement && (
                            <span className="placement-guidance">{t('chooseHalfCost')}</span>
                        )}
                        {selectedCard?.isSplitCard && selectedPlacement && (
                            <button className="action-btn primary" disabled={!hasEnoughPayment} onClick={() => handlePlayCard()}>
                                {t('playPay', { name: speciesName(selectedCard.species[selectedSpeciesIndex]?.name), cost: selectedCard.species[selectedSpeciesIndex]?.speciesData.cost })}
                            </button>
                        )}
                        {selectedCard && (
                            <>
                                <span className="selection-summary">
                                    <strong>{t('selectedPlay', { name: selectedName })}</strong>
                                    <small>{t('paymentProgress', { selected: costCardIds.length, required: effectiveCost })}</small>
                                </span>
                                <button className="action-btn" onClick={() => handlePlayCard(undefined, undefined, true)}>
                                    {t('playSapling')}
                                </button>
                                <button className="action-btn subtle" onClick={resetCardSelection}>
                                    {t('cancelPlay')}
                                </button>
                            </>
                        )}
                    </>
                )}
                {isMyTurn && gameState.pendingAction && !myPendingAction && (
                    <span>{t('waitingPending')}</span>
                )}
            </div>

            <section className="my-hand game-section">
                <h3>{t('myHand', { count: myPlayer.hand.length })}</h3>
                <div className="hand-cards">
                    {myPlayer.hand.map((c) => (
                        <Card
                            key={c.cardId}
                            card={c}
                            isSelected={selectedCardId === c.cardId}
                            isCostSelected={costCardIds.includes(c.cardId)}
                            selectedSpeciesIndex={selectedCardId === c.cardId && (!c.isSplitCard || selectedPlacement) ? selectedSpeciesIndex : undefined}
                            onClick={canClickHand ? () => handleCardClick(c) : undefined}
                        />
                    ))}
                </div>
            </section>

            <section className="forest-viewer game-section">
                <div className="forest-viewer-header">
                    <h3>{isViewingMyForest ? t('myForest') : t('playerForest', { name: viewedForestPlayer?.name ?? '' })}</h3>
                    <div className="forest-tabs" role="tablist" aria-label={t('chooseForest')}>
                        {gameState.players.map(player => (
                            <button
                                key={player.id}
                                type="button"
                                role="tab"
                                aria-selected={viewedForestPlayer?.id === player.id}
                                className={viewedForestPlayer?.id === player.id ? 'active' : ''}
                                onClick={() => setViewedForestPlayerId(player.id)}
                            >
                                {player.id === playerId ? t('myForestTab') : player.name}
                            </button>
                        ))}
                    </div>
                </div>
                {!isViewingMyForest && (
                    <p className="forest-view-note">{t('viewingOnly')}</p>
                )}
                <div className={`forest-grid ${isViewingMyForest ? '' : 'read-only'}`}>
                    {viewedForestPlayer?.forest.length === 0 && (
                        <p>{isViewingMyForest ? t('noTrees') : t('emptyForest')}</p>
                    )}
                    {viewedForestPlayer?.forest.map((slot, treeIndex) => {
                        const showTop = isViewingMyForest && canPlaceInSlot(slot, 'top');
                        const showBottom = isViewingMyForest && canPlaceInSlot(slot, 'bottom');
                        const showLeft = isViewingMyForest && canPlaceInSlot(slot, 'left');
                        const showRight = isViewingMyForest && canPlaceInSlot(slot, 'right');

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
                                    {slot.isSapling ? <div className="card sapling-card">{t('sapling')}</div> : <Card card={slot.tree} />}
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
                    {isViewingMyForest && (
                        <div
                            className={`new-tree-zone ${selectedCard?.orientation === 'Tree' && hasEnoughPayment ? 'available' : ''}`}
                            onClick={selectedCard?.orientation === 'Tree' && hasEnoughPayment ? () => handlePlayCard() : undefined}
                        >
                            {selectedCard?.orientation === 'Tree' && hasEnoughPayment ? <span className="placement-icon">+</span> : ''}
                        </div>
                    )}
                </div>
            </section>

            <section className="clearing-area game-section">
                <h3>{t('clearing')}</h3>
                <div className="clearing-cards">
                    {gameState.clearing.length === 0 ? <p>{t('empty')}</p> :
                        gameState.clearing.map(c => (
                            <Card
                                key={c.cardId}
                                card={c}
                                isCostSelected={clearingCardIds.includes(c.cardId)}
                                onClick={canClickClearing ? () => handleClearingCardClick(c.cardId) : undefined}
                            />
                        ))
                    }
                </div>
            </section>

            <section className="my-cave game-section">
                <h3 className="icon-heading"><GameIcon name="cave" />{t('myCave', { count: myPlayer.caveCount ?? myPlayer.cave.length })}</h3>
                <div className="hand-cards">
                    {myPlayer.cave.map(card => <Card key={card.cardId} card={card} />)}
                </div>
            </section>

            <section className="opponents game-section">
                <h3>{t('opponents')}</h3>
                {otherPlayers.map((p: Player) => (
                    <button
                        key={p.id}
                        type="button"
                        className={`opponent ${viewedForestPlayer?.id === p.id ? 'selected' : ''}`}
                        onClick={() => setViewedForestPlayerId(p.id)}
                    >
                        👤 {p.name} — {t('handCount', { count: p.handCount ?? p.hand.length })} | {t('forestCount', { count: p.forest.length })} | {t('caveCount', { count: p.caveCount ?? p.cave.length })}
                        <span>{t('viewForest')}</span>
                    </button>
                ))}
            </section>
        </div>
    );
}
