import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const p = path.join(path.dirname(fileURLToPath(import.meta.url)), '../src/pages/MonthlyPage.tsx');
const lines = fs.readFileSync(p, 'utf8').split('\n');
const start = lines.findIndex((l) => l.includes('table-section summary-section'));
const end = lines.findIndex((l, i) => i > start && l.includes('<AccountTable type="income"'));

const block = [
  '      <section className="table-section summary-section">',
  '        <h2>요약</h2>',
  '        <div className="summary-bar card">',
  '          <motion.div className="summary-block">',
  '            <span className="label">월 수입 합계</span>',
  '            <strong className="income">{formatMoney(totals.totalIncome)}원</strong>',
  '            <span className="summary-detail">{incomeDetail}</span>',
  '          </motion.div>',
  '          <motion.div>',
  '            <span className="label">월 지출 합계</span>',
  '            <strong className="expense">{formatMoney(totals.expense)}원</strong>',
  '          </motion.div>',
  '          <motion.div>',
  '            <span className="label">월 순잉여</span>',
  '            <strong>{formatMoney(totals.balance)}원</strong>',
  '          </motion.div>',
  '        </motion.div>',
  '      </motion.div>',
].map((l) => l.replaceAll('motion.div', 'div'));

const out = [...lines.slice(0, start), ...block, '', ...lines.slice(end)];
fs.writeFileSync(p, out.join('\n'));
console.log('replaced lines', start + 1, '-', end);
