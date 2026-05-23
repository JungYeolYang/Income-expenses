import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleGetData, handlePutData } from '../server/handlers.js';
import { getCookieHeader, handleDataRouteError } from '../server/vercelHttp.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const cookie = getCookieHeader(req);
  try {
    if (req.method === 'GET') {
      res.status(200).json(await handleGetData(cookie));
      return;
    }
    if (req.method === 'PUT') {
      await handlePutData(cookie, req.body);
      res.status(200).json({ ok: true });
      return;
    }
    res.setHeader('Allow', 'GET, PUT');
    res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    handleDataRouteError(res, e, req.method ?? 'GET');
  }
}
