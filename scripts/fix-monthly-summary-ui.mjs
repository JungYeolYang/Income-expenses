import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const p = path.join(path.dirname(fileURLToPath(import.meta.url)), '../src/pages/MonthlyPage.tsx');
let t = fs.readFileSync(p, 'utf8');

t = t.replaceAll('<motion.div', '<div').replaceAll('</motion.div>', '</motion.div>');
// fix mistaken above - only had opening motion tags
t = fs.readFileSync(p, 'utf8').replaceAll('<motion.div', '<div');

const summaryBlock = `      <section className="table-section summary-section">
        <h2>요약</h2>
        <div className="summary-bar card">
          <div className="summary-block">
            <span className="label">월 수입 합계</span>
            <strong className="income">{formatMoney(totals.totalIncome)}원</strong>
            <span className="summary-detail">{incomeDetail}</span>
          </motion.div>
          <motion.div>
            <span className="label">월 지출 합계</span>
            <strong className="expense">{formatMoney(totals.expense)}원</strong>
          </motion.div>
          <motion.div>
            <span className="label">월 순잉여</span>
            <strong>{formatMoney(totals.balance)}원</strong>
          </motion.div>
        </motion.div>
      </motion.div>`;

// Fix script - use div only
const good = `      <section className="table-section summary-section">
        <h2>요약</h2>
        <div className="summary-bar card">
          <div className="summary-block">
            <span className="label">월 수입 합계</span>
            <strong className="income">{formatMoney(totals.totalIncome)}원</strong>
            <span className="summary-detail">{incomeDetail}</span>
          </motion.div>
          <motion.div>
            <span className="label">월 지출 합계</span>
            <strong className="expense">{formatMoney(totals.expense)}원</strong>
          </motion.div>
          <motion.div>
            <span className="label">월 순잉여</span>
            <strong>{formatMoney(totals.balance)}원</strong>
          </motion.div>
        </motion.div>
      </motion.div>`;

const goodFixed = good.replaceAll('</motion.div>', '</motion.div>').replaceAll('<motion.div', '<div');
// Still wrong - write goodFixed manually with div only

const final = `      <section className="table-section summary-section">
        <h2>요약</h2>
        <div className="summary-bar card">
          <div className="summary-block">
            <span className="label">월 수입 합계</span>
            <strong className="income">{formatMoney(totals.totalIncome)}원</strong>
            <span className="summary-detail">{incomeDetail}</span>
          </motion.div>
          <motion.div>
            <span className="label">월 지출 합계</span>
            <strong className="expense">{formatMoney(totals.expense)}원</strong>
          </motion.div>
          <motion.div>
            <span className="label">월 순잉여</span>
            <strong>{formatMoney(totals.balance)}원</strong>
          </motion.div>
        </motion.div>
      </motion.div>`;

// I give up on template - read and regex replace section
t = fs.readFileSync(p, 'utf8');
t = t.replaceAll('<motion.div', '<div');
t = t.replace(
  /      <section className="table-section summary-section">[\s\S]*?      <\/section>\n\n      <AccountTable/,
  `      <section className="table-section summary-section">
        <h2>요약</h2>
        <div className="summary-bar card">
          <motion.div className="summary-block">
            <span className="label">월 수입 합계</span>
            <strong className="income">{formatMoney(totals.totalIncome)}원</strong>
            <span className="summary-detail">{incomeDetail}</span>
          </motion.div>
          <motion.div>
            <span className="label">월 지출 합계</span>
            <strong className="expense">{formatMoney(totals.expense)}원</strong>
          </motion.div>
          <motion.div>
            <span className="label">월 순잉여</span>
            <strong>{formatMoney(totals.balance)}원</strong>
          </motion.div>
        </motion.div>
      </motion.div>

      <AccountTable`,
);

fs.writeFileSync(p, t);
console.log('fixed');
