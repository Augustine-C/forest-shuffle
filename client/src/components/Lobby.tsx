import { useState } from 'react';
import { socket } from '../services/socket';
import type { DeckType, Player } from '../../../shared/types';
import './Lobby.css';

interface LobbyProps {
    roomCode: string | null;
    players: Player[];
    isHost: boolean;
    playerId: string | undefined;
    onOpenGallery: () => void;
}

export default function Lobby({ roomCode, players, isHost, playerId, onOpenGallery }: LobbyProps) {
    const [joinRoomCode, setJoinRoomCode] = useState('');
    const [playerName, setPlayerName] = useState('');
    const [startingPlayerId, setStartingPlayerId] = useState(playerId ?? '');
    const [includedDecks, setIncludedDecks] = useState<DeckType[]>(['basic']);
    const [roomCodeCopied, setRoomCodeCopied] = useState(false);

    const toggleExpansion = (deck: 'alpine' | 'edge') => {
        setIncludedDecks(current => current.includes(deck)
            ? current.filter(selected => selected !== deck)
            : [...current, deck]
        );
    };

    const handleCreateGame = () => {
        if (!playerName) return alert('Enter name');
        socket.emit('create_game', { playerName });
    };

    const handleJoinGame = () => {
        if (!playerName || !joinRoomCode) return alert('Enter name and room code');
        socket.emit('join_game', { roomCode: joinRoomCode, playerName });
    };

    const handleStartGame = () => {
        if (roomCode) {
            socket.emit('start_game', {
                roomCode,
                playerId,
                startingPlayerId: startingPlayerId || playerId,
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
            window.prompt('Copy this room code:', roomCode);
        }
    };

    if (roomCode) {
        return (
            <main className="lobby lobby-room">
                <header className="room-lobby-header">
                    <div>
                        <p className="lobby-eyebrow">The forest is gathering</p>
                        <h1>Game Lobby</h1>
                        <p>Choose the decks, invite your table, then begin.</p>
                    </div>
                    <div className="room-code-card">
                        <span>Room code</span>
                        <strong>{roomCode}</strong>
                        <button type="button" onClick={copyRoomCode}>
                            {roomCodeCopied ? 'Copied!' : 'Copy code'}
                        </button>
                    </div>
                </header>

                <div className="room-lobby-grid">
                    <section className="lobby-section player-list">
                        <div className="lobby-section-heading">
                            <div>
                                <p className="lobby-eyebrow">At the table</p>
                                <h2>Players</h2>
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
                                    {player.isHost && <span className="host-badge">Host</span>}
                                    {player.id === playerId && <span className="you-badge">You</span>}
                                </li>
                            ))}
                        </ul>
                        {players.length < 5 && (
                            <p className="invite-hint">Share <strong>{roomCode}</strong> to invite up to {5 - players.length} more player(s).</p>
                        )}
                    </section>

                    <section className="lobby-section lobby-settings">
                        {isHost ? (
                            <>
                            <div className="lobby-section-heading">
                                <div>
                                    <p className="lobby-eyebrow">Host controls</p>
                                    <h2>Game setup</h2>
                                </div>
                            </div>
                            <label className="lobby-field" htmlFor="starting-player">
                                <span>Who most recently walked in a forest?</span>
                                <select
                                    id="starting-player"
                                    value={startingPlayerId || playerId}
                                    onChange={event => setStartingPlayerId(event.target.value)}
                                >
                                    {players.map(player => (
                                        <option key={player.id} value={player.id}>{player.name}</option>
                                    ))}
                                </select>
                            </label>
                            <fieldset className="deck-picker">
                                <legend>Playable decks</legend>
                                <label className="deck-option always-on">
                                    <input type="checkbox" checked disabled />
                                    <span><strong>Base game</strong><small>The heart of the forest</small></span>
                                </label>
                                <label className="deck-option">
                                    <input
                                        type="checkbox"
                                        checked={includedDecks.includes('alpine')}
                                        onChange={() => toggleExpansion('alpine')}
                                    />
                                    <span><strong>Alpine</strong><small>Mountain species and trees</small></span>
                                </label>
                                <label className="deck-option">
                                    <input
                                        type="checkbox"
                                        checked={includedDecks.includes('edge')}
                                        onChange={() => toggleExpansion('edge')}
                                    />
                                    <span><strong>Woodland Edge</strong><small>Shrubs and edge dwellers</small></span>
                                </label>
                                <small className="deck-note">Exploration and promotional cards remain reference-only.</small>
                            </fieldset>
                            <button className="lobby-primary start-game-button" onClick={handleStartGame}>
                                Start game <span aria-hidden="true">→</span>
                            </button>
                            </>
                        ) : (
                            <div className="waiting-state">
                                <span className="waiting-rings" aria-hidden="true" />
                                <p className="lobby-eyebrow">Ready to grow</p>
                                <h2>Waiting for the host</h2>
                                <p>The game will begin when the host finishes choosing the decks.</p>
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
                    <span>F</span><span>S</span>
                </div>
                <p className="lobby-eyebrow">Build a thriving woodland</p>
                <h1>Forest<br />Shuffle</h1>
                <p className="lobby-intro">Plant trees, welcome wildlife, and create the most valuable forest before winter arrives.</p>
                <div className="lobby-facts" aria-label="Game information">
                    <span>2–5 players</span>
                    <span>60 min</span>
                    <span>Strategy</span>
                </div>
            </section>

            <section className="lobby-welcome">
                <div className="welcome-heading">
                    <p className="lobby-eyebrow">Online table</p>
                    <h2>Enter the forest</h2>
                    <p>Create a new room or join friends with their four-letter code.</p>
                </div>

                <label className="lobby-field">
                    <span>Your name</span>
                    <input
                        autoComplete="nickname"
                        placeholder="How should the forest know you?"
                        value={playerName}
                        onChange={event => setPlayerName(event.target.value)}
                    />
                </label>

                <button className="lobby-primary create-game-button" onClick={handleCreateGame}>
                    Create a new game <span aria-hidden="true">→</span>
                </button>

                <div className="lobby-divider"><span>or join a room</span></div>

                <div className="join-section">
                    <label className="lobby-field">
                        <span>Room code</span>
                        <input
                            className="room-code-input"
                            inputMode="text"
                            maxLength={4}
                            placeholder="ABCD"
                            value={joinRoomCode}
                            onChange={event => setJoinRoomCode(event.target.value.toUpperCase())}
                        />
                    </label>
                    <button className="join-button" onClick={handleJoinGame}>Join game</button>
                </div>

                <button className="gallery-entry" onClick={onOpenGallery}>
                    <span aria-hidden="true">▦</span>
                    <span><strong>Explore the card gallery</strong><small>Browse all 233 cards before playing</small></span>
                    <span aria-hidden="true">→</span>
                </button>
            </section>
        </main>
    );
}
