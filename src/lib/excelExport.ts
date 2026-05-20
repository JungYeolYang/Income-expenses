import ExcelJS from 'exceljs';
import type { AppData, AccountCategory, AccountType } from '../types';
import {
  getAmount,
  getBudget,
  getExpenseMemo,
  getMonthlySummaryTotals,
  sumItemInMonth,
  sumWeekForCategories,
} from './calculations';
import { formatIncomeSummaryDetail } from './monthlySummary';
import { getWeeksInMonth, weekKey } from './weeks';
import {
  getStatsBudgetComparison,
  getStatsCellAmount,
  getStatsColumns,
  getStatsTableTotals,
  statsColumnTotalLabel,
  statsTitle,
  type StatsColumn,
  type StatsKind,
} from './stats';
import type { WeekInMonth } from '../types';
import {
  accentForType,
  mergeTitleRow,
  setColumnWidths,
  styleCategoryCell,
  styleHeaderCell,
  styleMoneyCell,
  stylePercentCell,
  styleTextCell,
  styleTitle,
  styleTotalRow,
} from './excelStyles';

async function downloadWorkbook(workbook: ExcelJS.Workbook, filename: string): Promise<void> {
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function setMoney(cell: ExcelJS.Cell, value: number, highlight = false): void {
  if (value) cell.value = value;
  styleMoneyCell(cell, highlight);
}

function setText(cell: ExcelJS.Cell, value: string): void {
  cell.value = value;
  styleTextCell(cell);
}

function buildMonthlySheet(
  workbook: ExcelJS.Workbook,
  data: AppData,
  type: AccountType,
  categories: AccountCategory[],
  year: number,
  month: number,
  weeks: WeekInMonth[],
): void {
  const label = type === 'income' ? '수입' : '지출';
  const sheet = workbook.addWorksheet(label);
  const accent = accentForType(type);
  const weekCount = weeks.length;
  const withMemo = type === 'expense';
  const colCount = 2 + weekCount + (withMemo ? 1 : 0) + 2;

  const widths = [14, 16, ...weeks.map(() => 11), ...(withMemo ? [24] : []), 12, 12];
  setColumnWidths(sheet, widths);

  mergeTitleRow(sheet, 1, colCount);
  styleTitle(sheet.getCell(1, 1), accent, `${year}년 ${month}월 ${label} 실적`);

  const headerRow = 3;
  const headers: string[] = [
    '대분류',
    '계정',
    ...weeks.map((w) => `${w.label}\n(${w.dateLabel})`),
    ...(withMemo ? ['적요'] : []),
    '월합계',
    '연간예산',
  ];
  const hRow = sheet.getRow(headerRow);
  headers.forEach((h, i) => {
    const cell = hRow.getCell(i + 1);
    cell.value = h;
    styleHeaderCell(cell);
  });
  hRow.height = 36;

  let rowNum = headerRow + 1;
  let typeTotal = 0;

  for (const cat of categories) {
    const catStart = rowNum;
    for (let idx = 0; idx < cat.items.length; idx++) {
      const item = cat.items[idx];
      const row = sheet.getRow(rowNum);

      if (idx === 0) {
        const catCell = row.getCell(1);
        catCell.value = cat.name;
        styleCategoryCell(catCell);
      }

      setText(row.getCell(2), item.name);

      weeks.forEach((w, wi) => {
        const v = getAmount(data, weekKey(year, month, w.sundayDay), item.id);
        setMoney(row.getCell(3 + wi), v);
      });

      const sumCol = 3 + weekCount + (withMemo ? 1 : 0);
      if (withMemo) {
        setText(row.getCell(3 + weekCount), getExpenseMemo(data, year, month, item.id));
      }

      const monthSum = sumItemInMonth(data, year, month, item.id);
      typeTotal += monthSum;
      setMoney(row.getCell(sumCol), monthSum, true);
      setMoney(row.getCell(sumCol + 1), getBudget(data, year, item.id));

      rowNum++;
    }

    if (cat.items.length > 1) {
      sheet.mergeCells(catStart, 1, rowNum - 1, 1);
      styleCategoryCell(sheet.getCell(catStart, 1));
    }
  }

  const sumCol = 3 + weekCount + (withMemo ? 1 : 0);
  const weekTotalRow = sheet.getRow(rowNum);
  sheet.mergeCells(rowNum, 1, rowNum, 2);
  const weekTotalLabel = weekTotalRow.getCell(1);
  weekTotalLabel.value = '주별 합계';
  styleTotalRow([weekTotalLabel]);

  weeks.forEach((w, wi) => {
    const weekSum = sumWeekForCategories(data, year, month, w.sundayDay, categories);
    setMoney(weekTotalRow.getCell(3 + wi), weekSum, true);
  });

  if (withMemo) applyEmptyBorder(weekTotalRow.getCell(3 + weekCount));
  setMoney(weekTotalRow.getCell(sumCol), typeTotal, true);
  applyEmptyBorder(weekTotalRow.getCell(sumCol + 1));

  sheet.views = [{ state: 'frozen', ySplit: headerRow, xSplit: 2 }];
}

function applyEmptyBorder(cell: ExcelJS.Cell): void {
  styleMoneyCell(cell);
  cell.value = null;
}

function buildStatsSheet(
  workbook: ExcelJS.Workbook,
  data: AppData,
  type: AccountType,
  categories: AccountCategory[],
  year: number,
  kind: StatsKind,
  month: number,
  cols: StatsColumn[],
  periodTitle: string,
): void {
  const label = type === 'income' ? '수입' : '지출';
  const sheet = workbook.addWorksheet(label);
  const accent = accentForType(type);
  const colCount = cols.length;
  const showYtd = kind === 'monthly';
  const tailCount = showYtd ? 4 : 3;
  const colCountTotal = 2 + colCount + tailCount;
  const periodSumLabel = kind === 'monthly' ? '월합계' : kind === 'firstHalf' ? '상반기합계' : '연간합계';

  const widths = [14, 16, ...cols.map(() => 10), 11, ...(showYtd ? [11] : []), 11, 9];
  setColumnWidths(sheet, widths);

  mergeTitleRow(sheet, 1, colCountTotal);
  styleTitle(sheet.getCell(1, 1), accent, `${periodTitle} — ${label}`);

  const headerRow = 3;
  const headers = [
    '대분류',
    '계정',
    ...cols.map((c) => (c.subLabel ? `${c.label}\n(${c.subLabel})` : c.label)),
    periodSumLabel,
    '연간예산',
    ...(showYtd ? ['연누계'] : []),
    '집행률(%)',
  ];
  const hRow = sheet.getRow(headerRow);
  headers.forEach((h, i) => {
    const cell = hRow.getCell(i + 1);
    cell.value = h;
    styleHeaderCell(cell);
  });
  hRow.height = 28;

  let rowNum = headerRow + 1;
  const tableTotals = getStatsTableTotals(data, categories, year, kind, month, cols);

  const fixedStart = 3 + colCount;

  for (const cat of categories) {
    const catStart = rowNum;
    for (let idx = 0; idx < cat.items.length; idx++) {
      const item = cat.items[idx];
      const row = sheet.getRow(rowNum);
      const cmp = getStatsBudgetComparison(data, year, kind, month, item.id);

      if (idx === 0) {
        const catCell = row.getCell(1);
        catCell.value = cat.name;
        styleCategoryCell(catCell);
      }

      setText(row.getCell(2), item.name);

      cols.forEach((c, wi) => {
        setMoney(row.getCell(3 + wi), getStatsCellAmount(data, c, item.id));
      });

      let tailCol = fixedStart;
      setMoney(row.getCell(tailCol++), cmp.periodActual, true);
      setMoney(row.getCell(tailCol++), cmp.budget);
      if (showYtd) setMoney(row.getCell(tailCol++), cmp.ytdActual);
      const execPct = row.getCell(tailCol);
      execPct.value = cmp.executionRate;
      stylePercentCell(execPct);

      rowNum++;
    }

    if (cat.items.length > 1) {
      sheet.mergeCells(catStart, 1, rowNum - 1, 1);
      styleCategoryCell(sheet.getCell(catStart, 1));
    }
  }

  const totalRow = sheet.getRow(rowNum);
  sheet.mergeCells(rowNum, 1, rowNum, 2);
  const totalLabel = totalRow.getCell(1);
  totalLabel.value = statsColumnTotalLabel(kind);
  styleTotalRow([totalLabel]);
  tableTotals.columnTotals.forEach((colSum, wi) => {
    setMoney(totalRow.getCell(3 + wi), colSum, true);
  });
  let totalTail = fixedStart;
  setMoney(totalRow.getCell(totalTail++), tableTotals.periodTotal, true);
  setMoney(totalRow.getCell(totalTail++), tableTotals.budgetTotal);
  if (showYtd) setMoney(totalRow.getCell(totalTail++), tableTotals.ytdTotal);
  const execCell = totalRow.getCell(totalTail);
  execCell.value = tableTotals.executionRate;
  stylePercentCell(execCell);
  const totalCells = [totalRow.getCell(fixedStart), totalRow.getCell(fixedStart + 1)];
  if (showYtd) totalCells.push(totalRow.getCell(fixedStart + 2));
  totalCells.push(execCell);
  styleTotalRow(totalCells);

  sheet.views = [{ state: 'frozen', ySplit: headerRow, xSplit: 2 }];
}

function buildMonthlySummarySheet(
  workbook: ExcelJS.Workbook,
  data: AppData,
  year: number,
  month: number,
): void {
  const sheet = workbook.addWorksheet('월간요약', { properties: { tabColor: { argb: 'FF4A6FA5' } } });
  const colCount = 3;
  setColumnWidths(sheet, [18, 16, 48]);

  mergeTitleRow(sheet, 1, colCount);
  styleTitle(sheet.getCell(1, 1), 'FF1C1917', `${year}년 ${month}월 월간 실적 요약`);

  const headerRow = 3;
  const hRow = sheet.getRow(headerRow);
  ['항목', '금액', '내역'].forEach((h, i) => {
    const cell = hRow.getCell(i + 1);
    cell.value = h;
    styleHeaderCell(cell);
  });

  const t = getMonthlySummaryTotals(data, year, month);
  const incomeDetail = formatIncomeSummaryDetail(month, t);

  const rows: { label: string; amount: number; detail: string; highlight?: boolean }[] = [
    { label: '월 수입 합계', amount: t.totalIncome, detail: incomeDetail, highlight: true },
    { label: '월 지출 합계', amount: t.expense, detail: '' },
    { label: '월 순잉여', amount: t.balance, detail: '', highlight: true },
  ];

  rows.forEach((r, i) => {
    const row = sheet.getRow(headerRow + 1 + i);
    const labelCell = row.getCell(1);
    labelCell.value = r.label;
    styleTextCell(labelCell);
    if (r.highlight) labelCell.font = { bold: true };

    setMoney(row.getCell(2), r.amount, r.highlight);
    const detailCell = row.getCell(3);
    detailCell.value = r.detail;
    styleTextCell(detailCell);
    detailCell.alignment = { vertical: 'middle', wrapText: true };
    if (r.detail) row.height = 28;
  });

  const balanceRow = sheet.getRow(headerRow + 3);
  styleTotalRow([balanceRow.getCell(1), balanceRow.getCell(2)]);
}

export async function exportMonthlyExcel(data: AppData, year: number, month: number): Promise<void> {
  const weeks = getWeeksInMonth(year, month);
  const workbook = new ExcelJS.Workbook();
  workbook.creator = '교회 재정 관리';
  workbook.created = new Date();

  buildMonthlySummarySheet(workbook, data, year, month);
  buildMonthlySheet(workbook, data, 'income', data.accounts.income, year, month, weeks);
  buildMonthlySheet(workbook, data, 'expense', data.accounts.expense, year, month, weeks);

  await downloadWorkbook(workbook, `재정_${year}년_${month}월.xlsx`);
}

export async function exportStatsExcel(
  data: AppData,
  year: number,
  kind: StatsKind,
  month: number,
): Promise<void> {
  const cols = getStatsColumns(year, kind, month);
  const title = statsTitle(year, kind, month);
  const workbook = new ExcelJS.Workbook();
  workbook.creator = '교회 재정 관리';
  workbook.created = new Date();

  buildStatsSheet(workbook, data, 'income', data.accounts.income, year, kind, month, cols, title);
  buildStatsSheet(workbook, data, 'expense', data.accounts.expense, year, kind, month, cols, title);

  await downloadWorkbook(workbook, `재정_통계_${title.replace(/\s/g, '')}.xlsx`);
}
