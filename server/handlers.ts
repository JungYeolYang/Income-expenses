import type { AppData } from '../src/types.js';
import { assertAuthenticated } from './authHandlers.js';
import { getAppData, setAppData } from './appDataStorage.js';

export async function handleHealth(): Promise<{ ok: true }> {
  return { ok: true };
}

export async function handleGetData(cookieHeader: string | undefined): Promise<AppData> {
  assertAuthenticated(cookieHeader);
  return getAppData();
}

export async function handlePutData(cookieHeader: string | undefined, body: unknown): Promise<void> {
  assertAuthenticated(cookieHeader);
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
