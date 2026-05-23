import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleAuthLogin } from '../../server/authHandlers.js';
import { getCookieHeader, handleAuthRouteError, setSessionOnResponse } from '../../server/vercelHttp.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  try {
    await handleAuthLogin(req.body?.password);
    setSessionOnResponse(res);
    res.status(200).json({ ok: true });
  } catch (e) {
    handleAuthRouteError(res, e);
  }
}
