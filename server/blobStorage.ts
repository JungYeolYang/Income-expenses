import { get, put } from '@vercel/blob';
import type { AppData } from '../src/types.js';

const BLOB_PATHNAME = 'church-finance-data.json';

/** Vercel: 토큰 또는 Blob 스토어 ID (배포 시 OIDC 자동 주입) */
export function useBlobStorage(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID);
}

export async function loadAppDataFromBlob(): Promise<AppData | null> {
  try {
    const result = await get(BLOB_PATHNAME, { access: 'private' });
    if (!result || result.statusCode !== 200 || !result.stream) return null;

    const text = await new Response(result.stream).text();
    return JSON.parse(text) as AppData;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (/not found|404|does not exist/i.test(message)) return null;
    throw new Error(`Blob 읽기 실패: ${message}`);
  }
}

export async function saveAppDataToBlob(data: AppData): Promise<void> {
  try {
    await put(BLOB_PATHNAME, JSON.stringify(data), {
      access: 'private',
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: 'application/json',
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`Blob 저장 실패: ${message}`);
  }
}
