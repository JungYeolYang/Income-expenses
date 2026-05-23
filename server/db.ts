import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createDefaultAccounts } from '../src/data/defaultAccounts.js';
import type { AppData, AccountsByType } from '../src/types.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR =
  process.env.VERCEL && !process.env.BLOB_READ_WRITE_TOKEN
    ? '/tmp'
    : path.join(__dirname, '..', 'data');
const DB_PATH = path.join(DATA_DIR, 'finance.db');

let db: Database.Database | null = null;

function initSchema(database: Database.Database) {
  database.exec(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
      name TEXT NOT NULL,
      sort_order INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS items (
      id TEXT PRIMARY KEY,
      category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      sort_order INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS weekly_amounts (
      year INTEGER NOT NULL,
      month INTEGER NOT NULL,
      sunday_day INTEGER NOT NULL,
      item_id TEXT NOT NULL REFERENCES items(id) ON DELETE CASCADE,
      amount INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (year, month, sunday_day, item_id)
    );

    CREATE TABLE IF NOT EXISTS annual_budgets (
      year INTEGER NOT NULL,
      item_id TEXT NOT NULL REFERENCES items(id) ON DELETE CASCADE,
      amount INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (year, item_id)
    );

    CREATE TABLE IF NOT EXISTS expense_memos (
      year INTEGER NOT NULL,
      month INTEGER NOT NULL,
      item_id TEXT NOT NULL REFERENCES items(id) ON DELETE CASCADE,
      memo TEXT NOT NULL DEFAULT '',
      PRIMARY KEY (year, month, item_id)
    );
  `);
}

function seedIfEmpty(database: Database.Database) {
  const count = database.prepare('SELECT COUNT(*) AS c FROM categories').get() as { c: number };
  if (count.c > 0) return;
  saveAppData(database, {
    version: 1,
    accounts: createDefaultAccounts(),
    weeklyAmounts: {},
    expenseMemos: {},
    annualBudgets: {},
  });
}

export function getDb(): Database.Database {
  if (!db) {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    db = new Database(DB_PATH);
    initSchema(db);
    seedIfEmpty(db);
  }
  return db;
}

function rowsToAccounts(database: Database.Database): AccountsByType {
  const categories = database
    .prepare('SELECT id, type, name FROM categories ORDER BY type, sort_order')
    .all() as { id: string; type: 'income' | 'expense'; name: string }[];

  const items = database
    .prepare('SELECT id, category_id, name FROM items ORDER BY sort_order')
    .all() as { id: string; category_id: string; name: string }[];

  const result: AccountsByType = { income: [], expense: [] };
  for (const type of ['income', 'expense'] as const) {
    const cats = categories.filter((c) => c.type === type);
    result[type] = cats.map((c) => ({
      id: c.id,
      name: c.name,
      items: items.filter((i) => i.category_id === c.id).map((i) => ({ id: i.id, name: i.name })),
    }));
  }
  return result;
}

export function loadAppData(): AppData {
  const database = getDb();
  const accounts = rowsToAccounts(database);

  const weeklyRows = database
    .prepare('SELECT year, month, sunday_day, item_id, amount FROM weekly_amounts')
    .all() as { year: number; month: number; sunday_day: number; item_id: string; amount: number }[];

  const weeklyAmounts: Record<string, Record<string, number>> = {};
  for (const row of weeklyRows) {
    const key = `${row.year}-${row.month}-${row.sunday_day}`;
    if (!weeklyAmounts[key]) weeklyAmounts[key] = {};
    weeklyAmounts[key][row.item_id] = row.amount;
  }

  const budgetRows = database
    .prepare('SELECT year, item_id, amount FROM annual_budgets')
    .all() as { year: number; item_id: string; amount: number }[];

  const annualBudgets: Record<string, Record<string, number>> = {};
  for (const row of budgetRows) {
    const y = String(row.year);
    if (!annualBudgets[y]) annualBudgets[y] = {};
    annualBudgets[y][row.item_id] = row.amount;
  }

  const memoRows = database
    .prepare('SELECT year, month, item_id, memo FROM expense_memos')
    .all() as { year: number; month: number; item_id: string; memo: string }[];

  const expenseMemos: Record<string, Record<string, string>> = {};
  for (const row of memoRows) {
    const key = `${row.year}-${row.month}`;
    if (!expenseMemos[key]) expenseMemos[key] = {};
    if (row.memo) expenseMemos[key][row.item_id] = row.memo;
  }

  return { version: 1, accounts, weeklyAmounts, expenseMemos, annualBudgets };
}

export function saveAppData(database: Database.Database, data: AppData) {
  const replaceAll = database.transaction(() => {
    database.prepare('DELETE FROM weekly_amounts').run();
    database.prepare('DELETE FROM expense_memos').run();
    database.prepare('DELETE FROM annual_budgets').run();
    database.prepare('DELETE FROM items').run();
    database.prepare('DELETE FROM categories').run();

    const insCat = database.prepare(
      'INSERT INTO categories (id, type, name, sort_order) VALUES (?, ?, ?, ?)',
    );
    const insItem = database.prepare(
      'INSERT INTO items (id, category_id, name, sort_order) VALUES (?, ?, ?, ?)',
    );
    const insWeek = database.prepare(
      'INSERT INTO weekly_amounts (year, month, sunday_day, item_id, amount) VALUES (?, ?, ?, ?, ?)',
    );
    const insMemo = database.prepare(
      'INSERT INTO expense_memos (year, month, item_id, memo) VALUES (?, ?, ?, ?)',
    );
    const insBudget = database.prepare(
      'INSERT INTO annual_budgets (year, item_id, amount) VALUES (?, ?, ?)',
    );

    (['income', 'expense'] as const).forEach((type) => {
      data.accounts[type].forEach((cat, ci) => {
        insCat.run(cat.id, type, cat.name, ci);
        cat.items.forEach((item, ii) => {
          insItem.run(item.id, cat.id, item.name, ii);
        });
      });
    });

    for (const [key, amounts] of Object.entries(data.weeklyAmounts)) {
      const parts = key.split('-').map(Number);
      if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) continue;
      const [year, month, sundayDay] = parts;
      for (const [itemId, amount] of Object.entries(amounts)) {
        if (amount) insWeek.run(year, month, sundayDay, itemId, amount);
      }
    }

    for (const [key, memos] of Object.entries(data.expenseMemos ?? {})) {
      const parts = key.split('-').map(Number);
      if (parts.length !== 2 || parts.some((n) => Number.isNaN(n))) continue;
      const [year, month] = parts;
      for (const [itemId, memo] of Object.entries(memos)) {
        const text = memo.trim();
        if (text) insMemo.run(year, month, itemId, text);
      }
    }

    for (const [yearStr, amounts] of Object.entries(data.annualBudgets)) {
      const year = Number(yearStr);
      for (const [itemId, amount] of Object.entries(amounts)) {
        if (amount) insBudget.run(year, itemId, amount);
      }
    }
  });

  replaceAll();
}

export function persistAppData(data: AppData) {
  saveAppData(getDb(), data);
}
