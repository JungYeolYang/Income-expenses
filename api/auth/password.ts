import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleAuthChangePassword } from '../../server/authHandlers.js';
import { getCookieHeader, handleAuthRouteError } from '../../server/vercelHttp.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'PUT') {
    res.setHeader('Allow', 'PUT');
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  try {
    await handleAuthChangePassword(getCookieHeader(req), req.body);
    res.status(200).json({ ok: true });
  } catch (e) {
    handleAuthRouteError(res, e);
  }
}
