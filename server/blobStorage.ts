import { list, put } from '@vercel/blob';
import type { AppData } from '../src/types.js';

const BLOB_PATHNAME = 'church-finance-data.json';

export async function loadAppDataFromBlob(): Promise<AppData | null> {
  try {
    const { blobs } = await list({ prefix: BLOB_PATHNAME, limit: 1 });
    if (blobs.length === 0) return null;
    const response = await fetch(blobs[0].url);
    if (!response.ok) return null;
    return (await response.json()) as AppData;
  } catch {
    return null;
  }
}

export async function saveAppDataToBlob(data: AppData): Promise<void> {
  await put(BLOB_PATHNAME, JSON.stringify(data), {
    access: 'private',
    addRandomSuffix: false,
    allowOverwrite: true,
  });
}

/** Vercel: BLOB_READ_WRITE_TOKEN(구 방식) 또는 BLOB_STORE_ID + OIDC(신 방식) */
export function useBlobStorage(): boolean {
  if (process.env.BLOB_READ_WRITE_TOKEN) return true;
  if (process.env.BLOB_STORE_ID && process.env.VERCEL_OIDC_TOKEN) return true;
  return false;
}
