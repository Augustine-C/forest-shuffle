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
    function onConnect() {
      setIsConnected(true);
      setPlayerId(socket.id);
    }

    function onDisconnect() {
      setIsConnected(false);
      setRoomCode(null);
      setPlayers([]);
    }

    function onGameStart({ gameState }: { gameState: any }) {
      console.log('Game started!', gameState);
      setGameState(gameState);
      setGameStarted(true);
    }

    function onGameStateUpdate(gameState: any) {
      console.log('Game state updated:', gameState);
      setGameState(gameState);
    }

    function onGameCreated({ roomCode }: { roomCode: string, currentPlayerId: string }) {
      console.log('Game created:', roomCode);
      setRoomCode(roomCode);
      setIsHost(true);
    }

    function onGameJoined({ roomCode }: { roomCode: string, currentPlayerId: string }) {
      console.log('Joined game:', roomCode);
      setRoomCode(roomCode);
      setIsHost(false);
    }

    function onPlayerListUpdate(players: any[]) {
      console.log('Player list updated:', players);
      setPlayers(players);
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('game_start', onGameStart);
    socket.on('game_state_update', onGameStateUpdate);
    socket.on('game_created', onGameCreated);
    socket.on('game_joined', onGameJoined);
    socket.on('player_list_update', onPlayerListUpdate);

    socket.connect();

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('game_start', onGameStart);
      socket.off('game_state_update', onGameStateUpdate);
      socket.off('game_created', onGameCreated);
      socket.off('game_joined', onGameJoined);
      socket.off('player_list_update', onPlayerListUpdate);
      socket.disconnect();
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
