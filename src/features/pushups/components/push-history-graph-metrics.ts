import type { PushDay } from '@/features/pushups/domain/types';

export type GraphSize = { width: number; height: number };

export const AXIS_WIDTH = 34;
export const BOTTOM_LABEL_HEIGHT = 34;
export const SQUARE_GAP = 0.7;
export const TOP_HEADROOM_RATIO = 0.15;

const BASELINE_ROW_CAPACITY = 30;
const PREVIOUS_MAX_SQUARE_SIZE = 13.9;
const MAX_SQUARE_SIZE = 16.5;
const COLUMN_GAP_RATIO = 0.5;

export function calculateGraphMetrics(days: readonly PushDay[], size: GraphSize) {
  if (size.width <= 0 || size.height <= 0) return null;

  const visibleMax = Math.max(...days.map((day) => day.reps), 1);
  const visibleRows = Math.max(1, Math.ceil(visibleMax / 3));
  const rawStep = visibleMax / 4;
  const step = Math.max(10, Math.ceil(rawStep / 5) * 5);
  const axisMax = step * 4;
  const axisValues = [axisMax, axisMax - step, axisMax - step * 2, step, 0];
  const chartHeight = Math.max(1, size.height - BOTTOM_LABEL_HEIGHT);
  const safeTowerHeight = chartHeight * (1 - TOP_HEADROOM_RATIO);
  const slotWidth = (size.width - AXIS_WIDTH) / Math.max(days.length, 1);
  const previousTowerWidth = PREVIOUS_MAX_SQUARE_SIZE * 3 + SQUARE_GAP * 2;
  const previousColumnGap = Math.max(0, slotWidth - previousTowerWidth);
  const targetTowerWidth = slotWidth - previousColumnGap * COLUMN_GAP_RATIO;
  const horizontalSquareSize = (targetTowerWidth - SQUARE_GAP * 2) / 3;
  const baselineSquareSize = (
    chartHeight - (BASELINE_ROW_CAPACITY - 1) * SQUARE_GAP
  ) / BASELINE_ROW_CAPACITY;
  const headroomSquareSize = (
    safeTowerHeight - (visibleRows - 1) * SQUARE_GAP
  ) / visibleRows;
  const squareSize = Math.max(
    0.5,
    Math.min(
      MAX_SQUARE_SIZE,
      horizontalSquareSize,
      baselineSquareSize,
      headroomSquareSize,
    ),
  );

  return {
    axisWidth: AXIS_WIDTH,
    axisMax,
    axisValues,
    chartHeight,
    safeTowerHeight,
    squareSize,
    slotWidth,
    visibleRows,
  };
}

export function towerHeightForRows(rows: number, squareSize: number): number {
  if (rows <= 0) return 0;
  return rows * squareSize + (rows - 1) * SQUARE_GAP;
}
