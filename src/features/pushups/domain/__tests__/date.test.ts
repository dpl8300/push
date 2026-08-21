import { addDays, dayKeysBetween, daysBetween, fromDayKey, toDayKey } from '../date';
import type { DayKey } from '../types';

describe('local calendar helpers', () => {
  it('round-trips a local day without UTC conversion', () => {
    const key = '2026-08-20' as DayKey;
    expect(toDayKey(fromDayKey(key))).toBe(key);
  });

  it('moves across leap day and year boundaries', () => {
    expect(addDays('2028-02-28' as DayKey, 1)).toBe('2028-02-29');
    expect(addDays('2026-12-31' as DayKey, 1)).toBe('2027-01-01');
  });

  it('counts calendar days in both directions', () => {
    expect(daysBetween('2026-03-07' as DayKey, '2026-03-10' as DayKey)).toBe(3);
    expect(daysBetween('2026-03-10' as DayKey, '2026-03-07' as DayKey)).toBe(-3);
  });

  it('creates an inclusive calendar range', () => {
    expect(dayKeysBetween('2026-08-18' as DayKey, '2026-08-20' as DayKey)).toEqual([
      '2026-08-18',
      '2026-08-19',
      '2026-08-20',
    ]);
  });
});

