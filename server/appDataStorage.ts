import { createDefaultAccounts } from '../src/data/defaultAccounts.js';
import type { AppData } from '../src/types.js';
import { loadAppDataFromBlob, saveAppDataToBlob, useBlobStorage } from './blobStorage.js';
import { loadAppData, persistAppData } from './db.js';

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
  if (process.env.VERCEL && !useBlobStorage()) {
    throw new Error('BLOB_NOT_CONFIGURED');
  }
}

export async function getAppData(): Promise<AppData> {
  assertVercelStorage();
  if (useBlobStorage()) {
    const fromBlob = await loadAppDataFromBlob();
    if (fromBlob) {
      return {
        ...fromBlob,
        expenseMemos: fromBlob.expenseMemos ?? {},
        annualBudgets: fromBlob.annualBudgets ?? {},
      };
    }
    const seeded = createDefaultAppData();
    await saveAppDataToBlob(seeded);
    return seeded;
  }
  return loadAppData();
}

export async function setAppData(data: AppData): Promise<void> {
  assertVercelStorage();
  if (useBlobStorage()) {
    await saveAppDataToBlob(data);
    return;
  }
  persistAppData(data);
}
