import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.dirname(fileURLToPath(import.meta.url));
const d = 'motion.div'; // placeholder - will not use
const open = 'd' + 'iv';
const close = '</' + open + '>';
const closeSection = '</section>';

let snippet = fs.readFileSync(path.join(root, 'summary-snippet.txt'), 'utf8')
  .replaceAll('<TAG', `<${open}`)
  .replaceAll('</CTAG>', close)
  .replaceAll('</CSECTION>', closeSection);

const pagePath = path.join(root, '../src/pages/MonthlyPage.tsx');
let page = fs.readFileSync(pagePath, 'utf8');
page = page.replace(
  /      <section className="table-section summary-section">[\s\S]*?      <\/section>\n\n      <AccountTable/,
  `${snippet.trimEnd()}\n\n      <AccountTable`,
);
fs.writeFileSync(pagePath, page);
console.log('ok');
