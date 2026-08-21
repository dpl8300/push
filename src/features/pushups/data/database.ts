import type { SQLiteDatabase } from 'expo-sqlite';

import { addDays, toDayKey } from '@/features/pushups/domain/date';

const DATABASE_VERSION = 2;
const DEVELOPMENT_REPS = [27, 48, 0, 72, 54, 66, 0] as const;

export async function migrateDatabase(db: SQLiteDatabase): Promise<void> {
  await db.execAsync('PRAGMA journal_mode = WAL;');

  const versionRow = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const currentVersion = versionRow?.user_version ?? 0;

  if (currentVersion > DATABASE_VERSION) {
    throw new Error(`Push database version ${currentVersion} is newer than this app supports.`);
  }

  if (currentVersion === 0) {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS push_day_records (
        day_key TEXT PRIMARY KEY NOT NULL,
        reps INTEGER NOT NULL DEFAULT 0 CHECK (reps >= 0),
        color_index INTEGER NOT NULL CHECK (color_index >= 0)
      );
      CREATE INDEX IF NOT EXISTS idx_push_day_records_day_key
        ON push_day_records(day_key);
    `);
  }

  if (currentVersion < 2) {
    await db.execAsync('PRAGMA user_version = 2;');
  }

  if (__DEV__) {
    await seedDevelopmentHistory(db);
  }
}

async function seedDevelopmentHistory(db: SQLiteDatabase): Promise<void> {
  const todayKey = toDayKey(new Date());

  await db.withExclusiveTransactionAsync(async (transaction) => {
    await transaction.runAsync('DELETE FROM push_day_records');

    for (const [index, reps] of DEVELOPMENT_REPS.entries()) {
      const dayKey = addDays(todayKey, index - (DEVELOPMENT_REPS.length - 1));
      await transaction.runAsync(
        `INSERT INTO push_day_records (day_key, reps, color_index)
         VALUES (?, ?, ?)`,
        dayKey,
        reps,
        index,
      );
    }
  });
}
