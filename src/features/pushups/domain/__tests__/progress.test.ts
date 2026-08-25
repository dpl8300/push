import {
  buildProgressCalendar,
  calculateProgressMonthStats,
  endOfMonth,
  moveSelectionToMonth,
  startOfMonth,
} from '../progress';
import type { DayKey, PushDayRecord } from '../types';

const record = (dayKey: string, reps: number, colorIndex = 0): PushDayRecord => ({
  dayKey: dayKey as DayKey,
  reps,
  colorIndex,
});

describe('progress calendar', () => {
  it('builds a Monday-first five-week grid with adjacent-month days', () => {
    const days = buildProgressCalendar(
      '2024-05-01' as DayKey,
      '2024-05-09' as DayKey,
      '2024-05-09' as DayKey,
      [record('2024-05-09', 35, 5)],
    );

    expect(days).toHaveLength(35);
    expect(days[0]).toMatchObject({ dayKey: '2024-04-29', isInDisplayedMonth: false });
    expect(days[2]).toMatchObject({ dayKey: '2024-05-01', isInDisplayedMonth: true });
    expect(days[10]).toMatchObject({
      dayKey: '2024-05-09',
      reps: 35,
      colorIndex: 5,
      isSelected: true,
      isToday: true,
    });
    expect(days[34]).toMatchObject({
      dayKey: '2024-06-02',
      isInDisplayedMonth: false,
      isFuture: true,
    });
  });

  it('uses six rows when the month cannot fit in five weeks', () => {
    const days = buildProgressCalendar(
      '2024-09-01' as DayKey,
      '2024-09-01' as DayKey,
      '2024-09-30' as DayKey,
      [],
    );

    expect(days).toHaveLength(42);
    expect(days[0]?.dayKey).toBe('2024-08-26');
    expect(days[41]?.dayKey).toBe('2024-10-06');
  });

  it('keeps at least five rows for a four-week February', () => {
    const days = buildProgressCalendar(
      '2021-02-01' as DayKey,
      '2021-02-01' as DayKey,
      '2021-02-28' as DayKey,
      [],
    );

    expect(days).toHaveLength(35);
    expect(days[34]?.dayKey).toBe('2021-03-07');
  });

  it('moves the selection across leap years and clamps future dates to today', () => {
    expect(moveSelectionToMonth(
      '2028-01-31' as DayKey,
      1,
      '2028-12-31' as DayKey,
    )).toBe('2028-02-29');
    expect(moveSelectionToMonth(
      '2026-07-31' as DayKey,
      1,
      '2026-08-24' as DayKey,
    )).toBe('2026-08-24');
    expect(startOfMonth('2026-12-31' as DayKey)).toBe('2026-12-01');
    expect(endOfMonth('2028-02-01' as DayKey)).toBe('2028-02-29');
  });
});

describe('progress month statistics', () => {
  it('calculates total, active days, and best day only for the displayed month', () => {
    expect(calculateProgressMonthStats([
      record('2026-07-31', 50),
      record('2026-08-01', 12),
      record('2026-08-02', 0),
      record('2026-08-03', 28),
      record('2026-09-01', 90),
    ], '2026-08-24' as DayKey)).toEqual({
      totalPushUps: 40,
      activeDays: 2,
      bestDay: 28,
    });
  });

  it('returns zeroed statistics for an empty month', () => {
    expect(calculateProgressMonthStats([], '2026-08-01' as DayKey)).toEqual({
      totalPushUps: 0,
      activeDays: 0,
      bestDay: 0,
    });
  });
});
