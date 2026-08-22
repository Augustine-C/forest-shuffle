import { useState, type FormEvent } from 'react';
import type { AccountProfile, GameSummary } from '../../../shared/types';
import { apiRequest } from '../services/api';
import { useI18n } from '../i18n';

interface Props {
    account: AccountProfile;
    games: GameSummary[];
    onAccountChange: (account: AccountProfile) => void;
    onCreate: () => void;
    onJoin: (roomCode: string) => void;
    onOpen: (roomCode: string) => void;
    onLogout: () => void;
    onOpenGallery: () => void;
    onOpenRules: () => void;
}

export default function AccountHome(props: Props) {
    const { language } = useI18n();
    const [roomCode, setRoomCode] = useState('');
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [displayName, setDisplayName] = useState(props.account.displayName);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [message, setMessage] = useState('');
    const active = props.games.filter(game => game.status !== 'ENDED');
    const completed = props.games.filter(game => game.status === 'ENDED');
    const zh = language === 'zh-CN';

    const saveProfile = async (event: FormEvent) => {
        event.preventDefault(); setMessage('');
        try {
            const result = await apiRequest<{ account: AccountProfile }>('/api/account/profile', { method: 'PATCH', body: JSON.stringify({ displayName }) });
            props.onAccountChange(result.account); setMessage(zh ? '显示名已更新，将用于之后加入的游戏。' : 'Display name updated for future games.');
        } catch (error) { setMessage((error as Error).message); }
    };
    const savePassword = async (event: FormEvent) => {
        event.preventDefault(); setMessage('');
        try {
            await apiRequest('/api/account/password', { method: 'PATCH', body: JSON.stringify({ currentPassword, newPassword }) });
            setCurrentPassword(''); setNewPassword(''); setMessage(zh ? '密码已更新。' : 'Password updated.');
        } catch (error) { setMessage((error as Error).message); }
    };
    const gameCard = (game: GameSummary) => <button className="saved-game" key={game.roomCode} onClick={() => props.onOpen(game.roomCode)}>
        <span><strong>{game.roomCode}</strong><small>{game.status === 'LOBBY' ? (zh ? '大厅' : 'Lobby') : game.status === 'PLAYING' ? (zh ? '进行中' : 'In progress') : (zh ? '已结束' : 'Completed')}</small></span>
        <span>{game.players.map(player => player.name).join(' · ')}</span><b>→</b>
    </button>;

    return <main className="account-home">
        <header className="account-home-header">
            <div><p>{zh ? '欢迎回来' : 'Welcome back'}</p><h1>{props.account.displayName}</h1><span>@{props.account.username}</span></div>
            <div><button onClick={() => setSettingsOpen(value => !value)}>{zh ? '账号设置' : 'Account settings'}</button><button onClick={props.onLogout}>{zh ? '退出' : 'Sign out'}</button></div>
        </header>
        {settingsOpen && <section className="account-card settings-card">
            <form onSubmit={saveProfile}><h2>{zh ? '显示名' : 'Display name'}</h2><input value={displayName} onChange={event => setDisplayName(event.target.value)} maxLength={32} required /><button>Save</button></form>
            <form onSubmit={savePassword}><h2>{zh ? '修改密码' : 'Change password'}</h2><input type="password" placeholder={zh ? '当前密码' : 'Current password'} value={currentPassword} onChange={event => setCurrentPassword(event.target.value)} required /><input type="password" placeholder={zh ? '新密码（至少 8 位）' : 'New password (8+ characters)'} value={newPassword} onChange={event => setNewPassword(event.target.value)} required minLength={8} /><button>Save</button></form>
            {message && <p>{message}</p>}
        </section>}
        <section className="account-actions account-card"><h2>{zh ? '开始游戏' : 'Start playing'}</h2><button className="account-primary" onClick={props.onCreate}>{zh ? '创建新游戏' : 'Create new game'}</button><div className="join-account-game"><input maxLength={4} placeholder="ABCD" value={roomCode} onChange={event => setRoomCode(event.target.value.toUpperCase())} /><button onClick={() => roomCode && props.onJoin(roomCode)}>{zh ? '加入' : 'Join'}</button></div></section>
        <section className="games-section"><h2>{zh ? '未完成的游戏' : 'Your active games'}</h2>{active.length ? <div className="saved-games">{active.map(gameCard)}</div> : <p>{zh ? '还没有未完成的游戏。' : 'No unfinished games yet.'}</p>}</section>
        {completed.length > 0 && <section className="games-section"><h2>{zh ? '历史记录' : 'Completed games'}</h2><div className="saved-games">{completed.map(gameCard)}</div></section>}
        <footer className="account-resources"><button onClick={props.onOpenGallery}>{zh ? '卡牌图鉴' : 'Card gallery'}</button><button onClick={props.onOpenRules}>{zh ? '游戏规则' : 'Rules'}</button></footer>
    </main>;
}
