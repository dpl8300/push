import { act, renderHook, waitFor } from '@testing-library/react-native';
import { AppState } from 'react-native';
import type { AppStateStatus } from 'react-native';

import type { PushDayRepository } from '@/features/pushups/data/push-day-repository';
import { toDayKey } from '@/features/pushups/domain/date';
import type { DayKey, PushDayRecord } from '@/features/pushups/domain/types';

const mockRepository: jest.Mocked<PushDayRepository> = {
  getHistoryThrough: jest.fn(),
  addReps: jest.fn(),
  adjustReps: jest.fn(),
};
let mockIsFocused = true;
let mockAppStateChange: ((state: AppStateStatus) => void) | null = null;

jest.mock('expo-router', () => {
  const React = jest.requireActual('react');
  return {
    useFocusEffect: (callback: () => void | (() => void)) => React.useEffect(callback, [callback]),
    useIsFocused: () => mockIsFocused,
  };
});

jest.mock('expo-sqlite', () => ({
  useSQLiteContext: () => ({}),
}));

jest.mock('@/features/pushups/data/push-day-repository', () => ({
  SQLitePushDayRepository: jest.fn(() => mockRepository),
}));

// The hook import must follow the repository mock so its constructor receives the test double.
// eslint-disable-next-line import/first, import/order
import { usePushProgress } from '../usePushProgress';

const todayKey = toDayKey(new Date()) as DayKey;
const baseline: PushDayRecord[] = [{ dayKey: todayKey, reps: 4, colorIndex: 0 }];

describe('usePushProgress', () => {
  const addAppStateListener = jest.spyOn(AppState, 'addEventListener');

  beforeEach(() => {
    mockIsFocused = true;
    mockAppStateChange = null;
    addAppStateListener.mockImplementation((_type, listener) => {
      mockAppStateChange = listener;
      return { remove: jest.fn() };
    });
    mockRepository.getHistoryThrough.mockReset().mockResolvedValue(baseline);
    mockRepository.adjustReps.mockReset();
  });

  afterAll(() => {
    addAppStateListener.mockRestore();
  });

  it('loads the current month with today selected', async () => {
    const { result } = await renderHook(() => usePushProgress());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.selectedDayKey).toBe(todayKey);
    expect(result.current.selectedReps).toBe(4);
    expect(result.current.calendarDays.find((day) => day.isSelected)?.dayKey).toBe(todayKey);
    expect(result.current.monthStats).toEqual({
      totalPushUps: 4,
      activeDays: 1,
      bestDay: 4,
    });
  });

  it('updates the selected day optimistically and reconciles persistence', async () => {
    const persistence = deferred<PushDayRecord[]>();
    mockRepository.adjustReps.mockReturnValue(persistence.promise);
    const { result } = await renderHook(() => usePushProgress());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    let adjustment!: Promise<void>;
    await act(async () => {
      adjustment = result.current.adjustSelectedDay(1);
      await Promise.resolve();
    });

    expect(result.current.selectedReps).toBe(5);
    expect(result.current.monthStats.totalPushUps).toBe(5);
    expect(result.current.isAdjusting).toBe(true);

    await act(async () => {
      persistence.resolve([{ dayKey: todayKey, reps: 5, colorIndex: 0 }]);
      await adjustment;
    });

    expect(result.current.selectedReps).toBe(5);
    expect(result.current.isAdjusting).toBe(false);
  });

  it('rolls an optimistic edit back when persistence fails', async () => {
    mockRepository.adjustReps.mockRejectedValue(new Error('Database unavailable'));
    const { result } = await renderHook(() => usePushProgress());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.adjustSelectedDay(-1);
    });

    expect(result.current.selectedReps).toBe(4);
    expect(result.current.error).toBe('Push could not access its local history. Please try again.');
  });

  it('does not refresh an unfocused Progress screen when the app resumes', async () => {
    mockIsFocused = false;
    const { result } = await renderHook(() => usePushProgress());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    mockRepository.getHistoryThrough.mockClear();

    await act(async () => {
      mockAppStateChange?.('active');
      await Promise.resolve();
    });

    expect(mockRepository.getHistoryThrough).not.toHaveBeenCalled();
  });

  it('coalesces an app-resume refresh with a refresh already in flight', async () => {
    const history = deferred<PushDayRecord[]>();
    mockRepository.getHistoryThrough.mockReturnValue(history.promise);
    const { result } = await renderHook(() => usePushProgress());
    await waitFor(() => expect(mockRepository.getHistoryThrough).toHaveBeenCalledTimes(1));

    await act(async () => {
      mockAppStateChange?.('active');
      await Promise.resolve();
    });

    expect(mockRepository.getHistoryThrough).toHaveBeenCalledTimes(1);

    await act(async () => {
      history.resolve(baseline);
      await history.promise;
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
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
