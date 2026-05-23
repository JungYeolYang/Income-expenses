import { createDefaultAccounts } from '../src/data/defaultAccounts.js';
import type { AppData } from '../src/types.js';
import { loadAppDataFromBlob, saveAppDataToBlob, useBlobStorage } from './blobStorage.js';
import { isVercelRuntime } from './vercelEnv.js';

function createDefaultAppData(): AppData {
  return {
    version: 1,
    accounts: createDefaultAccounts(),
    weeklyAmounts: {},
    expenseMemos: {},
    annualBudgets: {},
  };
}

function assertVercelStorage(): void {
  if (isVercelRuntime() && !useBlobStorage()) {
    throw new Error('BLOB_NOT_CONFIGURED');
  }
}

function normalizeAppData(data: AppData): AppData {
  return {
    ...data,
    expenseMemos: data.expenseMemos ?? {},
    annualBudgets: data.annualBudgets ?? {},
  };
}

export async function getAppData(): Promise<AppData> {
  assertVercelStorage();

  if (useBlobStorage()) {
    const fromBlob = await loadAppDataFromBlob();
    if (fromBlob) return normalizeAppData(fromBlob);
    // Blob이 없을 때만 기본값 반환 (여기서 저장하지 않음 → 클라이언트 저장 시 생성)
    return createDefaultAppData();
  }

  const { loadAppData } = await import('./db.js');
  return loadAppData();
}

export async function setAppData(data: AppData): Promise<void> {
  assertVercelStorage();

  if (useBlobStorage()) {
    await saveAppDataToBlob(data);
    return;
  }

  const { persistAppData } = await import('./db.js');
  persistAppData(data);
}
