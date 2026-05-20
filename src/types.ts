export type AccountType = 'income' | 'expense';

export interface AccountItem {
  id: string;
  name: string;
}

export interface AccountCategory {
  id: string;
  name: string;
  items: AccountItem[];
}

export interface AccountsByType {
  income: AccountCategory[];
  expense: AccountCategory[];
}

export interface WeekInMonth {
  weekIndex: number;
  label: string;
  /** 해당 주 일요일 (일, 0=일요일) */
  sundayDay: number;
  /** 표시용 예: "3/5" */
  dateLabel: string;
}

export interface AppData {
  version: number;
  accounts: AccountsByType;
  /** key: `${year}-${month}-${sundayDay}` (해당 월 일요일 날짜) → accountItemId → amount */
  weeklyAmounts: Record<string, Record<string, number>>;
  /** key: `${year}-${month}` → 지출 계정 itemId → 적요 (월간) */
  expenseMemos: Record<string, Record<string, string>>;
  /** key: year string → accountItemId → budget */
  annualBudgets: Record<string, Record<string, number>>;
}

export type PageId = 'monthly' | 'budget' | 'stats' | 'accounts' | 'backup';

export type PeriodKind = 'quarter' | 'half' | 'year';

export interface BudgetComparison {
  budget: number;
  ytdActual: number;
  periodActual: number;
  diffAmount: number;
  diffPercent: string;
  executionRate: string;
}
