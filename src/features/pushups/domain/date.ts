import type { DayKey } from './types';

const DAY_KEY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

export function toDayKey(date: Date): DayKey {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}` as DayKey;
}

export function fromDayKey(dayKey: DayKey): Date {
  const match = DAY_KEY_PATTERN.exec(dayKey);
  if (!match) {
    throw new Error(`Invalid day key: ${dayKey}`);
  }

  const [, year, month, day] = match;
  return new Date(Number(year), Number(month) - 1, Number(day), 12);
}

export function addDays(dayKey: DayKey, amount: number): DayKey {
  const date = fromDayKey(dayKey);
  date.setDate(date.getDate() + amount);
  return toDayKey(date);
}

export function compareDayKeys(left: DayKey, right: DayKey): number {
  return left.localeCompare(right);
}

export function daysBetween(start: DayKey, end: DayKey): number {
  if (start === end) return 0;

  const direction = compareDayKeys(start, end) < 0 ? 1 : -1;
  let cursor = start;
  let count = 0;

  while (cursor !== end) {
    cursor = addDays(cursor, direction);
    count += direction;

    if (Math.abs(count) > 100_000) {
      throw new Error('Day range is unexpectedly large');
    }
  }

  return count;
}

export function dayKeysBetween(start: DayKey, end: DayKey): DayKey[] {
  if (compareDayKeys(start, end) > 0) return [];

  const keys: DayKey[] = [];
  let cursor = start;

  while (compareDayKeys(cursor, end) <= 0) {
    keys.push(cursor);
    cursor = addDays(cursor, 1);
  }

  return keys;
}

export function weekdayInitial(dayKey: DayKey, locale?: string): string {
  return new Intl.DateTimeFormat(locale, { weekday: 'short' })
    .format(fromDayKey(dayKey))
    .slice(0, 1)
    .toUpperCase();
}

