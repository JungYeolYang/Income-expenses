import { loadAppData } from '../server/db.ts';

const d = loadAppData();
const years = new Set();
for (const k of Object.keys(d.weeklyAmounts)) years.add(k.split('-')[0]);
for (const k of Object.keys(d.expenseMemos)) years.add(k.split('-')[0]);
for (const k of Object.keys(d.annualBudgets)) years.add(k);

function countWeeks(year) {
  return Object.keys(d.weeklyAmounts).filter((k) => k.startsWith(`${year}-`)).length;
}
function sumWeeks(year) {
  let t = 0;
  for (const [k, amts] of Object.entries(d.weeklyAmounts)) {
    if (!k.startsWith(`${year}-`)) continue;
    for (const v of Object.values(amts)) t += v;
  }
  return t;
}

for (const y of [...years].sort()) {
  console.log(
    `${y}년: 주간키 ${countWeeks(y)}개, 실적합 ${sumWeeks(y).toLocaleString()}원, 적요월 ${Object.keys(d.expenseMemos).filter((k) => k.startsWith(y + '-')).length}개, 예산계정 ${Object.keys(d.annualBudgets[y] ?? {}).length}개`,
  );
}
