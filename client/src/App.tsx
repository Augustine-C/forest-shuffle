import { useEffect, useRef, useState } from 'react';
import { socket } from './services/socket';
import { apiRequest } from './services/api';
import Lobby from './components/Lobby';
import Game from './components/Game';
import CardGallery from './components/CardGallery';
import RulesPage from './components/RulesPage';
import AuthScreen from './components/AuthScreen';
import AccountHome from './components/AccountHome';
import { LanguageSwitcher, useI18n } from './i18n';
import type { AccountProfile, GameStatus, GameSummary, Player, SerializedGameState } from '../../shared/types';
import './App.css';

function App() {
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [account, setAccount] = useState<AccountProfile | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [games, setGames] = useState<GameSummary[]>([]);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameState, setGameState] = useState<SerializedGameState | null>(null);
  const [playerId, setPlayerId] = useState<string>();
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const roomCodeRef = useRef<string | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [isHost, setIsHost] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [showRules, setShowRules] = useState(false);

  useEffect(() => {
    localStorage.removeItem('forest_shuffle_session');
    apiRequest<{ account: AccountProfile }>('/api/auth/me')
      .then(result => setAccount(result.account))
      .catch(() => setAccount(null))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { roomCodeRef.current = roomCode; }, [roomCode]);

  useEffect(() => {
    if (!account) { socket.disconnect(); return; }
    const onConnect = () => {
      setIsConnected(true);
      if (roomCodeRef.current) socket.emit('open_game', { roomCode: roomCodeRef.current });
    };
    const onDisconnect = () => setIsConnected(false);
    const onGameStart = ({ gameState }: { gameState: SerializedGameState }) => { setGameState(gameState); setGameStarted(true); };
    const onGameStateUpdate = (state: SerializedGameState) => { setGameState(state); setGameStarted(true); };
    const onGameJoined = ({ roomCode, currentPlayerId, isHost, status }: { roomCode: string; currentPlayerId: string; isHost?: boolean; status?: GameStatus }) => {
      setRoomCode(roomCode); setPlayerId(currentPlayerId); setIsHost(Boolean(isHost)); setGameStarted(status !== undefined && status !== 'LOBBY');
    };
    const onGameCreated = ({ roomCode, currentPlayerId }: { roomCode: string; currentPlayerId: string }) => {
      setRoomCode(roomCode); setPlayerId(currentPlayerId); setIsHost(true); setGameStarted(false);
    };
    const onPlayerListUpdate = (nextPlayers: Player[]) => setPlayers(nextPlayers);
    const onGamesListUpdate = (nextGames: GameSummary[]) => setGames(nextGames);
    const onError = (message: string) => alert(message);
    const onConnectError = (error: Error) => {
      setIsConnected(false);
      if (error.message.includes('Authentication')) {
        setAccount(null); setRoomCode(null); setGameState(null); setGameStarted(false);
      }
    };
    socket.on('connect', onConnect); socket.on('disconnect', onDisconnect); socket.on('connect_error', onConnectError);
    socket.on('game_start', onGameStart); socket.on('game_state_update', onGameStateUpdate);
    socket.on('game_created', onGameCreated); socket.on('game_joined', onGameJoined);
    socket.on('player_list_update', onPlayerListUpdate); socket.on('games_list_update', onGamesListUpdate); socket.on('error', onError);
    socket.connect();
    apiRequest<{ games: GameSummary[] }>('/api/games').then(result => setGames(result.games)).catch(() => undefined);
    return () => {
      socket.off('connect', onConnect); socket.off('disconnect', onDisconnect); socket.off('connect_error', onConnectError);
      socket.off('game_start', onGameStart); socket.off('game_state_update', onGameStateUpdate);
      socket.off('game_created', onGameCreated); socket.off('game_joined', onGameJoined);
      socket.off('player_list_update', onPlayerListUpdate); socket.off('games_list_update', onGamesListUpdate); socket.off('error', onError);
      socket.disconnect();
    };
  }, [account]);

  const backToGames = () => {
    if (roomCode && socket.connected) socket.emit('close_game', { roomCode });
    setRoomCode(null); setPlayerId(undefined); setPlayers([]); setGameState(null); setGameStarted(false); setIsHost(false);
  };
  const logout = async () => {
    socket.disconnect(); await apiRequest('/api/auth/logout', { method: 'POST' }).catch(() => undefined);
    backToGames(); setGames([]); setAccount(null);
  };

  if (loading) return <main className="loading-screen">Forest Shuffle…</main>;
  if (!account) return <><div className="status-bar"><LanguageSwitcher /></div><AuthScreen onAuthenticated={setAccount} /></>;

  return <>
    <div className="status-bar"><LanguageSwitcher /><span>{t('status')}: {isConnected ? t('connected') : t('disconnected')}</span></div>
    {gameStarted && gameState && roomCode ? <Game gameState={gameState} playerId={playerId} roomCode={roomCode} onOpenRules={() => setShowRules(true)} onBackToGames={backToGames} />
      : roomCode ? <Lobby roomCode={roomCode} players={players} isHost={isHost} playerId={playerId} onOpenGallery={() => setShowGallery(true)} onOpenRules={() => setShowRules(true)} onBackToGames={backToGames} />
      : showGallery ? <CardGallery onBack={() => setShowGallery(false)} />
      : <AccountHome account={account} games={games} onAccountChange={setAccount} onCreate={() => socket.emit('create_game')} onJoin={code => socket.emit('join_game', { roomCode: code })} onOpen={code => socket.emit('open_game', { roomCode: code })} onLogout={logout} onOpenGallery={() => setShowGallery(true)} onOpenRules={() => setShowRules(true)} />}
    {showRules && <RulesPage returnLabel={gameStarted ? t('backToGame') : t('backToLobby')} onClose={() => setShowRules(false)} />}
  </>;
}

export default App;
