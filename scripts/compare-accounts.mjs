import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

function parseMdAccounts(file) {
  const text = fs.readFileSync(path.join(root, file), 'utf8');
  const set = new Set();
  for (const line of text.split('\n')) {
    const m = line.match(/^\| ([^|]+) \|/);
    if (!m) continue;
    const name = m[1].trim();
    if (name === '계정' || name.startsWith('---') || name.includes('합계')) continue;
    set.add(name);
  }
  return set;
}

function flattenAccounts(accountsByType) {
  const out = { income: [], expense: [] };
  for (const type of ['income', 'expense']) {
    for (const cat of accountsByType[type]) {
      for (const item of cat.items) out[type].push(item.name);
    }
  }
  return out;
}

const norm = (s) => s.replace(/\s+/g, '').toLowerCase();

function matchInDb(mdName, dbNames) {
  const n = norm(mdName);
  const exact = dbNames.find((d) => norm(d) === n);
  if (exact) return { kind: 'exact', name: exact };
  const similar = dbNames.find((d) => {
    const dn = norm(d);
    return dn.includes(n) || n.includes(dn);
  });
  if (similar) return { kind: 'similar', name: similar };
  return null;
}

const mdIncome = parseMdAccounts('docs/수입.md');
const mdExpense = parseMdAccounts('docs/지출.md');

// default template
const { createDefaultAccounts } = await import('../src/data/defaultAccounts.ts');
const defaultDb = flattenAccounts(createDefaultAccounts());

let actualDb = defaultDb;
const dbPath = path.join(root, 'data', 'finance.db');
if (fs.existsSync(dbPath)) {
  const Database = (await import('better-sqlite3')).default;
  const db = new Database(dbPath, { readonly: true });
  const rows = db
    .prepare(
      `SELECT c.type, i.name AS item
       FROM items i
       JOIN categories c ON i.category_id = c.id
       ORDER BY c.type, c.sort_order, i.sort_order`,
    )
    .all();
  db.close();
  actualDb = {
    income: rows.filter((r) => r.type === 'income').map((r) => r.item),
    expense: rows.filter((r) => r.type === 'expense').map((r) => r.item),
  };
}

function report(type, mdSet, dbNames) {
  const onlyMd = [];
  const renames = [];
  for (const md of [...mdSet].sort()) {
    const m = matchInDb(md, dbNames);
    if (!m) onlyMd.push(md);
    else if (m.kind !== 'exact' || m.name !== md) renames.push({ md, db: m.name, kind: m.kind });
  }
  const mdNormMatched = new Set();
  for (const md of mdSet) {
    const m = matchInDb(md, dbNames);
    if (m) mdNormMatched.add(norm(m.name));
  }
  const onlyDb = dbNames.filter((d) => !mdNormMatched.has(norm(d)));
  return { onlyMd, renames, onlyDb };
}

const dbSource = fs.existsSync(dbPath) ? 'data/finance.db' : 'defaultAccounts.ts (DB 파일 없음)';
const inc = report('income', mdIncome, actualDb.income);
const exp = report('expense', mdExpense, actualDb.expense);

console.log(JSON.stringify({ dbSource, mdIncome: [...mdIncome], mdExpense: [...mdExpense], income: inc, expense: exp, dbCounts: { income: actualDb.income.length, expense: actualDb.expense.length } }, null, 2));
