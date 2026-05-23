import type { AppData } from '../types';

const API_BASE = '/api';

async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
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

export async function fetchAppData(): Promise<AppData> {
  const res = await apiFetch('/data');
  if (res.status === 401) throw new Error('UNAUTHORIZED');
  if (!res.ok) throw new Error(await readError(res));
  return res.json() as Promise<AppData>;
}

export async function saveAppDataRemote(data: AppData): Promise<void> {
  const res = await apiFetch('/data', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  if (res.status === 401) throw new Error('UNAUTHORIZED');
  if (!res.ok) throw new Error(await readError(res));
}

export async function checkApiHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/health`);
    return res.ok;
  } catch {
    return false;
  }
}
