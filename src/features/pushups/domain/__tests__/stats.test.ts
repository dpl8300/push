import { calculateStats, currentStreak, longestStreak, motivationText } from '../stats';
import type { DayKey, PushDayRecord } from '../types';

const day = (dayKey: string, reps: number): PushDayRecord => ({
  dayKey: dayKey as DayKey,
  reps,
  colorIndex: 0,
});

describe('push-up statistics', () => {
  const todayKey = '2026-08-20' as DayKey;

  it('keeps yesterday\'s streak alive when today is still empty', () => {
    const records = [
      day('2026-08-17', 10),
      day('2026-08-18', 12),
      day('2026-08-19', 15),
      day('2026-08-20', 0),
    ];

    expect(currentStreak(records, todayKey)).toBe(3);
    expect(longestStreak(records)).toBe(3);
  });

  it('computes lifetime, best, rounded average, and active percentage', () => {
    const stats = calculateStats([
      day('2026-08-17', 10),
      day('2026-08-18', 0),
      day('2026-08-19', 5),
      day('2026-08-20', 2),
    ], todayKey);

    expect(stats).toEqual({
      lifetimePushUps: 17,
      currentStreak: 2,
      longestStreak: 2,
      bestDay: 10,
      dailyAverage: 4,
      activeDaysPercentage: 75,
    });
  });

  it('preserves every motivation boundary', () => {
    expect(motivationText(0, 20, 40)).toBe('1 push-up keeps your streak alive');
    expect(motivationText(20, 20, 40)).toBe('1 more to beat yesterday');
    expect(motivationText(21, 20, 40)).toBe('20 more for a new daily best');
    expect(motivationText(40, 20, 40)).toBe('New daily best. Keep pushing.');
  });
});

