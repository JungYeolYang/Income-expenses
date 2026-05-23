import type { VercelRequest, VercelResponse } from '@vercel/node';
import { AuthError } from './authHandlers.js';
import { buildClearSessionCookie, buildSessionCookie } from './session.js';

export function getCookieHeader(req: VercelRequest): string | undefined {
  const h = req.headers.cookie;
  return Array.isArray(h) ? h.join('; ') : h;
}

export function appendSetCookie(res: VercelResponse, cookie: string): void {
  const prev = res.getHeader('Set-Cookie');
  if (!prev) {
    res.setHeader('Set-Cookie', cookie);
    return;
  }
  const list = Array.isArray(prev) ? prev : [String(prev)];
  res.setHeader('Set-Cookie', [...list, cookie]);
}

export function setSessionOnResponse(res: VercelResponse): void {
  appendSetCookie(res, buildSessionCookie());
}

export function clearSessionOnResponse(res: VercelResponse): void {
  appendSetCookie(res, buildClearSessionCookie());
}

export function handleAuthRouteError(res: VercelResponse, e: unknown): void {
  if (e instanceof AuthError) {
    const status =
      e.code === 'UNAUTHORIZED' ? 401 : e.code === 'WEAK_PASSWORD' || e.code === 'SAME_PASSWORD' ? 400 : 401;
    res.status(status).json({ error: e.message });
    return;
  }
  console.error(e);
  res.status(500).json({ error: '인증 처리 중 오류가 발생했습니다.' });
}

export function handleDataRouteError(res: VercelResponse, e: unknown, method: string): void {
  if (e instanceof AuthError && e.code === 'UNAUTHORIZED') {
    res.status(401).json({ error: e.message });
    return;
  }
  if (e instanceof Error && e.message === 'BLOB_NOT_CONFIGURED') {
    res.status(503).json({
      error:
        'Vercel Blob이 이 배포 프로젝트에 연결되지 않았습니다. Vercel 대시보드에서 배포 URL과 같은 프로젝트에 Blob을 Connect한 뒤 Redeploy 하세요.',
    });
    return;
  }
  if (e instanceof Error && e.message === 'INVALID_DATA') {
    res.status(400).json({ error: '잘못된 데이터 형식입니다.' });
    return;
  }
  if (e instanceof Error && (e.message.startsWith('Blob ') || e.message.includes('Blob'))) {
    res.status(503).json({
      error: `${e.message} Vercel 대시보드에서 Blob이 이 배포 프로젝트에 연결됐는지 확인하고 Redeploy 하세요.`,
    });
    return;
  }
  console.error(e);
  const message = method === 'GET' ? '데이터를 불러오지 못했습니다.' : '저장에 실패했습니다.';
  res.status(500).json({ error: message });
}
