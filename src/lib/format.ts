export function formatMoney(n: number): string {
  if (!n) return '';
  return n.toLocaleString('ko-KR');
}

export function parseMoneyInput(raw: string): number {
  const cleaned = raw.replace(/[^\d-]/g, '');
  if (!cleaned || cleaned === '-') return 0;
  const v = parseInt(cleaned, 10);
  return Number.isNaN(v) ? 0 : Math.max(0, v);
}

export function formatPercent(actual: number, budget: number): string {
  if (budget === 0) return '-';
  return `${((actual / budget) * 100).toFixed(1)}%`;
}

export function formatDiffPercent(actual: number, budget: number): string {
  if (budget === 0) return '-';
  return `${(((actual - budget) / budget) * 100).toFixed(1)}%`;
}
