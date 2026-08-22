import { useState, type FormEvent } from 'react';
import type { AccountProfile } from '../../../shared/types';
import { apiRequest } from '../services/api';
import { useI18n } from '../i18n';
import GameIcon from './GameIcon';

export default function AuthScreen({ onAuthenticated }: { onAuthenticated: (account: AccountProfile) => void }) {
    const { language } = useI18n();
    const [registering, setRegistering] = useState(false);
    const [username, setUsername] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);
    const text = language === 'zh-CN' ? {
        eyebrow: '你的森林档案', title: registering ? '创建账号' : '欢迎回来', username: '用户名', displayName: '游戏显示名', password: '密码', submit: registering ? '注册并进入' : '登录', switch: registering ? '已有账号？登录' : '首次到访？创建账号', hint: '登录后可在任何设备恢复未完成的游戏。'
    } : {
        eyebrow: 'Your forest profile', title: registering ? 'Create account' : 'Welcome back', username: 'Username', displayName: 'Display name', password: 'Password', submit: registering ? 'Create account' : 'Sign in', switch: registering ? 'Already registered? Sign in' : 'New here? Create an account', hint: 'Sign in to restore unfinished games from any device.'
    };

    const submit = async (event: FormEvent) => {
        event.preventDefault();
        setBusy(true); setError('');
        try {
            const result = await apiRequest<{ account: AccountProfile }>(registering ? '/api/auth/register' : '/api/auth/login', {
                method: 'POST',
                body: JSON.stringify(registering ? { username, displayName, password } : { username, password })
            });
            onAuthenticated(result.account);
        } catch (caught) { setError((caught as Error).message); }
        finally { setBusy(false); }
    };

    return <main className="account-shell auth-shell">
        <section className="account-brand">
            <GameIcon name="tree" />
            <p>{text.eyebrow}</p><h1>Forest Shuffle</h1><span>{text.hint}</span>
        </section>
        <form className="account-card auth-card" onSubmit={submit}>
            <h2>{text.title}</h2>
            <label><span>{text.username}</span><input autoComplete="username" value={username} onChange={event => setUsername(event.target.value)} required minLength={3} maxLength={32} /></label>
            {registering && <label><span>{text.displayName}</span><input autoComplete="nickname" value={displayName} onChange={event => setDisplayName(event.target.value)} required maxLength={32} /></label>}
            <label><span>{text.password}</span><input type="password" autoComplete={registering ? 'new-password' : 'current-password'} value={password} onChange={event => setPassword(event.target.value)} required minLength={8} maxLength={128} /></label>
            {error && <p className="account-error" role="alert">{error}</p>}
            <button className="account-primary" disabled={busy}>{busy ? '…' : text.submit}</button>
            <button type="button" className="account-link" onClick={() => { setRegistering(value => !value); setError(''); }}>{text.switch}</button>
        </form>
    </main>;
}
