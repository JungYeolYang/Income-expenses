import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleGetData, handlePutData } from '../server/handlers.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'GET') {
      res.status(200).json(await handleGetData());
      return;
    }
    if (req.method === 'PUT') {
      await handlePutData(req.body);
      res.status(200).json({ ok: true });
      return;
    }
    res.setHeader('Allow', 'GET, PUT');
    res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    if (e instanceof Error && e.message === 'BLOB_NOT_CONFIGURED') {
      res.status(503).json({
        error:
          'Vercel Blob이 연결되지 않았습니다. 프로젝트 Storage에서 Blob을 만들고 Connect한 뒤 재배포하세요.',
      });
      return;
    }
    if (e instanceof Error && e.message === 'INVALID_DATA') {
      res.status(400).json({ error: '잘못된 데이터 형식입니다.' });
      return;
    }
    console.error(e);
    const message =
      req.method === 'GET'
        ? '데이터를 불러오지 못했습니다.'
        : '저장에 실패했습니다.';
    res.status(500).json({ error: message });
  }
}
