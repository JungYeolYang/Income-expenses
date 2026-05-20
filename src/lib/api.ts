import type { AppData } from '../types';

const API_BASE = '/api';

export async function fetchAppData(): Promise<AppData> {
  const res = await fetch(`${API_BASE}/data`);
  if (!res.ok) throw new Error('데이터를 불러오지 못했습니다.');
  return res.json() as Promise<AppData>;
}

export async function saveAppDataRemote(data: AppData): Promise<void> {
  const res = await fetch(`${API_BASE}/data`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('저장에 실패했습니다.');
}

export async function checkApiHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/health`);
    return res.ok;
  } catch {
    return false;
  }
}
