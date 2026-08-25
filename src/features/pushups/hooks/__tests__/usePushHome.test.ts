import { act, renderHook, waitFor } from '@testing-library/react-native';

import type { PushDayRepository } from '@/features/pushups/data/push-day-repository';
import { toDayKey } from '@/features/pushups/domain/date';
import type { DayKey, PushDayRecord } from '@/features/pushups/domain/types';

const mockRepository: jest.Mocked<PushDayRepository> = {
  getHistoryThrough: jest.fn(),
  addReps: jest.fn(),
  adjustReps: jest.fn(),
};

jest.mock('expo-router', () => {
  const React = jest.requireActual('react');
  return {
    useFocusEffect: (callback: () => void | (() => void)) => React.useEffect(callback, [callback]),
    useIsFocused: () => true,
  };
});

jest.mock('expo-sqlite', () => ({
  useSQLiteContext: () => ({}),
}));

jest.mock('@/features/pushups/data/push-day-repository', () => ({
  SQLitePushDayRepository: jest.fn(() => mockRepository),
}));

jest.mock('@/lib/haptics', () => ({
  playCompletionHaptic: jest.fn().mockResolvedValue(undefined),
  playRepHaptic: jest.fn().mockResolvedValue(undefined),
  repCadenceMs: jest.fn(() => 0),
  wait: jest.fn().mockResolvedValue(undefined),
}));

// The hook import must follow the repository mock so its constructor receives the test double.
// eslint-disable-next-line import/first, import/order
import { usePushHome } from '../usePushHome';

const mockWait = jest.requireMock('@/lib/haptics').wait as jest.Mock;
const todayKey = toDayKey(new Date()) as DayKey;
const baseline: PushDayRecord[] = [{ dayKey: todayKey, reps: 0, colorIndex: 0 }];

describe('usePushHome optimistic additions', () => {
  beforeEach(() => {
    mockRepository.getHistoryThrough.mockReset().mockResolvedValue(baseline);
    mockRepository.addReps.mockReset();
    mockWait.mockClear();
  });

  it('shows the first rep before delayed persistence resolves and reconciles without doubling', async () => {
    const persistence = deferred<PushDayRecord[]>();
    mockRepository.addReps.mockReturnValue(persistence.promise);
    const { result } = await renderHook(() => usePushHome());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    let addition!: Promise<void>;
    await act(async () => {
      addition = result.current.addPushUps(1);
      await Promise.resolve();
    });

    expect(result.current.todayReps).toBe(1);
    expect(result.current.highlightedRepIndex).toBe(0);
    expect(result.current.isAdding).toBe(true);
    expect(mockWait).not.toHaveBeenCalled();

    await act(async () => {
      persistence.resolve([{ dayKey: todayKey, reps: 1, colorIndex: 0 }]);
      await addition;
    });

    expect(result.current.todayReps).toBe(1);
    expect(result.current.highlightedRepIndex).toBeNull();
    expect(result.current.isAdding).toBe(false);
  });

  it('rolls optimistic reps back when persistence fails', async () => {
    const persistence = deferred<PushDayRecord[]>();
    mockRepository.addReps.mockReturnValue(persistence.promise);
    const { result } = await renderHook(() => usePushHome());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    let addition!: Promise<void>;
    await act(async () => {
      addition = result.current.addPushUps(1);
      await Promise.resolve();
    });

    expect(result.current.todayReps).toBe(1);

    await act(async () => {
      persistence.reject(new Error('Database unavailable'));
      await addition;
    });

    expect(result.current.todayReps).toBe(0);
    expect(result.current.highlightedRepIndex).toBeNull();
    expect(result.current.isAdding).toBe(false);
    expect(result.current.error).toBe('Push could not access its local history. Please try again.');
  });
});

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });

  return { promise, resolve, reject };
}
