import { createHmac, randomBytes, timingSafeEqual } from 'crypto';

export const SESSION_COOKIE_NAME = 'finance_session';
const SESSION_MAX_AGE_SEC = 7 * 24 * 60 * 60;

function getAuthSecret(): string {
  return (
    process.env.AUTH_SECRET ||
    process.env.BLOB_READ_WRITE_TOKEN ||
    'church-finance-local-dev-secret'
  );
}

function isSecureCookie(): boolean {
  return process.env.VERCEL_ENV === 'production' || process.env.NODE_ENV === 'production';
}

export function createSessionToken(): string {
  const exp = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SEC;
  const nonce = randomBytes(16).toString('hex');
  const payload = `${exp}.${nonce}`;
  const sig = createHmac('sha256', getAuthSecret()).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

export function verifySessionToken(token: string | undefined): boolean {
  if (!token) return false;
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  const [expStr, nonce, sig] = parts;
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || exp < Math.floor(Date.now() / 1000)) return false;
  const payload = `${expStr}.${nonce}`;
  const expected = createHmac('sha256', getAuthSecret()).update(payload).digest('base64url');
  try {
    return timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
  } catch {
    return false;
  }
}

export function parseCookieHeader(header: string | undefined): Record<string, string> {
  if (!header) return {};
  const out: Record<string, string> = {};
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const value = part.slice(idx + 1).trim();
    out[key] = decodeURIComponent(value);
  }
  return out;
}

export function isAuthenticatedRequest(cookieHeader: string | undefined): boolean {
  const cookies = parseCookieHeader(cookieHeader);
  return verifySessionToken(cookies[SESSION_COOKIE_NAME]);
}

export function buildSessionCookie(): string {
  const token = createSessionToken();
  const secure = isSecureCookie() ? '; Secure' : '';
  return `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_MAX_AGE_SEC}${secure}`;
}

export function buildClearSessionCookie(): string {
  const secure = isSecureCookie() ? '; Secure' : '';
  return `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`;
}
