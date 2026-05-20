import type { AccountCategory, AppData } from '../types';
import { getAmount, getBudget, sumItemInMonth } from './calculations';
import { getWeeksInMonth, weekKey } from './weeks';

export type StatsKind = 'monthly' | 'firstHalf' | 'yearly';

export interface StatsColumn {
  key: string;
  label: string;
  subLabel?: string;
}

export function statsKindLabel(kind: StatsKind): string {
  if (kind === 'monthly') return '월별';
  if (kind === 'firstHalf') return '상반기';
  return '연간';
}

export function statsTitle(year: number, kind: StatsKind, month?: number): string {
  if (kind === 'monthly' && month) return `${year}년 ${month}월`;
  if (kind === 'firstHalf') return `${year}년 상반기 (1~6월)`;
  return `${year}년 연간 (1~12월)`;
}

export function getStatsColumns(year: number, kind: StatsKind, month?: number): StatsColumn[] {
  if (kind === 'monthly' && month) {
    return getWeeksInMonth(year, month).map((w) => ({
      key: weekKey(year, month, w.sundayDay),
      label: w.label,
      subLabel: w.dateLabel,
    }));
  }
  const months = kind === 'firstHalf' ? [1, 2, 3, 4, 5, 6] : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  return months.map((m) => ({
    key: `month-${year}-${m}`,
    label: `${m}월`,
  }));
}

export function getStatsCellAmount(data: AppData, col: StatsColumn, itemId: string): number {
  if (col.key.startsWith('month-')) {
    const m = Number(col.key.split('-')[2]);
    const y = Number(col.key.split('-')[1]);
    return sumItemInMonth(data, y, m, itemId);
  }
  return getAmount(data, col.key, itemId);
}

export function getStatsMonths(kind: StatsKind): number[] {
  if (kind === 'firstHalf') return [1, 2, 3, 4, 5, 6];
  if (kind === 'yearly') return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  return [];
}

export function sumStatsPeriod(
  data: AppData,
  year: number,
  kind: StatsKind,
  month: number | undefined,
  itemId: string,
): number {
  if (kind === 'monthly' && month) {
    return sumItemInMonth(data, year, month, itemId);
  }
  return getStatsMonths(kind).reduce((s, m) => s + sumItemInMonth(data, year, m, itemId), 0);
}

export function sumStatsYtd(
  data: AppData,
  year: number,
  kind: StatsKind,
  month: number | undefined,
  itemId: string,
): number {
  if (kind === 'monthly' && month) {
    let sum = 0;
    for (let m = 1; m <= month; m++) sum += sumItemInMonth(data, year, m, itemId);
    return sum;
  }
  if (kind === 'firstHalf') {
    return getStatsMonths('firstHalf').reduce((s, m) => s + sumItemInMonth(data, year, m, itemId), 0);
  }
  return getStatsMonths('yearly').reduce((s, m) => s + sumItemInMonth(data, year, m, itemId), 0);
}

/** 기간통계 표 하단 부분합 행 라벨 (월별=주, 상반기·연간=월) */
export function statsColumnTotalLabel(kind: StatsKind): string {
  return kind === 'monthly' ? '주별 합계' : '월별 합계';
}

export function sumStatsColumnForCategories(
  data: AppData,
  col: StatsColumn,
  categories: AccountCategory[],
): number {
  let sum = 0;
  for (const cat of categories) {
    for (const item of cat.items) {
      sum += getStatsCellAmount(data, col, item.id);
    }
  }
  return sum;
}

export function getStatsTableTotals(
  data: AppData,
  categories: AccountCategory[],
  year: number,
  kind: StatsKind,
  month: number | undefined,
  cols: StatsColumn[],
) {
  const columnTotals = cols.map((col) => sumStatsColumnForCategories(data, col, categories));
  let periodTotal = 0;
  let budgetTotal = 0;
  let ytdTotal = 0;
  for (const cat of categories) {
    for (const item of cat.items) {
      const cmp = getStatsBudgetComparison(data, year, kind, month, item.id);
      periodTotal += cmp.periodActual;
      budgetTotal += cmp.budget;
      ytdTotal += cmp.ytdActual;
    }
  }
  const executionRate =
    budgetTotal === 0 ? '-' : `${((ytdTotal / budgetTotal) * 100).toFixed(1)}%`;
  return { columnTotals, periodTotal, budgetTotal, ytdTotal, executionRate };
}

export function getStatsBudgetComparison(
  data: AppData,
  year: number,
  kind: StatsKind,
  month: number | undefined,
  itemId: string,
) {
  const budget = getBudget(data, year, itemId);
  const periodActual = sumStatsPeriod(data, year, kind, month, itemId);
  const ytdActual = sumStatsYtd(data, year, kind, month, itemId);
  const diffAmount = ytdActual - budget;
  return {
    budget,
    periodActual,
    ytdActual,
    diffAmount,
    diffPercent: budget === 0 ? '-' : `${(((ytdActual - budget) / budget) * 100).toFixed(1)}%`,
    executionRate: budget === 0 ? '-' : `${((ytdActual / budget) * 100).toFixed(1)}%`,
  };
}
