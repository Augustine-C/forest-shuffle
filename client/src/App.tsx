import { useState, useEffect } from 'react';
import { socket } from './services/socket';
import Lobby from './components/Lobby';
import Game from './components/Game';
import './App.css';

function App() {
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameState, setGameState] = useState<any>(null); // Use proper type later
  const [playerId, setPlayerId] = useState(socket.id);

  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [players, setPlayers] = useState<any[]>([]);
  const [isHost, setIsHost] = useState(false);

  useEffect(() => {
    // Check for existing session
    const savedSession = localStorage.getItem('forest_shuffle_session');
    if (savedSession) {
      const { roomCode: savedRoom, playerId: savedId } = JSON.parse(savedSession);
      console.log('Found saved session:', savedRoom, savedId);
      setRoomCode(savedRoom);
      setPlayerId(savedId);
      socket.emit('rejoin_game', { roomCode: savedRoom, playerId: savedId });
    }

    function onConnect() {
      setIsConnected(true);
    }

    function onDisconnect() {
      setIsConnected(false);
    }

    function onGameStart({ gameState }: { gameState: any }) {
      console.log('Game started!', gameState);
      setGameState(gameState);
      setGameStarted(true);
    }

    function onGameStateUpdate(gameState: any) {
      console.log('Game state updated:', gameState);
      setGameState(gameState);
      if (gameState.gameEnded) {
        localStorage.removeItem('forest_shuffle_session');
      }
    }

    function onGameCreated({ roomCode, currentPlayerId }: { roomCode: string, currentPlayerId: string }) {
      console.log('Game created:', roomCode);
      setRoomCode(roomCode);
      setPlayerId(currentPlayerId);
      setIsHost(true);
      localStorage.setItem('forest_shuffle_session', JSON.stringify({ roomCode, playerId: currentPlayerId }));
    }

    function onGameJoined({ roomCode, currentPlayerId, isHost }: { roomCode: string, currentPlayerId: string, isHost?: boolean }) {
      console.log('Joined game:', roomCode);
      setRoomCode(roomCode);
      setPlayerId(currentPlayerId);
      if (isHost !== undefined) setIsHost(isHost);
      localStorage.setItem('forest_shuffle_session', JSON.stringify({ roomCode, playerId: currentPlayerId }));
    }

    function onPlayerListUpdate(players: any[]) {
      console.log('Player list updated:', players);
      setPlayers(players);
    }

    function onError(msg: string) {
      alert(msg);
      if (msg.includes('not found')) {
        localStorage.removeItem('forest_shuffle_session');
        setRoomCode(null);
        setGameStarted(false);
      }
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('game_start', onGameStart);
    socket.on('game_state_update', onGameStateUpdate);
    socket.on('game_created', onGameCreated);
    socket.on('game_joined', onGameJoined);
    socket.on('player_list_update', onPlayerListUpdate);
    socket.on('error', onError);

    socket.connect();

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('game_start', onGameStart);
      socket.off('game_state_update', onGameStateUpdate);
      socket.off('game_created', onGameCreated);
      socket.off('game_joined', onGameJoined);
      socket.off('player_list_update', onPlayerListUpdate);
      socket.off('error', onError);
    };
  }, []);

  return (
    <>
      <div className="status-bar">
        Status: {isConnected ? 'Connected' : 'Disconnected'}
      </div>
      {gameStarted && gameState ? (
        <Game
          gameState={gameState}
          playerId={playerId || socket.id}
          roomCode={roomCode || ''}
        />
      ) : (
        <Lobby
          roomCode={roomCode}
          players={players}
          isHost={isHost}
        />
      )}
    </>
  );
}

export default App;
