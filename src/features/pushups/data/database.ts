import type { SQLiteDatabase } from 'expo-sqlite';

const DATABASE_VERSION = 1;

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
      PRAGMA user_version = 1;
    `);
  }
}

