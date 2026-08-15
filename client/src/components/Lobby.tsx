import { useState } from 'react';
import { socket } from '../services/socket';
import type { DeckType, Player } from '../../../shared/types';
import { useI18n } from '../i18n';
import './Lobby.css';
import GameIcon from './GameIcon';

interface LobbyProps {
    roomCode: string | null;
    players: Player[];
    isHost: boolean;
    playerId: string | undefined;
    onOpenGallery: () => void;
    onOpenRules: () => void;
}

export default function Lobby({ roomCode, players, isHost, playerId, onOpenGallery, onOpenRules }: LobbyProps) {
    const { language, t } = useI18n();
    const [joinRoomCode, setJoinRoomCode] = useState('');
    const [playerName, setPlayerName] = useState('');
    const [startingPlayerId, setStartingPlayerId] = useState(playerId ?? '');
    const [includedDecks, setIncludedDecks] = useState<DeckType[]>(['basic']);
    const [roomCodeCopied, setRoomCodeCopied] = useState(false);
    const selectedStartingPlayerId = players.some(player => player.id === startingPlayerId)
        ? startingPlayerId
        : players.some(player => player.id === playerId)
            ? playerId ?? ''
            : players[0]?.id ?? '';

    const toggleExpansion = (deck: 'alpine' | 'edge') => {
        setIncludedDecks(current => current.includes(deck)
            ? current.filter(selected => selected !== deck)
            : [...current, deck]
        );
    };

    const handleCreateGame = () => {
        if (!playerName) return alert(t('enterName'));
        socket.emit('create_game', { playerName });
    };

    const handleJoinGame = () => {
        if (!playerName || !joinRoomCode) return alert(t('enterNameAndCode'));
        socket.emit('join_game', { roomCode: joinRoomCode, playerName });
    };

    const handleStartGame = () => {
        if (roomCode) {
            socket.emit('start_game', {
                roomCode,
                playerId,
                startingPlayerId: selectedStartingPlayerId,
                includedDecks
            });
        }
    };

    const copyRoomCode = async () => {
        if (!roomCode) return;
        try {
            if (!navigator.clipboard) throw new Error('Clipboard unavailable');
            await navigator.clipboard.writeText(roomCode);
            setRoomCodeCopied(true);
            window.setTimeout(() => setRoomCodeCopied(false), 1600);
        } catch {
            window.prompt(t('copyRoomCode'), roomCode);
        }
    };

    if (roomCode) {
        return (
            <main className="lobby lobby-room">
                <header className="room-lobby-header">
                    <div>
                        <p className="lobby-eyebrow">{t('forestGathering')}</p>
                        <h1>{t('gameLobby')}</h1>
                        <p>{t('lobbyIntro')}</p>
                    </div>
                    <div className="room-header-actions">
                        <button type="button" className="room-rules-button" onClick={onOpenRules}>
                            <span aria-hidden="true">?</span> {t('rules')}
                        </button>
                        <div className="room-code-card">
                            <span>{t('roomCode')}</span>
                            <strong>{roomCode}</strong>
                            <button type="button" onClick={copyRoomCode}>
                                {roomCodeCopied ? t('copied') : t('copyCode')}
                            </button>
                        </div>
                    </div>
                </header>

                <div className="room-lobby-grid">
                    <section className="lobby-section player-list">
                        <div className="lobby-section-heading">
                            <div>
                                <p className="lobby-eyebrow">{t('atTable')}</p>
                                <h2>{t('players')}</h2>
                            </div>
                            <span className="player-count">{players.length} / 5</span>
                        </div>
                        <ul>
                            {players.map((player) => (
                                <li key={player.id}>
                                    <span className="player-avatar" aria-hidden="true">
                                        {player.name.trim().charAt(0).toUpperCase() || '?'}
                                    </span>
                                    <span className="player-name">{player.name}</span>
                                    {player.isHost && <span className="host-badge">{t('host')}</span>}
                                    {player.id === playerId && <span className="you-badge">{t('you')}</span>}
                                </li>
                            ))}
                        </ul>
                        {players.length < 5 && (
                            <p className="invite-hint">{t('invite', { code: roomCode, count: 5 - players.length })}</p>
                        )}
                    </section>

                    <section className="lobby-section lobby-settings">
                        {isHost ? (
                            <>
                            <div className="lobby-section-heading">
                                <div>
                                    <p className="lobby-eyebrow">{t('hostControls')}</p>
                                    <h2>{t('gameSetup')}</h2>
                                </div>
                            </div>
                            <label className="lobby-field" htmlFor="starting-player">
                                <span>{t('startingPlayer')}</span>
                                <select
                                    id="starting-player"
                                    value={selectedStartingPlayerId}
                                    onChange={event => setStartingPlayerId(event.target.value)}
                                >
                                    {players.map(player => (
                                        <option key={player.id} value={player.id}>{player.name}</option>
                                    ))}
                                </select>
                            </label>
                            <fieldset className="deck-picker">
                                <legend>{t('playableDecks')}</legend>
                                <label className="deck-option always-on">
                                    <input type="checkbox" checked disabled />
                                    <GameIcon name="tree" />
                                    <span><strong>{t('baseGame')}</strong><small>{t('baseDesc')}</small></span>
                                </label>
                                <label className="deck-option">
                                    <input
                                        type="checkbox"
                                        checked={includedDecks.includes('alpine')}
                                        onChange={() => toggleExpansion('alpine')}
                                    />
                                    <GameIcon name="alps" />
                                    <span><strong>{t('alpine')}</strong><small>{t('alpineDesc')}</small></span>
                                </label>
                                <label className="deck-option">
                                    <input
                                        type="checkbox"
                                        checked={includedDecks.includes('edge')}
                                        onChange={() => toggleExpansion('edge')}
                                    />
                                    <GameIcon name="woodland-edge" />
                                    <span><strong>{t('edge')}</strong><small>{t('edgeDesc')}</small></span>
                                </label>
                                <small className="deck-note">{t('deckNote')}</small>
                            </fieldset>
                            <button className="lobby-primary start-game-button" onClick={handleStartGame}>
                                {t('startGame')} <span aria-hidden="true">→</span>
                            </button>
                            </>
                        ) : (
                            <div className="waiting-state">
                                <span className="waiting-rings" aria-hidden="true" />
                                <p className="lobby-eyebrow">{t('readyToGrow')}</p>
                                <h2>{t('waitingHost')}</h2>
                                <p>{t('waitingHostDesc')}</p>
                            </div>
                        )}
                    </section>
                </div>
            </main>
        );
    }

    return (
        <main className="lobby lobby-home">
            <section className="lobby-hero">
                <div className="forest-mark" aria-hidden="true">
                    <GameIcon name="tree" />
                </div>
                <p className="lobby-eyebrow">{t('buildWoodland')}</p>
                <h1>{language === 'en' ? <>Forest<br />Shuffle</> : t('forestShuffle')}</h1>
                <p className="lobby-intro">{t('homeIntro')}</p>
                <div className="lobby-facts" aria-label={t('gameInfo')}>
                    <span>{t('playerCount')}</span>
                    <span>{t('minutes')}</span>
                    <span>{t('strategy')}</span>
                </div>
            </section>

            <section className="lobby-welcome">
                <div className="welcome-heading">
                    <p className="lobby-eyebrow">{t('onlineTable')}</p>
                    <h2>{t('enterForest')}</h2>
                    <p>{t('joinIntro')}</p>
                </div>

                <label className="lobby-field">
                    <span>{t('yourName')}</span>
                    <input
                        autoComplete="nickname"
                        placeholder={t('namePlaceholder')}
                        value={playerName}
                        onChange={event => setPlayerName(event.target.value)}
                    />
                </label>

                <button className="lobby-primary create-game-button" onClick={handleCreateGame}>
                    {t('createGame')} <span aria-hidden="true">→</span>
                </button>

                <div className="lobby-divider"><span>{t('orJoin')}</span></div>

                <div className="join-section">
                    <label className="lobby-field">
                        <span>{t('roomCode')}</span>
                        <input
                            className="room-code-input"
                            inputMode="text"
                            maxLength={4}
                            placeholder="ABCD"
                            value={joinRoomCode}
                            onChange={event => setJoinRoomCode(event.target.value.toUpperCase())}
                        />
                    </label>
                    <button className="join-button" onClick={handleJoinGame}>{t('joinGame')}</button>
                </div>

                <button className="gallery-entry" onClick={onOpenGallery}>
                    <span aria-hidden="true">▦</span>
                    <span><strong>{t('exploreGallery')}</strong><small>{t('galleryDesc')}</small></span>
                    <span aria-hidden="true">→</span>
                </button>
                <button className="gallery-entry rules-entry" onClick={onOpenRules}>
                    <span aria-hidden="true">?</span>
                    <span><strong>{t('readRules')}</strong><small>{t('rulesDesc')}</small></span>
                    <span aria-hidden="true">→</span>
                </button>
            </section>
        </main>
    );
}
