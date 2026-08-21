import { addDays, dayKeysBetween, daysBetween, weekdayInitial } from './date';
import type { DayKey, PushDay, PushDayRecord } from './types';

import { WeekColors } from '@/design-system/tokens';

export function buildVisibleWeek(
  records: readonly PushDayRecord[],
  todayKey: DayKey,
): PushDay[] {
  const recordsByDay = new Map(records.map((record) => [record.dayKey, record]));
  const firstVisibleDay = addDays(todayKey, -6);

  return dayKeysBetween(firstVisibleDay, todayKey).map((dayKey, index) => {
    const record = recordsByDay.get(dayKey);
    return {
      id: dayKey,
      dayKey,
      weekday: weekdayInitial(dayKey),
      reps: record?.reps ?? 0,
      colorIndex: record?.colorIndex ?? index % WeekColors.length,
      isToday: dayKey === todayKey,
    };
  });
}

export function fillRecordGaps(
  records: readonly PushDayRecord[],
  throughDay: DayKey,
): PushDayRecord[] {
  const sorted = [...records]
    .filter((record) => record.dayKey <= throughDay)
    .sort((left, right) => left.dayKey.localeCompare(right.dayKey));
  const firstActiveIndex = sorted.findIndex((record) => record.reps > 0);
  if (firstActiveIndex < 0) return [];

  const trimmed = sorted.slice(firstActiveIndex);
  const first = trimmed[0];
  if (!first) return [];

  const byDay = new Map(trimmed.map((record) => [record.dayKey, record]));
  return dayKeysBetween(first.dayKey, throughDay).map((dayKey) => (
    byDay.get(dayKey) ?? {
      dayKey,
      reps: 0,
      colorIndex: positiveModulo(
        first.colorIndex + daysBetween(first.dayKey, dayKey),
        WeekColors.length,
      ),
    }
  ));
}

export function positiveModulo(value: number, divisor: number): number {
  return ((value % divisor) + divisor) % divisor;
}
