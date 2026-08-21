import type { SQLiteDatabase } from 'expo-sqlite';

import { migrateDatabase } from '../database';

describe('database migration', () => {
  it('resets the graph to seven development days', async () => {
    const runAsync = jest.fn().mockResolvedValue(undefined);
    const db = {
      execAsync: jest.fn().mockResolvedValue(undefined),
      getFirstAsync: jest.fn().mockResolvedValue({ user_version: 1 }),
      withExclusiveTransactionAsync: jest.fn(async (action) => action({ runAsync })),
    } as unknown as SQLiteDatabase;

    await migrateDatabase(db);

    expect(runAsync).toHaveBeenCalledTimes(8);
    expect(runAsync).toHaveBeenNthCalledWith(1, 'DELETE FROM push_day_records');
    expect(runAsync.mock.calls.slice(1).map((call) => call[2])).toEqual([27, 48, 0, 72, 54, 66, 0]);
    expect(db.execAsync).toHaveBeenLastCalledWith('PRAGMA user_version = 2;');
  });

  it('resets development data again after version 2 is installed', async () => {
    const runAsync = jest.fn().mockResolvedValue(undefined);
    const db = {
      execAsync: jest.fn().mockResolvedValue(undefined),
      getFirstAsync: jest.fn().mockResolvedValue({ user_version: 2 }),
      withExclusiveTransactionAsync: jest.fn(async (action) => action({ runAsync })),
    } as unknown as SQLiteDatabase;

    await migrateDatabase(db);

    expect(runAsync).toHaveBeenCalledTimes(8);
    expect(db.execAsync).toHaveBeenCalledTimes(1);
  });
});
