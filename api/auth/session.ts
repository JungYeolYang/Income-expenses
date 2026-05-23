import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleAuthSession } from '../../server/authHandlers.js';
import { getCookieHeader, handleAuthRouteError } from '../../server/vercelHttp.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  try {
    res.status(200).json(await handleAuthSession(getCookieHeader(req)));
  } catch (e) {
    handleAuthRouteError(res, e);
  }
}
