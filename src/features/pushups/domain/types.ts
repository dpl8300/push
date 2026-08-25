export type DayKey = `${number}-${number}-${number}`;

export type PushDayRecord = {
  dayKey: DayKey;
  reps: number;
  colorIndex: number;
};

export type PushDay = PushDayRecord & {
  id: DayKey;
  weekday: string;
  isToday: boolean;
};

export type PushStats = {
  lifetimePushUps: number;
  currentStreak: number;
  longestStreak: number;
  bestDay: number;
  dailyAverage: number;
  activeDaysPercentage: number;
};

export type ProgressMonthStats = {
  totalPushUps: number;
  activeDays: number;
  bestDay: number;
};

export type ProgressCalendarDay = {
  id: DayKey;
  dayKey: DayKey;
  dayNumber: number;
  reps: number;
  colorIndex: number;
  isInDisplayedMonth: boolean;
  isToday: boolean;
  isFuture: boolean;
  isSelected: boolean;
};
