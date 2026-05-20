import type { AccountCategory, AccountType, AccountsByType, AppData, BudgetComparison } from '../types';
import { parseWeekKey, weekKey } from './weeks';

export function flattenItems(accounts: AccountsByType, type: AccountType) {
  return accounts[type].flatMap((c) =>
    c.items.map((item) => ({ ...item, categoryId: c.id, categoryName: c.name, type })),
  );
}

export function getAmount(data: AppData, weekKey: string, itemId: string): number {
  return data.weeklyAmounts[weekKey]?.[itemId] ?? 0;
}

export function getExpenseMemo(data: AppData, year: number, month: number, itemId: string): string {
  const key = `${year}-${month}`;
  return data.expenseMemos?.[key]?.[itemId] ?? '';
}

export function getBudget(data: AppData, year: number, itemId: string): number {
  return data.annualBudgets[String(year)]?.[itemId] ?? 0;
}

export function sumItemInMonth(data: AppData, year: number, month: number, itemId: string): number {
  let sum = 0;
  for (const [key, amounts] of Object.entries(data.weeklyAmounts)) {
    const parsed = parseWeekKey(key);
    if (!parsed || parsed.year !== year || parsed.month !== month) continue;
    sum += amounts[itemId] ?? 0;
  }
  return sum;
}

export function sumItemYtdThroughMonth(data: AppData, year: number, throughMonth: number, itemId: string): number {
  let sum = 0;
  for (const [key, amounts] of Object.entries(data.weeklyAmounts)) {
    const parsed = parseWeekKey(key);
    if (!parsed || parsed.year !== year || parsed.month > throughMonth) continue;
    sum += amounts[itemId] ?? 0;
  }
  return sum;
}

export function sumItemYtdFullYear(data: AppData, year: number, itemId: string): number {
  return sumItemYtdThroughMonth(data, year, 12, itemId);
}

/** 해당 월·주(일요일)에 속한 계정들의 금액 합 */
export function sumWeekForCategories(
  data: AppData,
  year: number,
  month: number,
  sundayDay: number,
  categories: AccountCategory[],
): number {
  const key = weekKey(year, month, sundayDay);
  let sum = 0;
  for (const cat of categories) {
    for (const item of cat.items) {
      sum += data.weeklyAmounts[key]?.[item.id] ?? 0;
    }
  }
  return sum;
}

export function sumCategory(
  data: AppData,
  category: AccountCategory,
  getter: (itemId: string) => number,
): number {
  return category.items.reduce((s, item) => s + getter(item.id), 0);
}

const PRIOR_YEAR_SURPLUS_CATEGORY = '전년잉여';

/** 당월 수입(전년잉여 대분류 제외) */
export function sumMonthIncomeRegular(data: AppData, year: number, month: number): number {
  let sum = 0;
  for (const cat of data.accounts.income) {
    if (cat.name === PRIOR_YEAR_SURPLUS_CATEGORY) continue;
    for (const item of cat.items) {
      sum += sumItemInMonth(data, year, month, item.id);
    }
  }
  return sum;
}

/** 1월 잉여금: 전년잉여 대분류 합 */
export function sumPriorYearSurplus(data: AppData, year: number, month: number): number {
  let sum = 0;
  for (const cat of data.accounts.income) {
    if (cat.name !== PRIOR_YEAR_SURPLUS_CATEGORY) continue;
    for (const item of cat.items) {
      sum += sumItemInMonth(data, year, month, item.id);
    }
  }
  return sum;
}

export function sumMonthExpense(data: AppData, year: number, month: number): number {
  let sum = 0;
  for (const cat of data.accounts.expense) {
    for (const item of cat.items) {
      sum += sumItemInMonth(data, year, month, item.id);
    }
  }
  return sum;
}

export interface MonthlySummaryTotals {
  /** 당월 표 수입 합(전년잉여 제외) */
  monthIncome: number;
  /** 1월: 잉여금(전년잉여) */
  priorYearSurplus: number;
  /** 2월~: 전월 순잉여 이월 */
  carryForward: number;
  /** 월 수입 합계 = monthIncome + priorYearSurplus | carryForward */
  totalIncome: number;
  expense: number;
  balance: number;
}

export function getMonthlySummaryTotals(data: AppData, year: number, month: number): MonthlySummaryTotals {
  const monthIncome = sumMonthIncomeRegular(data, year, month);
  const priorYearSurplus = month === 1 ? sumPriorYearSurplus(data, year, month) : 0;
  const expense = sumMonthExpense(data, year, month);

  let carryForward = 0;
  if (month > 1) {
    const prev = getMonthlySummaryTotals(data, year, month - 1);
    carryForward = prev.balance;
  }

  const totalIncome = month === 1 ? monthIncome + priorYearSurplus : monthIncome + carryForward;
  const balance = totalIncome - expense;

  return {
    monthIncome,
    priorYearSurplus,
    carryForward,
    totalIncome,
    expense,
    balance,
  };
}

export function compareBudget(actual: number, budget: number): BudgetComparison {
  const diffAmount = actual - budget;
  return {
    budget,
    ytdActual: actual,
    periodActual: actual,
    diffAmount,
    diffPercent: budget === 0 ? '-' : `${(((actual - budget) / budget) * 100).toFixed(1)}%`,
    executionRate: budget === 0 ? '-' : `${((actual / budget) * 100).toFixed(1)}%`,
  };
}
