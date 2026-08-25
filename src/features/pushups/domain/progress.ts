import { compareDayKeys, fromDayKey, toDayKey } from './date';
import type {
  DayKey,
  ProgressCalendarDay,
  ProgressMonthStats,
  PushDayRecord,
} from './types';

import { colorIndexForDay } from '@/features/pushups/domain/history';

export const PROGRESS_WEEKDAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'] as const;

export function startOfMonth(dayKey: DayKey): DayKey {
  const date = fromDayKey(dayKey);
  return toDayKey(new Date(date.getFullYear(), date.getMonth(), 1, 12));
}

export function endOfMonth(dayKey: DayKey): DayKey {
  const date = fromDayKey(dayKey);
  return toDayKey(new Date(date.getFullYear(), date.getMonth() + 1, 0, 12));
}

export function isSameMonth(left: DayKey, right: DayKey): boolean {
  const leftDate = fromDayKey(left);
  const rightDate = fromDayKey(right);
  return leftDate.getFullYear() === rightDate.getFullYear()
    && leftDate.getMonth() === rightDate.getMonth();
}

export function moveSelectionToMonth(
  selectedDayKey: DayKey,
  monthOffset: number,
  todayKey: DayKey,
): DayKey {
  const selectedDate = fromDayKey(selectedDayKey);
  const targetMonth = new Date(
    selectedDate.getFullYear(),
    selectedDate.getMonth() + monthOffset,
    1,
    12,
  );
  const lastDay = new Date(
    targetMonth.getFullYear(),
    targetMonth.getMonth() + 1,
    0,
    12,
  ).getDate();
  const candidate = toDayKey(new Date(
    targetMonth.getFullYear(),
    targetMonth.getMonth(),
    Math.min(selectedDate.getDate(), lastDay),
    12,
  ));

  return compareDayKeys(candidate, todayKey) > 0 ? todayKey : candidate;
}

export function buildProgressCalendar(
  displayedMonthKey: DayKey,
  selectedDayKey: DayKey,
  todayKey: DayKey,
  records: readonly PushDayRecord[],
): ProgressCalendarDay[] {
  const monthStartKey = startOfMonth(displayedMonthKey);
  const monthStart = fromDayKey(monthStartKey);
  const monthEnd = fromDayKey(endOfMonth(monthStartKey));
  const mondayOffset = (monthStart.getDay() + 6) % 7;
  const occupiedCells = mondayOffset + monthEnd.getDate();
  const cellCount = Math.max(35, Math.ceil(occupiedCells / 7) * 7);
  const gridStart = new Date(
    monthStart.getFullYear(),
    monthStart.getMonth(),
    1 - mondayOffset,
    12,
  );
  const recordsByDay = new Map(records.map((record) => [record.dayKey, record]));

  return Array.from({ length: cellCount }, (_, index) => {
    const date = new Date(
      gridStart.getFullYear(),
      gridStart.getMonth(),
      gridStart.getDate() + index,
      12,
    );
    const dayKey = toDayKey(date);
    const record = recordsByDay.get(dayKey);

    return {
      id: dayKey,
      dayKey,
      dayNumber: date.getDate(),
      reps: record?.reps ?? 0,
      colorIndex: record?.colorIndex ?? colorIndexForDay(records, dayKey),
      isInDisplayedMonth: isSameMonth(dayKey, monthStartKey),
      isToday: dayKey === todayKey,
      isFuture: compareDayKeys(dayKey, todayKey) > 0,
      isSelected: dayKey === selectedDayKey,
    };
  });
}

export function calculateProgressMonthStats(
  records: readonly PushDayRecord[],
  displayedMonthKey: DayKey,
): ProgressMonthStats {
  const monthStartKey = startOfMonth(displayedMonthKey);
  const monthEndKey = endOfMonth(displayedMonthKey);
  const monthRecords = records.filter((record) => (
    compareDayKeys(record.dayKey, monthStartKey) >= 0
      && compareDayKeys(record.dayKey, monthEndKey) <= 0
  ));

  return {
    totalPushUps: monthRecords.reduce((sum, record) => sum + record.reps, 0),
    activeDays: monthRecords.filter((record) => record.reps > 0).length,
    bestDay: monthRecords.reduce((best, record) => Math.max(best, record.reps), 0),
  };
}
