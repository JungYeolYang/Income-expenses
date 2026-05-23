import { useState, type FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';

export function PasswordChangeForm() {
  const { changePassword } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setError(null);
    if (newPassword !== confirmPassword) {
      setError('새 비밀번호 확인이 일치하지 않습니다.');
      return;
    }
    setSubmitting(true);
    try {
      await changePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setMessage('비밀번호가 변경되었습니다.');
    } catch (err) {
      setError(err instanceof Error ? err.message : '변경에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="panel password-panel">
      <h2>비밀번호 변경</h2>
      <form className="password-form" onSubmit={(e) => void onSubmit(e)}>
        <label>
          현재 비밀번호
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            autoComplete="current-password"
          />
        </label>
        <label>
          새 비밀번호
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
            inputMode="numeric"
          />
        </label>
        <label>
          새 비밀번호 확인
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            inputMode="numeric"
          />
        </label>
        {error && <p className="form-error">{error}</p>}
        {message && <p className="form-success">{message}</p>}
        <button type="submit" className="btn primary" disabled={submitting}>
          {submitting ? '변경 중…' : '비밀번호 변경'}
        </button>
      </form>
    </section>
  );
}
