import { Fragment, useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { exportStatsExcel } from '../lib/excelExport';
import { formatMoney } from '../lib/format';
import {
  getStatsBudgetComparison,
  getStatsCellAmount,
  getStatsColumns,
  getStatsTableTotals,
  statsColumnTotalLabel,
  statsKindLabel,
  statsTitle,
  type StatsKind,
} from '../lib/stats';
import { FINANCE_DATA_YEAR } from '../lib/config';
import type { AccountCategory, AccountType } from '../types';

function StatsTable({
  type,
  categories,
  year,
  kind,
  month,
}: {
  type: AccountType;
  categories: AccountCategory[];
  year: number;
  kind: StatsKind;
  month: number;
}) {
  const { data } = useApp();
  const cols = useMemo(() => getStatsColumns(year, kind, month), [year, kind, month]);
  const title = type === 'income' ? '수입' : '지출';
  const periodSumLabel = kind === 'monthly' ? '월합계' : kind === 'firstHalf' ? '상반기합계' : '연간합계';
  const showYtd = kind === 'monthly';
  const columnTotalLabel = statsColumnTotalLabel(kind);
  const tableTotals = useMemo(
    () => getStatsTableTotals(data, categories, year, kind, month, cols),
    [data, categories, year, kind, month, cols],
  );

  return (
    <section className={`table-section ${type}`}>
      <h2>{title}</h2>
      <div className="table-wrap wide">
        <table className="data-table stats-table">
          <thead>
            <tr>
              <th className="sticky-col cat-col">대분류</th>
              <th className="sticky-col item-col">계정</th>
              {cols.map((c) => (
                <th key={c.key} className="week-col small">
                  {c.label}
                  {c.subLabel && <span className="sub">({c.subLabel})</span>}
                </th>
              ))}
              <th className="sum-col">{periodSumLabel}</th>
              <th className="budget-col">연간예산</th>
              {showYtd && <th className="budget-col">연누계</th>}
              <th>집행률(%)</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((cat) => (
              <Fragment key={cat.id}>
                {cat.items.map((item, idx) => {
                  const cmp = getStatsBudgetComparison(data, year, kind, month, item.id);
                  return (
                    <tr key={item.id}>
                      {idx === 0 && (
                        <td className="sticky-col cat-col" rowSpan={cat.items.length}>
                          {cat.name}
                        </td>
                      )}
                      <td className="sticky-col item-col">{item.name}</td>
                      {cols.map((c) => {
                        const v = getStatsCellAmount(data, c, item.id);
                        return (
                          <td key={c.key} className="num small">
                            {v ? formatMoney(v) : ''}
                          </td>
                        );
                      })}
                      <td className="num sum-col">{cmp.periodActual ? formatMoney(cmp.periodActual) : ''}</td>
                      <td className="num budget-col">{cmp.budget ? formatMoney(cmp.budget) : ''}</td>
                      {showYtd && (
                        <td className="num">{cmp.ytdActual ? formatMoney(cmp.ytdActual) : ''}</td>
                      )}
                      <td className="num">{cmp.executionRate}</td>
                    </tr>
                  );
                })}
              </Fragment>
            ))}
            <tr className="subtotal-row week-total-row">
              <td className="sticky-col cat-col" colSpan={2}>
                {columnTotalLabel}
              </td>
              {tableTotals.columnTotals.map((total, i) => (
                <td key={cols[i].key} className="num small">
                  {total ? formatMoney(total) : ''}
                </td>
              ))}
              <td className="num sum-col">
                {tableTotals.periodTotal ? formatMoney(tableTotals.periodTotal) : ''}
              </td>
              <td className="num budget-col">
                {tableTotals.budgetTotal ? formatMoney(tableTotals.budgetTotal) : ''}
              </td>
              {showYtd && (
                <td className="num">
                  {tableTotals.ytdTotal ? formatMoney(tableTotals.ytdTotal) : ''}
                </td>
              )}
              <td className="num">{tableTotals.executionRate}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function StatsPage() {
  const { data } = useApp();
  const now = new Date();
  const [year, setYear] = useState(FINANCE_DATA_YEAR);
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [kind, setKind] = useState<StatsKind>('monthly');

  const title = statsTitle(year, kind, month);

  return (
    <div className="page stats-page">
      <div className="toolbar card">
        <h2>기간별 통계 — {title}</h2>
        <div className="toolbar-spacer" />
        <label>
          연도
          <input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} />
        </label>
        {kind === 'monthly' && (
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
        )}
        <div className="period-tabs">
          {(['monthly', 'firstHalf', 'yearly'] as StatsKind[]).map((k) => (
            <button
              key={k}
              type="button"
              className={kind === k ? 'active' : ''}
              onClick={() => setKind(k)}
            >
              {statsKindLabel(k)}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() =>
            void exportStatsExcel(data, year, kind, month).catch(() => alert('엑셀보내기에 실패했습니다.'))
          }
        >
          엑셀 Export
        </button>
      </div>
      <p className="hint card">
        월별: 해당 월 <strong>주별</strong>(일요일) 실적 · 상반기: 1~6월 <strong>월별</strong> 합계 · 연간: 1~12월{' '}
        월별만 <strong>연누계</strong>(1월~해당 월)를 표시합니다. 상반기·연간은 기간합계와 동일해 생략합니다.
      </p>
      <StatsTable type="income" categories={data.accounts.income} year={year} kind={kind} month={month} />
      <StatsTable type="expense" categories={data.accounts.expense} year={year} kind={kind} month={month} />
    </div>
  );
}
