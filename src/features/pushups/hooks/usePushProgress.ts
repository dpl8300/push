import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { SQLitePushDayRepository } from '@/features/pushups/data/push-day-repository';
import { compareDayKeys, toDayKey } from '@/features/pushups/domain/date';
import { colorIndexForDay } from '@/features/pushups/domain/history';
import {
  buildProgressCalendar,
  calculateProgressMonthStats,
  isSameMonth,
  moveSelectionToMonth,
  startOfMonth,
} from '@/features/pushups/domain/progress';
import type { DayKey, PushDayRecord } from '@/features/pushups/domain/types';

export function usePushProgress() {
  const db = useSQLiteContext();
  const repository = useMemo(() => new SQLitePushDayRepository(db), [db]);
  const initialTodayKey = useMemo(() => toDayKey(new Date()), []);
  const [todayKey, setTodayKey] = useState<DayKey>(initialTodayKey);
  const todayKeyRef = useRef(todayKey);
  const [displayedMonthKey, setDisplayedMonthKey] = useState<DayKey>(() => (
    startOfMonth(initialTodayKey)
  ));
  const [selectedDayKey, setSelectedDayKey] = useState<DayKey>(initialTodayKey);
  const [records, setRecords] = useState<PushDayRecord[]>([]);
  const recordsRef = useRef<PushDayRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    recordsRef.current = records;
  }, [records]);

  const loadHistory = useCallback(async (throughDay: DayKey) => {
    try {
      const history = await repository.getHistoryThrough(throughDay);
      recordsRef.current = history;
      setRecords(history);
      setError(null);
    } catch (loadError) {
      setError(messageForError(loadError));
    } finally {
      setIsLoading(false);
    }
  }, [repository]);

  const refresh = useCallback(async () => {
    const nextTodayKey = toDayKey(new Date());
    const previousTodayKey = todayKeyRef.current;

    if (nextTodayKey !== previousTodayKey) {
      todayKeyRef.current = nextTodayKey;
      setTodayKey(nextTodayKey);
      setDisplayedMonthKey((currentMonth) => (
        isSameMonth(currentMonth, previousTodayKey)
          ? startOfMonth(nextTodayKey)
          : currentMonth
      ));
      setSelectedDayKey((currentSelection) => (
        currentSelection === previousTodayKey ? nextTodayKey : currentSelection
      ));
    }

    await loadHistory(nextTodayKey);
  }, [loadHistory]);

  useFocusEffect(useCallback(() => {
    const timeout = setTimeout(() => {
      void refresh();
    }, 0);

    return () => clearTimeout(timeout);
  }, [refresh]));

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active' && !isAdjusting) {
        void refresh();
      }
    });

    return () => subscription.remove();
  }, [isAdjusting, refresh]);

  const calendarDays = useMemo(() => buildProgressCalendar(
    displayedMonthKey,
    selectedDayKey,
    todayKey,
    records,
  ), [displayedMonthKey, records, selectedDayKey, todayKey]);
  const monthStats = useMemo(() => (
    calculateProgressMonthStats(records, displayedMonthKey)
  ), [displayedMonthKey, records]);
  const selectedReps = repsForDay(records, selectedDayKey);
  const canGoToNextMonth = compareDayKeys(
    startOfMonth(displayedMonthKey),
    startOfMonth(todayKey),
  ) < 0;

  const selectDay = useCallback((dayKey: DayKey) => {
    if (compareDayKeys(dayKey, todayKeyRef.current) > 0) return;
    setSelectedDayKey(dayKey);
    setDisplayedMonthKey(startOfMonth(dayKey));
  }, []);

  const moveMonth = useCallback((offset: -1 | 1) => {
    if (offset > 0 && !canGoToNextMonth) return;

    const nextSelection = moveSelectionToMonth(
      selectedDayKey,
      offset,
      todayKeyRef.current,
    );
    setSelectedDayKey(nextSelection);
    setDisplayedMonthKey(startOfMonth(nextSelection));
  }, [canGoToNextMonth, selectedDayKey]);

  const adjustSelectedDay = useCallback(async (delta: -1 | 1) => {
    if (isAdjusting) return;
    if (compareDayKeys(selectedDayKey, todayKeyRef.current) > 0) return;

    const baseline = recordsRef.current;
    const baselineReps = repsForDay(baseline, selectedDayKey);
    if (delta < 0 && baselineReps === 0) return;

    const nextReps = baselineReps + delta;
    const optimistic = replaceDay(
      baseline,
      selectedDayKey,
      nextReps,
      colorIndexForDay(baseline, selectedDayKey),
    );

    recordsRef.current = optimistic;
    setRecords(optimistic);
    setError(null);
    setIsAdjusting(true);

    try {
      const committed = await repository.adjustReps(
        selectedDayKey,
        delta,
        todayKeyRef.current,
      );
      recordsRef.current = committed;
      setRecords(committed);
    } catch (adjustError) {
      recordsRef.current = baseline;
      setRecords(baseline);
      setError(messageForError(adjustError));
    } finally {
      setIsAdjusting(false);
    }
  }, [isAdjusting, repository, selectedDayKey]);

  return {
    todayKey,
    displayedMonthKey,
    selectedDayKey,
    selectedReps,
    calendarDays,
    monthStats,
    isLoading,
    isAdjusting,
    error,
    canGoToNextMonth,
    selectDay,
    goToPreviousMonth: () => moveMonth(-1),
    goToNextMonth: () => moveMonth(1),
    adjustSelectedDay,
    retry: refresh,
    clearError: () => setError(null),
  };
}

function repsForDay(records: readonly PushDayRecord[], dayKey: DayKey): number {
  return records.find((record) => record.dayKey === dayKey)?.reps ?? 0;
}

function replaceDay(
  records: readonly PushDayRecord[],
  dayKey: DayKey,
  reps: number,
  colorIndex: number,
): PushDayRecord[] {
  const next = records.map((record) => (
    record.dayKey === dayKey ? { ...record, reps } : record
  ));

  if (!next.some((record) => record.dayKey === dayKey)) {
    next.push({ dayKey, reps, colorIndex });
    next.sort((left, right) => left.dayKey.localeCompare(right.dayKey));
  }

  return next;
}

function messageForError(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return 'Push could not access its local history. Please try again.';
}
