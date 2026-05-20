import fs from 'fs';

const p = new URL('../src/pages/MonthlyPage.tsx', import.meta.url);
let s = fs.readFileSync(p, 'utf8');

const block = `        <motion.div className="summary-bar card">
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

      <AccountTable`;

// Fix: use actual file content with div tags
const block2 = `        <motion.div className="summary-bar card">
        <motion.div className="summary-block">`;

if (s.includes('summary-section') && !s.includes('</section>\n\n      <AccountTable')) {
  s = s.replace(
    /      <section className="table-section summary-section">\s*<h2>요약<\/h2>\s*<div className="summary-bar card">\s*<div className="summary-block">([\s\S]*?)      <\/motion.div>\s*\n\s*<AccountTable/,
    (m, inner) => `      <section className="table-section summary-section">
        <h2>요약</h2>
        <div className="summary-bar card">
          <div className="summary-block">${inner.replace(/^        /gm, '          ').replace(/^        <div>/gm, '          <div>')}        </motion.div>
      </motion.div>

      <AccountTable`,
  );
}

// Simpler: just add closing section tag
s = s.replace(
  /(<section className="table-section summary-section">[\s\S]*?)      <\/motion.div>\n\n      <AccountTable/,
  '$1        </motion.div>\n      </motion.div>\n\n      <AccountTable',
);

// Fix wrong motion tags if any - replace motion.div with div in summary only
// Actually read and fix manually

fs.writeFileSync(p, s);
console.log('done');
