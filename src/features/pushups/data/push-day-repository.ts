import type { SQLiteDatabase } from 'expo-sqlite';

import { WeekColors } from '@/design-system/tokens';
import { daysBetween } from '@/features/pushups/domain/date';
import { fillRecordGaps, positiveModulo } from '@/features/pushups/domain/history';
import type { DayKey, PushDayRecord } from '@/features/pushups/domain/types';

type PushDayRow = {
  day_key: string;
  reps: number;
  color_index: number;
};

export interface PushDayRepository {
  getHistoryThrough(todayKey: DayKey): Promise<PushDayRecord[]>;
  addReps(dayKey: DayKey, amount: number): Promise<PushDayRecord[]>;
}

export class SQLitePushDayRepository implements PushDayRepository {
  constructor(private readonly db: SQLiteDatabase) {}

  async getHistoryThrough(todayKey: DayKey): Promise<PushDayRecord[]> {
    const rawRecords = await this.readRecordsThrough(todayKey);
    const normalized = fillRecordGaps(rawRecords, todayKey);

    if (normalized.length === 0) return [];

    await this.db.withExclusiveTransactionAsync(async (transaction) => {
      for (const record of normalized) {
        await transaction.runAsync(
          `INSERT OR IGNORE INTO push_day_records (day_key, reps, color_index)
           VALUES (?, ?, ?)`,
          record.dayKey,
          record.reps,
          record.colorIndex,
        );
      }
    });

    return normalized;
  }

  async addReps(dayKey: DayKey, amount: number): Promise<PushDayRecord[]> {
    if (!Number.isSafeInteger(amount) || amount <= 0) {
      throw new Error('Push-up amount must be a positive integer.');
    }

    const firstRow = await this.db.getFirstAsync<PushDayRow>(
      `SELECT day_key, reps, color_index
       FROM push_day_records
       ORDER BY day_key ASC
       LIMIT 1`,
    );
    const colorIndex = firstRow
      ? positiveModulo(
        firstRow.color_index + daysBetween(firstRow.day_key as DayKey, dayKey),
        WeekColors.length,
      )
      : 0;

    await this.db.withExclusiveTransactionAsync(async (transaction) => {
      await transaction.runAsync(
        `INSERT INTO push_day_records (day_key, reps, color_index)
         VALUES (?, ?, ?)
         ON CONFLICT(day_key) DO UPDATE SET reps = reps + excluded.reps`,
        dayKey,
        amount,
        colorIndex,
      );
    });

    return this.getHistoryThrough(dayKey);
  }

  private async readRecordsThrough(todayKey: DayKey): Promise<PushDayRecord[]> {
    const rows = await this.db.getAllAsync<PushDayRow>(
      `SELECT day_key, reps, color_index
       FROM push_day_records
       WHERE day_key <= ?
       ORDER BY day_key ASC`,
      todayKey,
    );

    return rows.map((row) => ({
      dayKey: row.day_key as DayKey,
      reps: row.reps,
      colorIndex: row.color_index,
    }));
  }
}

