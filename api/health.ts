import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleHealth } from '../server/handlers.js';

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  try {
    const payload = await handleHealth();
    res.status(200).json(payload);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
}
