import type { DayKey, PushDayRecord, PushStats } from './types';

export function calculateStats(
  records: readonly PushDayRecord[],
  todayKey: DayKey,
): PushStats {
  const lifetimePushUps = records.reduce((sum, record) => sum + record.reps, 0);
  const bestDay = records.reduce((best, record) => Math.max(best, record.reps), 0);
  const dailyAverage = records.length === 0
    ? 0
    : Math.round(lifetimePushUps / records.length);
  const activeDays = records.filter((record) => record.reps > 0).length;
  const activeDaysPercentage = records.length === 0
    ? 0
    : Math.round((activeDays / records.length) * 100);

  return {
    lifetimePushUps,
    currentStreak: currentStreak(records, todayKey),
    longestStreak: longestStreak(records),
    bestDay,
    dailyAverage,
    activeDaysPercentage,
  };
}

export function currentStreak(
  records: readonly PushDayRecord[],
  todayKey: DayKey,
): number {
  const todayIndex = records.findIndex((record) => record.dayKey === todayKey);
  if (todayIndex < 0) return trailingStreak(records);

  const endingIndex = records[todayIndex]?.reps === 0 ? todayIndex - 1 : todayIndex;
  return trailingStreak(records.slice(0, endingIndex + 1));
}

export function longestStreak(records: readonly PushDayRecord[]): number {
  let best = 0;
  let current = 0;

  for (const record of records) {
    if (record.reps > 0) {
      current += 1;
      best = Math.max(best, current);
    } else {
      current = 0;
    }
  }

  return best;
}

function trailingStreak(records: readonly PushDayRecord[]): number {
  let streak = 0;

  for (let index = records.length - 1; index >= 0; index -= 1) {
    if ((records[index]?.reps ?? 0) <= 0) break;
    streak += 1;
  }

  return streak;
}

export function motivationText(todayReps: number, yesterdayReps: number, bestDay: number): string {
  if (todayReps === 0) {
    return '1 push-up keeps your streak alive';
  }

  if (todayReps <= yesterdayReps) {
    return `${yesterdayReps - todayReps + 1} more to beat yesterday`;
  }

  if (todayReps < bestDay) {
    return `${bestDay - todayReps + 1} more for a new daily best`;
  }

  return 'New daily best. Keep pushing.';
}

