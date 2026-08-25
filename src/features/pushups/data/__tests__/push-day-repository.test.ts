import type { SQLiteDatabase } from 'expo-sqlite';

import type { DayKey } from '../../domain/types';
import { SQLitePushDayRepository } from '../push-day-repository';

describe('SQLitePushDayRepository.adjustReps', () => {
  it('updates an existing day and refreshes history through today', async () => {
    const transaction = {
      getFirstAsync: jest.fn().mockResolvedValue({
        day_key: '2026-08-20',
        reps: 4,
        color_index: 2,
      }),
      runAsync: jest.fn().mockResolvedValue(undefined),
    };
    const db = databaseMock(transaction, [{
      day_key: '2026-08-20',
      reps: 5,
      color_index: 2,
    }]);
    const repository = new SQLitePushDayRepository(db);

    const history = await repository.adjustReps(
      '2026-08-20' as DayKey,
      1,
      '2026-08-20' as DayKey,
    );

    expect(transaction.runAsync).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE push_day_records'),
      5,
      '2026-08-20',
    );
    expect(db.getAllAsync).toHaveBeenCalledWith(
      expect.stringContaining('WHERE day_key <= ?'),
      '2026-08-20',
    );
    expect(history).toEqual([{ dayKey: '2026-08-20', reps: 5, colorIndex: 2 }]);
  });

  it('does not decrement an empty day below zero', async () => {
    const transaction = {
      getFirstAsync: jest.fn().mockResolvedValue({
        day_key: '2026-08-20',
        reps: 0,
        color_index: 2,
      }),
      runAsync: jest.fn().mockResolvedValue(undefined),
    };
    const db = databaseMock(transaction, []);
    const repository = new SQLitePushDayRepository(db);

    await repository.adjustReps(
      '2026-08-20' as DayKey,
      -1,
      '2026-08-20' as DayKey,
    );

    expect(transaction.runAsync).not.toHaveBeenCalledWith(
      expect.stringContaining('UPDATE push_day_records'),
      expect.anything(),
      expect.anything(),
    );
  });

  it('creates an older active day using the established color sequence', async () => {
    const transaction = {
      getFirstAsync: jest.fn()
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({
          day_key: '2026-08-20',
          reps: 5,
          color_index: 2,
        }),
      runAsync: jest.fn().mockResolvedValue(undefined),
    };
    const db = databaseMock(transaction, [{
      day_key: '2026-08-19',
      reps: 1,
      color_index: 1,
    }, {
      day_key: '2026-08-20',
      reps: 5,
      color_index: 2,
    }]);
    const repository = new SQLitePushDayRepository(db);

    await repository.adjustReps(
      '2026-08-19' as DayKey,
      1,
      '2026-08-20' as DayKey,
    );

    expect(transaction.runAsync).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO push_day_records'),
      '2026-08-19',
      1,
    );
  });

  it('rejects unsupported deltas and future dates', async () => {
    const transaction = {
      getFirstAsync: jest.fn(),
      runAsync: jest.fn(),
    };
    const repository = new SQLitePushDayRepository(databaseMock(transaction, []));

    await expect(repository.adjustReps(
      '2026-08-20' as DayKey,
      2 as 1,
      '2026-08-20' as DayKey,
    )).rejects.toThrow('either -1 or 1');
    await expect(repository.adjustReps(
      '2026-08-21' as DayKey,
      1,
      '2026-08-20' as DayKey,
    )).rejects.toThrow('Future push-up totals');
  });
});

function databaseMock(
  transaction: { getFirstAsync: jest.Mock; runAsync: jest.Mock },
  rows: { day_key: string; reps: number; color_index: number }[],
) {
  return {
    getAllAsync: jest.fn().mockResolvedValue(rows),
    withExclusiveTransactionAsync: jest.fn(async (action) => action(transaction)),
  } as unknown as SQLiteDatabase;
}
