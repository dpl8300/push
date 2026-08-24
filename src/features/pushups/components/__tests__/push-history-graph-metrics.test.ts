import {
  calculateGraphMetrics,
  towerHeightForRows,
} from '../push-history-graph-metrics';

import type { DayKey, PushDay } from '@/features/pushups/domain/types';

const GRAPH_SIZE = { width: 700, height: 257 };

describe('push history graph headroom', () => {
  it('keeps the baseline box size while a short column already has sufficient headroom', () => {
    const shorter = calculateGraphMetrics(daysWithTallestReps(60), GRAPH_SIZE);
    const nearBoundary = calculateGraphMetrics(daysWithTallestReps(75), GRAPH_SIZE);

    expect(shorter).not.toBeNull();
    expect(nearBoundary).not.toBeNull();
    expect(shorter?.squareSize).toBeCloseTo(nearBoundary?.squareSize ?? 0);
  });

  it('keeps every completed row below the 15 percent top boundary', () => {
    for (let reps = 78; reps <= 103; reps += 1) {
      const metrics = calculateGraphMetrics(daysWithTallestReps(reps), GRAPH_SIZE);
      expect(metrics).not.toBeNull();
      if (!metrics) continue;

      expect(towerHeightForRows(metrics.visibleRows, metrics.squareSize))
        .toBeLessThanOrEqual(metrics.safeTowerHeight + 0.001);
    }
  });

  it('preserves the boundary for a maximum custom addition from a typical baseline', () => {
    const metrics = calculateGraphMetrics(daysWithTallestReps(75 + 250), GRAPH_SIZE);
    expect(metrics).not.toBeNull();
    if (!metrics) return;

    expect(towerHeightForRows(metrics.visibleRows, metrics.squareSize))
      .toBeLessThanOrEqual(metrics.safeTowerHeight + 0.001);
  });

  it('scales in small monotonic steps only when a new row begins', () => {
    const sizes = Array.from({ length: 26 }, (_, index) => {
      const reps = 78 + index;
      const metrics = calculateGraphMetrics(daysWithTallestReps(reps), GRAPH_SIZE);
      if (!metrics) throw new Error('Expected graph metrics');
      return metrics.squareSize;
    });

    for (let index = 1; index < sizes.length; index += 1) {
      const previous = sizes[index - 1] ?? 0;
      const current = sizes[index] ?? 0;
      expect(current).toBeLessThanOrEqual(previous);
      expect(previous - current).toBeLessThan(0.3);
    }

    expect(sizes[1]).toBe(sizes[2]);
    expect(sizes[2]).toBe(sizes[3]);
  });
});

function daysWithTallestReps(reps: number): PushDay[] {
  return Array.from({ length: 7 }, (_, index) => {
    const dayKey = `2026-08-${17 + index}` as DayKey;
    return {
      id: dayKey,
      dayKey,
      weekday: 'M',
      reps: index === 6 ? reps : 0,
      colorIndex: index,
      isToday: index === 6,
    };
  });
}
