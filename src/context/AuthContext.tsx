import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { changePassword, fetchAuthSession, login, logout } from '../lib/auth';

interface AuthContextValue {
  authenticated: boolean;
  checking: boolean;
  login: (password: string) => Promise<void>;
  logout: () => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authenticated, setAuthenticated] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const ok = await fetchAuthSession();
        if (!cancelled) setAuthenticated(ok);
      } catch {
        if (!cancelled) setAuthenticated(false);
      } finally {
        if (!cancelled) setChecking(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const doLogin = useCallback(async (password: string) => {
    await login(password);
    setAuthenticated(true);
  }, []);

  const doLogout = useCallback(async () => {
    await logout();
    setAuthenticated(false);
  }, []);

  const doChangePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    await changePassword(currentPassword, newPassword);
  }, []);

  const value = useMemo(
    () => ({
      authenticated,
      checking,
      login: doLogin,
      logout: doLogout,
      changePassword: doChangePassword,
    }),
    [authenticated, checking, doLogin, doLogout, doChangePassword],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
