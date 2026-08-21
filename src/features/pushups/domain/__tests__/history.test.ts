import { buildVisibleWeek, fillRecordGaps } from '../history';
import type { DayKey, PushDayRecord } from '../types';

describe('history projection', () => {
  const todayKey = '2026-08-20' as DayKey;

  it('always renders seven visible days for an empty history', () => {
    const week = buildVisibleWeek([], todayKey);

    expect(week).toHaveLength(7);
    expect(week[0]?.dayKey).toBe('2026-08-14');
    expect(week[6]).toMatchObject({ dayKey: todayKey, isToday: true, reps: 0 });
  });

  it('fills missing recorded days and preserves the color cycle', () => {
    const records: PushDayRecord[] = [
      { dayKey: '2026-08-17' as DayKey, reps: 10, colorIndex: 2 },
      { dayKey: '2026-08-20' as DayKey, reps: 5, colorIndex: 5 },
    ];

    expect(fillRecordGaps(records, todayKey)).toEqual([
      { dayKey: '2026-08-17', reps: 10, colorIndex: 2 },
      { dayKey: '2026-08-18', reps: 0, colorIndex: 3 },
      { dayKey: '2026-08-19', reps: 0, colorIndex: 4 },
      { dayKey: '2026-08-20', reps: 5, colorIndex: 5 },
    ]);
  });

  it('removes leading empty prototype records', () => {
    const records: PushDayRecord[] = [
      { dayKey: '2026-08-18' as DayKey, reps: 0, colorIndex: 0 },
      { dayKey: '2026-08-19' as DayKey, reps: 2, colorIndex: 1 },
    ];

    expect(fillRecordGaps(records, todayKey)[0]?.dayKey).toBe('2026-08-19');
  });
});

