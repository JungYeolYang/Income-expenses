import type { PageId } from '../types';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';

const NAV: { id: PageId; label: string }[] = [
  { id: 'monthly', label: '월별 실적' },
  { id: 'budget', label: '연간 예산' },
  { id: 'stats', label: '기간 통계' },
  { id: 'accounts', label: '계정 관리' },
  { id: 'backup', label: '백업' },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const { page, setPage, loading, saving, error, retryLoad } = useApp();
  const { logout } = useAuth();

  return (
    <div className="app">
      <header className="header">
        <div className="brand">
          <span className="brand-icon" aria-hidden="true">{'\u26EA'}</span>
          <h1>교회 재정 관리</h1>
        </div>
        <nav className="nav">
          {NAV.map((item) => (
            <button
              key={item.id}
              type="button"
              className={page === item.id ? 'nav-btn active' : 'nav-btn'}
              onClick={() => setPage(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <div className="header-status">
          {loading && <span className="status-pill">불러오는 중…</span>}
          {!loading && saving && <span className="status-pill saving">저장 중…</span>}
          {!loading && !saving && !error && <span className="status-pill ok">저장됨</span>}
          {error && (
            <span className="status-pill error">
              {error}
              <button type="button" className="link-btn" onClick={() => void retryLoad()}>
                다시 시도
              </button>
            </span>
          )}
          <button type="button" className="nav-btn logout-btn" onClick={() => void logout()}>
            로그아웃
          </button>
        </div>
      </header>
      <main className="main">{loading ? <p className="loading-msg">데이터를 불러오는 중입니다…</p> : error ? null : children}</main>
    </div>
  );
}
