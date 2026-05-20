import fs from 'fs';

const p = new URL('../src/pages/MonthlyPage.tsx', import.meta.url);
let s = fs.readFileSync(p, 'utf8');

const lines = s.split(/\r?\n/);
if (lines[192] !== '      </div>') {
  console.error('unexpected line 193:', JSON.stringify(lines[192]));
  process.exit(1);
}
lines[192] = '      </section>';
fs.writeFileSync(p, lines.join('\n'));
console.log('fixed line 193 -> </section>');
