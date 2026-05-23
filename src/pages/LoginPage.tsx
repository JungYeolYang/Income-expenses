import { useState, type FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';

export function LoginPage() {
  const { login } = useAuth();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(password);
    } catch (err) {
      setError(err instanceof Error ? err.message : '로그인에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-screen">
      <form className="login-card" onSubmit={(e) => void onSubmit(e)}>
        <div className="login-brand">
          <span className="brand-icon">⛪</span>
          <h1>교회 재정 관리</h1>
        </div>
        <p className="login-desc">관리자 비밀번호를 입력하세요.</p>
        <label className="login-label">
          비밀번호
          <input
            type="password"
            className="login-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            autoFocus
            inputMode="numeric"
          />
        </label>
        {error && <p className="login-error">{error}</p>}
        <button type="submit" className="btn primary login-submit" disabled={submitting || !password}>
          {submitting ? '확인 중…' : '로그인'}
        </button>
      </form>
    </div>
  );
}
