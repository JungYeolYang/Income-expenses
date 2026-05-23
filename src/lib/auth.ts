const API_BASE = '/api';

async function authFetch(path: string, init?: RequestInit): Promise<Response> {
  return fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });
}

async function readError(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { error?: string };
    return body.error ?? '요청에 실패했습니다.';
  } catch {
    return '요청에 실패했습니다.';
  }
}

export async function fetchAuthSession(): Promise<boolean> {
  const res = await authFetch('/auth/session');
  if (!res.ok) return false;
  const body = (await res.json()) as { authenticated?: boolean };
  return Boolean(body.authenticated);
}

export async function login(password: string): Promise<void> {
  const res = await authFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ password }),
  });
  if (!res.ok) throw new Error(await readError(res));
}

export async function logout(): Promise<void> {
  await authFetch('/auth/logout', { method: 'POST' });
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  const res = await authFetch('/auth/password', {
    method: 'PUT',
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  if (!res.ok) throw new Error(await readError(res));
}
