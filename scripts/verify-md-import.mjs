import { FINANCE_DATA_YEAR } from '../src/lib/config.ts';
import { loadAppData } from '../server/db.ts';

const YEAR = FINANCE_DATA_YEAR;
const data = loadAppData();

function monthIncome(year, month) {
  let sum = 0;
  const prefix = `${year}-${month}-`;
  for (const [key, amounts] of Object.entries(data.weeklyAmounts)) {
    if (!key.startsWith(prefix)) continue;
    const itemIds = new Set();
    for (const cat of data.accounts.income) {
      for (const item of cat.items) itemIds.add(item.id);
    }
    for (const [itemId, amt] of Object.entries(amounts)) {
      if (itemIds.has(itemId)) sum += amt;
    }
  }
  return sum;
}

function monthExpense(year, month) {
  let sum = 0;
  const prefix = `${year}-${month}-`;
  const itemIds = new Set();
  for (const cat of data.accounts.expense) {
    for (const item of cat.items) itemIds.add(item.id);
  }
  for (const [key, amounts] of Object.entries(data.weeklyAmounts)) {
    if (!key.startsWith(prefix)) continue;
    for (const [itemId, amt] of Object.entries(amounts)) {
      if (itemIds.has(itemId)) sum += amt;
    }
  }
  return sum;
}

const expectedIncome = {
  1: 5496000, 2: 4569000, 3: 6095000, 4: 7972000, 5: 3308000,
};
const expectedExpense = {
  1: 4618350, 2: 4382910, 3: 7207880, 4: 5069820, 5: 4685030,
};

console.log('월별 수입 (DB vs MD)');
for (let m = 1; m <= 5; m++) {
  const db = monthIncome(YEAR, m);
  const ok = db === expectedIncome[m];
  console.log(`  ${m}월: ${db.toLocaleString()} ${ok ? 'OK' : `≠ ${expectedIncome[m].toLocaleString()}`}`);
}

console.log('\n월별 지출 (DB vs MD)');
for (let m = 1; m <= 5; m++) {
  const db = monthExpense(YEAR, m);
  const ok = db === expectedExpense[m];
  console.log(`  ${m}월: ${db.toLocaleString()} ${ok ? 'OK' : `≠ ${expectedExpense[m].toLocaleString()}`}`);
}

console.log('\n적요 샘플 (3월 수도세):');
const mk = `${YEAR}-3`;
const item = data.accounts.expense.flatMap((c) => c.items).find((i) => i.name === '수도세');
if (item) console.log(' ', data.expenseMemos[mk]?.[item.id]);
