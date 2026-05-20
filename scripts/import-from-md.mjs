/**
 * docs/수입.md, docs/지출.md → SQLite 반영
 * 사용: npx tsx scripts/import-from-md.mjs [연도]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { FINANCE_DATA_YEAR } from '../src/lib/config.ts';
import { getWeeksInMonth, weekKey, monthKey } from '../src/lib/weeks.ts';
import { loadAppData, persistAppData } from '../server/db.ts';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const YEAR = Number(process.argv[2]) || FINANCE_DATA_YEAR;
const MONTHS = [1, 2, 3, 4, 5];

function parseAmount(cell) {
  const t = cell.trim();
  if (!t || t === '—' || t === '-') return 0;
  const n = parseInt(t.replace(/,/g, ''), 10);
  return Number.isNaN(n) ? 0 : n;
}

function parseMemo(cell) {
  const t = cell.trim();
  if (!t || t === '—' || t === '-') return '';
  return t;
}

function buildItemMaps(accounts) {
  const income = new Map();
  const expense = new Map();
  for (const type of ['income', 'expense']) {
    const map = type === 'income' ? income : expense;
    for (const cat of accounts[type]) {
      for (const item of cat.items) {
        map.set(item.name, item.id);
      }
    }
  }
  return { income, expense };
}

function parseMdSections(filePath) {
  const text = fs.readFileSync(filePath, 'utf8');
  const sections = [];
  let current = null;

  for (const line of text.split('\n')) {
    const monthMatch = line.match(/^##\s*(\d{1,2})월/);
    if (monthMatch) {
      current = { month: Number(monthMatch[1]), lines: [] };
      sections.push(current);
      continue;
    }
    if (current) current.lines.push(line);
  }
  return sections;
}

function parseIncomeSection(section) {
  const rows = [];
  let weekColCount = 0;

  for (const line of section.lines) {
    if (!line.startsWith('|')) continue;
    const cells = line.split('|').map((c) => c.trim()).filter((_, i, arr) => i > 0 && i < arr.length - 1);
    if (cells.length < 2) continue;
    if (cells[0] === '계정' || cells[0].startsWith('---')) {
      if (cells[0] === '계정') {
        weekColCount = cells.filter((c) => /^\d+주$/.test(c)).length;
      }
      continue;
    }
    if (cells[0].includes('합계')) continue;

    const account = cells[0];
    const weekAmounts = cells.slice(1, 1 + weekColCount).map(parseAmount);
    rows.push({ account, weekAmounts });
  }
  return rows;
}

function parseExpenseSection(section) {
  const rows = [];
  for (const line of section.lines) {
    if (!line.startsWith('|')) continue;
    const cells = line.split('|').map((c) => c.trim()).filter((_, i, arr) => i > 0 && i < arr.length - 1);
    if (cells.length < 2 || cells[0] === '계정' || cells[0].startsWith('---')) continue;
    if (cells[0].includes('합계')) continue;
    rows.push({
      account: cells[0],
      amount: parseAmount(cells[1]),
      memo: parseMemo(cells[2] ?? ''),
    });
  }
  return rows;
}

function clearMonthData(data, year, month) {
  const prefix = `${year}-${month}-`;
  const mk = `${year}-${month}`;

  for (const key of Object.keys(data.weeklyAmounts)) {
    if (key.startsWith(prefix)) delete data.weeklyAmounts[key];
  }
  delete data.expenseMemos[mk];
}

function importIncome(data, itemMap, warnings) {
  const sections = parseMdSections(path.join(root, 'docs/수입.md'));

  for (const section of sections) {
    if (!MONTHS.includes(section.month)) continue;
    const weeks = getWeeksInMonth(YEAR, section.month);
    const rows = parseIncomeSection(section);

    for (const row of rows) {
      const itemId = itemMap.income.get(row.account);
      if (!itemId) {
        warnings.push(`[수입 ${section.month}월] DB에 없는 계정: ${row.account}`);
        continue;
      }
      row.weekAmounts.forEach((amount, i) => {
        if (!amount || !weeks[i]) return;
        const key = weekKey(YEAR, section.month, weeks[i].sundayDay);
        if (!data.weeklyAmounts[key]) data.weeklyAmounts[key] = {};
        data.weeklyAmounts[key][itemId] = amount;
      });
    }
  }
}

function importExpense(data, itemMap, warnings) {
  const sections = parseMdSections(path.join(root, 'docs/지출.md'));

  for (const section of sections) {
    if (!MONTHS.includes(section.month)) continue;
    const weeks = getWeeksInMonth(YEAR, section.month);
    const rows = parseExpenseSection(section);

    const byAccount = new Map();
    for (const row of rows) {
      if (!byAccount.has(row.account)) byAccount.set(row.account, []);
      byAccount.get(row.account).push(row);
    }

    const mk = monthKey(YEAR, section.month);

    for (const [account, entries] of byAccount) {
      const itemId = itemMap.expense.get(account);
      if (!itemId) {
        warnings.push(`[지출 ${section.month}월] DB에 없는 계정: ${account}`);
        continue;
      }

      const memos = entries.map((e) => e.memo).filter(Boolean);
      if (memos.length) {
        if (!data.expenseMemos[mk]) data.expenseMemos[mk] = {};
        data.expenseMemos[mk][itemId] = memos.join(' / ');
      }

      entries.forEach((entry, i) => {
        if (!entry.amount) return;
        const week = weeks[Math.min(i, weeks.length - 1)];
        const key = weekKey(YEAR, section.month, week.sundayDay);
        if (!data.weeklyAmounts[key]) data.weeklyAmounts[key] = {};
        const prev = data.weeklyAmounts[key][itemId] ?? 0;
        data.weeklyAmounts[key][itemId] = prev + entry.amount;
      });
    }
  }
}

const data = loadAppData();
if (!data.expenseMemos) data.expenseMemos = {};

for (const month of MONTHS) {
  clearMonthData(data, YEAR, month);
  // 이전에 다른 연도로 넣었을 수 있는 동일 월 데이터 제거
  if (YEAR === FINANCE_DATA_YEAR) clearMonthData(data, YEAR - 1, month);
}

const itemMap = buildItemMaps(data.accounts);
const warnings = [];

importIncome(data, itemMap, warnings);
importExpense(data, itemMap, warnings);

persistAppData(data);

console.log(`\n${YEAR}년 1~5월 수입·지출 MD 데이터를 DB에 반영했습니다.`);
console.log(`  weeklyAmounts 키 수: ${Object.keys(data.weeklyAmounts).length}`);
console.log(`  expenseMemos 월 수: ${Object.keys(data.expenseMemos).length}`);

if (warnings.length) {
  console.log('\n경고:');
  warnings.forEach((w) => console.log('  -', w));
} else {
  console.log('\n계정 매핑: 모두 성공');
}
