import type { VercelRequest, VercelResponse } from '@vercel/node';
import { useBlobStorage } from '../server/blobStorage.js';
import { isVercelRuntime } from '../server/vercelEnv.js';

/** 배포 환경 점검용 (비밀값은 노출하지 않음) */
export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.status(200).json({
    ok: true,
    vercel: isVercelRuntime(),
    blobConfigured: useBlobStorage(),
    hasReadWriteToken: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
    hasStoreId: Boolean(process.env.BLOB_STORE_ID),
  });
}
