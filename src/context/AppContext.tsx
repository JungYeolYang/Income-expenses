import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { AppData, PageId } from '../types';
import { fetchAppData, saveAppDataRemote } from '../lib/api';
import { createDefaultData } from '../lib/storage';

interface AppContextValue {
  data: AppData;
  setData: React.Dispatch<React.SetStateAction<AppData>>;
  page: PageId;
  setPage: (p: PageId) => void;
  updateWeekly: (weekKey: string, itemId: string, amount: number) => void;
  updateExpenseMemo: (year: number, month: number, itemId: string, memo: string) => void;
  updateBudget: (year: number, itemId: string, amount: number) => void;
  replaceData: (next: AppData) => void;
  loading: boolean;
  saving: boolean;
  error: string | null;
  retryLoad: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(() => createDefaultData());
  const [page, setPage] = useState<PageId>('monthly');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const skipSave = useRef(true);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const loaded = await fetchAppData();
      skipSave.current = true;
      setData({
        ...loaded,
        expenseMemos: loaded.expenseMemos ?? {},
      });
    } catch (e) {
      if (e instanceof Error && e.message === 'UNAUTHORIZED') {
        setError('로그인이 필요합니다. 페이지를 새로고침하세요.');
      } else {
        setError('서버에 연결할 수 없습니다. API 서버가 실행 중인지 확인하세요. (npm run dev)');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (skipSave.current) {
      skipSave.current = false;
      return;
    }
    if (loading || error) return;

    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      setSaving(true);
      saveAppDataRemote(data)
        .catch((err) => {
          if (err instanceof Error && err.message === 'UNAUTHORIZED') {
            setError('로그인이 만료되었습니다. 다시 로그인하세요.');
          } else {
            setError('저장에 실패했습니다.');
          }
        })
        .finally(() => setSaving(false));
    }, 400);

    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [data, loading, error]);

  const updateWeekly = useCallback((weekKey: string, itemId: string, amount: number) => {
    setData((prev) => {
      const week = { ...(prev.weeklyAmounts[weekKey] ?? {}) };
      if (amount === 0) delete week[itemId];
      else week[itemId] = amount;
      const weeklyAmounts = { ...prev.weeklyAmounts };
      if (Object.keys(week).length === 0) delete weeklyAmounts[weekKey];
      else weeklyAmounts[weekKey] = week;
      return { ...prev, weeklyAmounts };
    });
  }, []);

  const updateExpenseMemo = useCallback((year: number, month: number, itemId: string, memo: string) => {
    const key = `${year}-${month}`;
    setData((prev) => {
      const monthMemos = { ...(prev.expenseMemos[key] ?? {}) };
      const trimmed = memo.trim();
      if (!trimmed) delete monthMemos[itemId];
      else monthMemos[itemId] = trimmed;
      const expenseMemos = { ...prev.expenseMemos };
      if (Object.keys(monthMemos).length === 0) delete expenseMemos[key];
      else expenseMemos[key] = monthMemos;
      return { ...prev, expenseMemos };
    });
  }, []);

  const updateBudget = useCallback((year: number, itemId: string, amount: number) => {
    const y = String(year);
    setData((prev) => {
      const yearBudget = { ...(prev.annualBudgets[y] ?? {}) };
      if (amount === 0) delete yearBudget[itemId];
      else yearBudget[itemId] = amount;
      const annualBudgets = { ...prev.annualBudgets };
      if (Object.keys(yearBudget).length === 0) delete annualBudgets[y];
      else annualBudgets[y] = yearBudget;
      return { ...prev, annualBudgets };
    });
  }, []);

  const replaceData = useCallback((next: AppData) => {
    skipSave.current = false;
    setData(next);
  }, []);

  const value = useMemo(
    () => ({
      data,
      setData,
      page,
      setPage,
      updateWeekly,
      updateExpenseMemo,
      updateBudget,
      replaceData,
      loading,
      saving,
      error,
      retryLoad: load,
    }),
    [data, page, updateWeekly, updateExpenseMemo, updateBudget, replaceData, loading, saving, error, load],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
