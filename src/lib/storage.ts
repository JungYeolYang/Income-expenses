import { createDefaultAccounts } from '../data/defaultAccounts';
import type { AppData } from '../types';

const STORAGE_KEY = 'church-finance-v1';

export function createDefaultData(): AppData {
  return {
    version: 1,
    accounts: createDefaultAccounts(),
    weeklyAmounts: {},
    expenseMemos: {},
    annualBudgets: {},
  };
}

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createDefaultData();
    const parsed = JSON.parse(raw) as AppData;
    if (!parsed.accounts?.income || !parsed.weeklyAmounts) return createDefaultData();
    return {
      version: parsed.version ?? 1,
      accounts: parsed.accounts,
      weeklyAmounts: parsed.weeklyAmounts ?? {},
      expenseMemos: parsed.expenseMemos ?? {},
      annualBudgets: parsed.annualBudgets ?? {},
    };
  } catch {
    return createDefaultData();
  }
}

export function saveData(data: AppData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function downloadJson(filename: string, obj: unknown): void {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
