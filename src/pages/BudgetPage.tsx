import { Fragment, useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { MoneyCell } from '../components/MoneyCell';
import {
  compareBudget,
  getBudget,
  sumCategory,
  sumItemYtdFullYear,
} from '../lib/calculations';
import { formatMoney } from '../lib/format';
import { FINANCE_DATA_YEAR } from '../lib/config';
import type { AccountCategory, AccountType } from '../types';

function BudgetSection({
  type,
  categories,
  year,
}: {
  type: AccountType;
  categories: AccountCategory[];
  year: number;
}) {
  const { data, updateBudget } = useApp();
  const title = type === 'income' ? '수입' : '지출';

  const grand = useMemo(() => {
    let b = 0;
    let a = 0;
    for (const cat of categories) {
      for (const item of cat.items) {
        b += getBudget(data, year, item.id);
        a += sumItemYtdFullYear(data, year, item.id);
      }
    }
    return compareBudget(a, b);
  }, [data, categories, year]);

  return (
    <section className={`table-section ${type}`}>
      <h2>{title}</h2>
      <div className="table-wrap">
        <table className="data-table budget-table">
          <thead>
            <tr>
              <th className="sticky-col cat-col">대분류</th>
              <th className="sticky-col item-col">계정</th>
              <th>연간예산</th>
              <th>연누계실적</th>
              <th>집행률(%)</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((cat) => {
              const catBudget = sumCategory(data, cat, (id) => getBudget(data, year, id));
              const catActual = sumCategory(data, cat, (id) => sumItemYtdFullYear(data, year, id));
              const catCmp = compareBudget(catActual, catBudget);
              return (
                <Fragment key={cat.id}>
                  {cat.items.map((item, idx) => {
                    const budget = getBudget(data, year, item.id);
                    const actual = sumItemYtdFullYear(data, year, item.id);
                    const cmp = compareBudget(actual, budget);
                    return (
                      <tr key={item.id}>
                        {idx === 0 && (
                          <td className="sticky-col cat-col" rowSpan={cat.items.length}>
                            {cat.name}
                          </td>
                        )}
                        <td className="sticky-col item-col">{item.name}</td>
                        <MoneyCell
                          value={budget}
                          onChange={(n) => updateBudget(year, item.id, n)}
                        />
                        <td className="num">{actual ? formatMoney(actual) : ''}</td>
                        <td className="num">{cmp.executionRate}</td>
                      </tr>
                    );
                  })}
                  <tr className="subtotal-row">
                    <td className="sticky-col cat-col" />
                    <td className="sticky-col item-col">{cat.name} 소계</td>
                    <td className="num">{catBudget ? formatMoney(catBudget) : ''}</td>
                    <td className="num">{catActual ? formatMoney(catActual) : ''}</td>
                    <td className="num">{catCmp.executionRate}</td>
                  </tr>
                </Fragment>
              );
            })}
            <tr className="total-row">
              <td colSpan={2}>{title} 합계</td>
              <td className="num">{grand.budget ? formatMoney(grand.budget) : ''}</td>
              <td className="num">{grand.ytdActual ? formatMoney(grand.ytdActual) : ''}</td>
              <td className="num">{grand.executionRate}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function BudgetPage() {
  const { data } = useApp();
  const [year, setYear] = useState(FINANCE_DATA_YEAR);

  return (
    <div className="page budget-page">
      <div className="toolbar card">
        <h2>연간 예산 · 예산 대비 실적</h2>
        <div className="toolbar-spacer" />
        <label>
          연도
          <input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} />
        </label>
      </div>
      <p className="hint card">
        연누계 실적은 {year}년 주간 입력 합계입니다. 집행률 = 연누계 실적 ÷ 연간 예산.
      </p>
      <BudgetSection type="income" categories={data.accounts.income} year={year} />
      <BudgetSection type="expense" categories={data.accounts.expense} year={year} />
    </div>
  );
}
