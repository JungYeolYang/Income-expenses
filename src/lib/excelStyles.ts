import type ExcelJS from 'exceljs';
import type { AccountType } from '../types';

export const COLORS = {
  border: 'FFE2DDD4',
  headerBg: 'FFF8F6F3',
  sumBg: 'FFFAF9F7',
  subtotalBg: 'FFF3F0EB',
  totalBg: 'FFEBE6DE',
  income: 'FF1D6B4F',
  expense: 'FFB45309',
  text: 'FF1C1917',
};

const thinBorder: Partial<ExcelJS.Border> = {
  style: 'thin',
  color: { argb: COLORS.border },
};

export const cellBorder: Partial<ExcelJS.Borders> = {
  top: thinBorder,
  left: thinBorder,
  bottom: thinBorder,
  right: thinBorder,
};

export const moneyFmt = '#,##0';

export function accentForType(type: AccountType): string {
  return type === 'income' ? COLORS.income : COLORS.expense;
}

export function applyBorder(cell: ExcelJS.Cell): void {
  cell.border = cellBorder;
}

export function styleTitle(cell: ExcelJS.Cell, accent: string, text: string): void {
  cell.value = text;
  cell.font = { bold: true, size: 14, color: { argb: accent } };
  cell.alignment = { vertical: 'middle' };
}

export function styleHeaderCell(cell: ExcelJS.Cell): void {
  cell.font = { bold: true, color: { argb: COLORS.text } };
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.headerBg } };
  cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  applyBorder(cell);
}

export function styleCategoryCell(cell: ExcelJS.Cell): void {
  cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  cell.font = { bold: false };
  applyBorder(cell);
}

export function styleTextCell(cell: ExcelJS.Cell): void {
  cell.alignment = { vertical: 'middle' };
  applyBorder(cell);
}

export function styleMoneyCell(cell: ExcelJS.Cell, highlight = false): void {
  cell.numFmt = moneyFmt;
  cell.alignment = { horizontal: 'right', vertical: 'middle' };
  if (highlight) {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.sumBg } };
    cell.font = { bold: true };
  }
  applyBorder(cell);
}

export function stylePercentCell(cell: ExcelJS.Cell): void {
  cell.alignment = { horizontal: 'right', vertical: 'middle' };
  applyBorder(cell);
}

export function styleTotalRow(cells: ExcelJS.Cell[]): void {
  for (const cell of cells) {
    cell.font = { bold: true };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.totalBg } };
    applyBorder(cell);
  }
}

export function setColumnWidths(sheet: ExcelJS.Worksheet, widths: number[]): void {
  widths.forEach((w, i) => {
    sheet.getColumn(i + 1).width = w;
  });
}

export function mergeTitleRow(sheet: ExcelJS.Worksheet, row: number, colCount: number): void {
  if (colCount > 1) sheet.mergeCells(row, 1, row, colCount);
}
