import { useState } from 'react';
import { socket } from '../services/socket';
import type { Player } from '../../../shared/types';

interface LobbyProps {
    roomCode: string | null;
    players: Player[];
    isHost: boolean;
    playerId: string | undefined;
}

export default function Lobby({ roomCode, players, isHost, playerId }: LobbyProps) {
    const [joinRoomCode, setJoinRoomCode] = useState('');
    const [playerName, setPlayerName] = useState('');
    const [startingPlayerId, setStartingPlayerId] = useState(playerId ?? '');

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
                startingPlayerId: startingPlayerId || playerId
            });
        }
    };

    if (roomCode) {
        return (
            <div className="lobby">
                <h1>Lobby</h1>
                <div className="room-info">
                    <h2>Room Code: <span className="code">{roomCode}</span></h2>
                    <p>Share this code with your friends!</p>
                </div>

                <div className="player-list">
                    <h3>Players ({players.length})</h3>
                    <ul>
                        {players.map((p, i) => (
                            <li key={i}>{p.name} {p.isHost ? '(Host)' : ''}</li>
                        ))}
                    </ul>
                </div>

                <div className="actions">
                    {isHost ? (
                        <>
                            <label htmlFor="starting-player">Who most recently walked in a forest?</label>
                            <select
                                id="starting-player"
                                value={startingPlayerId || playerId}
                                onChange={event => setStartingPlayerId(event.target.value)}
                            >
                                {players.map(player => (
                                    <option key={player.id} value={player.id}>{player.name}</option>
                                ))}
                            </select>
                            <button className="primary-btn" onClick={handleStartGame}>Start Game</button>
                        </>
                    ) : (
                        <p>Waiting for host to start...</p>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="lobby">
            <h1>Forest Shuffle</h1>
            <div className="setup-form">
                <input
                    placeholder="Your Name"
                    value={playerName}
                    onChange={e => setPlayerName(e.target.value)}
                />
            </div>

            <div className="actions-api">
                <button onClick={handleCreateGame}>Create New Game</button>

                <div className="divider">OR</div>

                <div className="join-section">
                    <input
                        placeholder="Room Code"
                        value={joinRoomCode}
                        onChange={e => setJoinRoomCode(e.target.value)}
                    />
                    <button onClick={handleJoinGame}>Join Game</button>
                </div>
            </div>
        </div>
    );
}
