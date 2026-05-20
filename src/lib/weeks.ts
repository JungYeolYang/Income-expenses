import type { WeekInMonth } from '../types';

export function monthKey(year: number, month: number): string {
  return `${year}-${month}`;
}

export function weekKey(year: number, month: number, sundayDay: number): string {
  return `${year}-${month}-${sundayDay}`;
}

export function parseWeekKey(key: string): { year: number; month: number; sundayDay: number } | null {
  const parts = key.split('-').map(Number);
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return null;
  return { year: parts[0], month: parts[1], sundayDay: parts[2] };
}

export function formatSundayDateLabel(month: number, day: number): string {
  return `${month}/${day}`;
}

/** 해당 월에 포함된 모든 일요일 = 주차 (1주, 2주, …) */
export function getWeeksInMonth(year: number, month: number): WeekInMonth[] {
  const lastDay = new Date(year, month, 0).getDate();
  const weeks: WeekInMonth[] = [];
  let weekIndex = 0;

  for (let day = 1; day <= lastDay; day++) {
    const d = new Date(year, month - 1, day);
    if (d.getDay() !== 0) continue;
    weekIndex += 1;
    weeks.push({
      weekIndex,
      label: `${weekIndex}주`,
      sundayDay: day,
      dateLabel: formatSundayDateLabel(month, day),
    });
  }

  return weeks;
}
