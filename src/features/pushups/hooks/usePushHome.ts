import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { SQLitePushDayRepository } from '@/features/pushups/data/push-day-repository';
import { addDays, toDayKey } from '@/features/pushups/domain/date';
import { buildVisibleWeek } from '@/features/pushups/domain/history';
import { calculateStats, motivationText } from '@/features/pushups/domain/stats';
import type { DayKey, PushDayRecord } from '@/features/pushups/domain/types';
import { MAX_ADD_AMOUNT, MIN_ADD_AMOUNT } from '@/features/pushups/domain/validation';
import {
  playCompletionHaptic,
  playRepHaptic,
  repCadenceMs,
  wait,
} from '@/lib/haptics';

export function usePushHome() {
  const db = useSQLiteContext();
  const repository = useMemo(() => new SQLitePushDayRepository(db), [db]);
  const [todayKey, setTodayKey] = useState<DayKey>(() => toDayKey(new Date()));
  const [records, setRecords] = useState<PushDayRecord[]>([]);
  const recordsRef = useRef<PushDayRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [highlightedRepIndex, setHighlightedRepIndex] = useState<number | null>(null);
  const [activeAddAmount, setActiveAddAmount] = useState<number | null>(null);
  const [addPulseKey, setAddPulseKey] = useState(0);

  useEffect(() => {
    recordsRef.current = records;
  }, [records]);

  const loadHistory = useCallback(async (dayKey: DayKey = todayKey) => {
    try {
      const history = await repository.getHistoryThrough(dayKey);
      setError(null);
      recordsRef.current = history;
      setRecords(history);
    } catch (loadError) {
      setError(messageForError(loadError));
    } finally {
      setIsLoading(false);
    }
  }, [repository, todayKey]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      void loadHistory();
    }, 0);

    return () => clearTimeout(timeout);
  }, [loadHistory]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState !== 'active' || isAdding) return;

      const nextTodayKey = toDayKey(new Date());
      setTodayKey(nextTodayKey);
      void loadHistory(nextTodayKey);
    });

    return () => subscription.remove();
  }, [isAdding, loadHistory]);

  const addPushUps = useCallback(async (amount: number) => {
    if (isAdding) return;
    if (!Number.isSafeInteger(amount) || amount < MIN_ADD_AMOUNT || amount > MAX_ADD_AMOUNT) {
      setError(`Enter an amount from ${MIN_ADD_AMOUNT} to ${MAX_ADD_AMOUNT}.`);
      return;
    }

    setIsAdding(true);
    setError(null);
    setActiveAddAmount(amount);
    setAddPulseKey((key) => key + 1);

    const baseline = recordsRef.current;
    const baselineTodayReps = repsForDay(baseline, todayKey);
    let committed: PushDayRecord[] | null = null;

    try {
      committed = await repository.addReps(todayKey, amount);
      const committedToday = committed.find((record) => record.dayKey === todayKey);
      const todayColorIndex = committedToday?.colorIndex ?? 0;
      const cadence = repCadenceMs(amount);

      for (let index = 0; index < amount; index += 1) {
        const displayedReps = baselineTodayReps + index + 1;
        const nextRecords = replaceToday(
          baseline,
          todayKey,
          displayedReps,
          todayColorIndex,
        );
        recordsRef.current = nextRecords;
        setRecords(nextRecords);
        setHighlightedRepIndex(displayedReps - 1);
        await safelyPlay(() => playRepHaptic(index, amount));

        if (cadence > 0 && index < amount - 1) {
          await wait(cadence);
        }
      }

      recordsRef.current = committed;
      setRecords(committed);
      await safelyPlay(() => playCompletionHaptic(amount));
      await wait(320);
    } catch (addError) {
      if (committed) {
        recordsRef.current = committed;
        setRecords(committed);
      } else {
        setError(messageForError(addError));
      }
    } finally {
      setHighlightedRepIndex(null);
      setActiveAddAmount(null);
      setIsAdding(false);
    }
  }, [isAdding, repository, todayKey]);

  const visibleWeek = useMemo(
    () => buildVisibleWeek(records, todayKey),
    [records, todayKey],
  );
  const stats = useMemo(
    () => calculateStats(records, todayKey),
    [records, todayKey],
  );
  const todayReps = repsForDay(records, todayKey);
  const yesterdayReps = repsForDay(records, addDays(todayKey, -1));

  return {
    visibleWeek,
    stats,
    todayReps,
    motivation: motivationText(todayReps, yesterdayReps, stats.bestDay),
    isLoading,
    isAdding,
    error,
    highlightedRepIndex,
    activeAddAmount,
    addPulseKey,
    addPushUps,
    retry: loadHistory,
    clearError: () => setError(null),
  };
}

function repsForDay(records: readonly PushDayRecord[], dayKey: DayKey): number {
  return records.find((record) => record.dayKey === dayKey)?.reps ?? 0;
}

function replaceToday(
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

async function safelyPlay(action: () => Promise<void>): Promise<void> {
  try {
    await action();
  } catch {
    // Haptic availability must never prevent a persisted workout update.
  }
}

function messageForError(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return 'Push could not access its local history. Please try again.';
}
