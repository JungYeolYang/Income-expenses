import { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { exportMonthlyExcel } from '../lib/excelExport';
import { MoneyCell } from '../components/MoneyCell';
import { MemoCell } from '../components/MemoCell';
import {
  getAmount,
  getBudget,
  getExpenseMemo,
  getMonthlySummaryTotals,
  sumItemInMonth,
  sumWeekForCategories,
} from '../lib/calculations';
import { formatMoney } from '../lib/format';
import { formatIncomeSummaryDetail } from '../lib/monthlySummary';
import { getWeeksInMonth, weekKey } from '../lib/weeks';
import { FINANCE_DATA_YEAR } from '../lib/config';
import type { AccountCategory, AccountType } from '../types';

function AccountTable({
  type,
  categories,
  year,
  month,
  weeks,
}: {
  type: AccountType;
  categories: AccountCategory[];
  year: number;
  month: number;
  weeks: ReturnType<typeof getWeeksInMonth>;
}) {
  const { data, updateWeekly, updateExpenseMemo } = useApp();
  const label = type === 'income' ? '수입' : '지출';
  const showMemo = type === 'expense';

  const weekTotals = useMemo(
    () =>
      weeks.map((w) => sumWeekForCategories(data, year, month, w.sundayDay, categories)),
    [data, year, month, weeks, categories],
  );
  const sectionMonthTotal = useMemo(
    () => weekTotals.reduce((s, n) => s + n, 0),
    [weekTotals],
  );

  return (
    <section className={`table-section ${type}`}>
      <h2>{label}</h2>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th className="sticky-col cat-col">대분류</th>
              <th className="sticky-col item-col">계정</th>
              {weeks.map((w) => (
                <th key={w.weekIndex} className="week-col">
                  {w.label}
                  <span className="sub">({w.dateLabel})</span>
                </th>
              ))}
              {showMemo && <th className="memo-col">적요</th>}
              <th className="sum-col">월합계</th>
              <th className="budget-col">연간예산</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((cat) =>
              cat.items.map((item, idx) => {
                const monthSum = sumItemInMonth(data, year, month, item.id);
                const budget = getBudget(data, year, item.id);
                return (
                  <tr key={item.id}>
                    {idx === 0 && (
                      <td className="sticky-col cat-col" rowSpan={cat.items.length}>
                        {cat.name}
                      </td>
                    )}
                    <td className="sticky-col item-col">{item.name}</td>
                    {weeks.map((w) => {
                      const key = weekKey(year, month, w.sundayDay);
                      const val = getAmount(data, key, item.id);
                      return (
                        <MoneyCell
                          key={w.weekIndex}
                          value={val}
                          onChange={(n) => updateWeekly(key, item.id, n)}
                        />
                      );
                    })}
                    {showMemo && (
                      <MemoCell
                        value={getExpenseMemo(data, year, month, item.id)}
                        onChange={(text) => updateExpenseMemo(year, month, item.id, text)}
                      />
                    )}
                    <td className="num sum-col">{monthSum ? formatMoney(monthSum) : ''}</td>
                    <td className="num budget-col read-only">
                      {budget ? formatMoney(budget) : ''}
                    </td>
                  </tr>
                );
              }),
            )}
            <tr className="subtotal-row week-total-row">
              <td className="sticky-col cat-col" colSpan={2}>
                주별 합계
              </td>
              {weekTotals.map((total, i) => (
                <td key={weeks[i].weekIndex} className="num week-col">
                  {total ? formatMoney(total) : ''}
                </td>
              ))}
              {showMemo && <td className="memo-col" />}
              <td className="num sum-col">{sectionMonthTotal ? formatMoney(sectionMonthTotal) : ''}</td>
              <td className="budget-col" />
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function MonthlyPage() {
  const { data } = useApp();
  const [year, setYear] = useState(FINANCE_DATA_YEAR);
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return now.getFullYear() === FINANCE_DATA_YEAR ? now.getMonth() + 1 : 1;
  });

  const weeks = useMemo(() => getWeeksInMonth(year, month), [year, month]);

  const totals = useMemo(() => getMonthlySummaryTotals(data, year, month), [data, year, month]);
  const incomeDetail = useMemo(
    () => formatIncomeSummaryDetail(month, totals),
    [month, totals],
  );

  return (
    <div className="page monthly-page">
      <div className="toolbar card">
        <button type="button" onClick={() => (month === 1 ? (setYear(year - 1), setMonth(12)) : setMonth(month - 1))}>
          ◀
        </button>
        <h2>
          {year}년 {month}월
        </h2>
        <button type="button" onClick={() => (month === 12 ? (setYear(year + 1), setMonth(1)) : setMonth(month + 1))}>
          ▶
        </button>
        <div className="toolbar-spacer" />
        <label>
          연도
          <input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} />
        </label>
        <label>
          월
          <select value={month} onChange={(e) => setMonth(Number(e.target.value))}>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {i + 1}월
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={() => void exportMonthlyExcel(data, year, month).catch(() => alert('엑셀보내기에 실패했습니다.'))}
        >
          엑셀 Export
        </button>
      </div>

      <section className="table-section summary-section">
        <h2>요약</h2>
        <div className="summary-bar card">
          <div className="summary-block">
            <span className="label">월 수입 합계</span>
            <strong className="income">{formatMoney(totals.totalIncome)}원</strong>
            <span className="summary-detail">{incomeDetail}</span>
          </div>
          <div>
            <span className="label">월 지출 합계</span>
            <strong className="expense">{formatMoney(totals.expense)}원</strong>
          </div>
          <div>
            <span className="label">월 순잉여</span>
            <strong>{formatMoney(totals.balance)}원</strong>
          </div>
        </div>
      </section>

      <AccountTable type="income" categories={data.accounts.income} year={year} month={month} weeks={weeks} />
      <AccountTable type="expense" categories={data.accounts.expense} year={year} month={month} weeks={weeks} />
    </div>
  );
}
