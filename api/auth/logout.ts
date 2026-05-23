import type { VercelRequest, VercelResponse } from '@vercel/node';
import { clearSessionOnResponse } from '../../server/vercelHttp.js';

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  clearSessionOnResponse(res);
  res.status(200).json({ ok: true });
}
