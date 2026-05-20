import { formatMoney } from './format';
import type { MonthlySummaryTotals } from './calculations';

function won(n: number): string {
  return `${formatMoney(n)}원`;
}

/** 월간 실적 상단 「월 수입 합계」 부가 설명 */
export function formatIncomeSummaryDetail(month: number, t: MonthlySummaryTotals): string {
  if (month === 1) {
    return `${month}월수입(${won(t.monthIncome)}) + 잉여금(${won(t.priorYearSurplus)})`;
  }
  return `${month}월수입(${won(t.monthIncome)}) + 이월금(${won(t.carryForward)})`;
}
