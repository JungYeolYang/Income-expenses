import type { AppData } from '../src/types.js';
import { getAppData, setAppData } from './appDataStorage.js';

export async function handleHealth(): Promise<{ ok: true }> {
  return { ok: true };
}

export async function handleGetData(): Promise<AppData> {
  return getAppData();
}

export async function handlePutData(body: unknown): Promise<void> {
  const data = body as AppData;
  if (!data?.accounts?.income || !data.weeklyAmounts) {
    throw new Error('INVALID_DATA');
  }
  await setAppData({
    version: data.version ?? 1,
    accounts: data.accounts,
    weeklyAmounts: data.weeklyAmounts ?? {},
    expenseMemos: data.expenseMemos ?? {},
    annualBudgets: data.annualBudgets ?? {},
  });
}
