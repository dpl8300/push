import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

import { Colors, WeekColors } from '@/design-system/tokens';
import { Typography } from '@/design-system/typography';
import type { PushDay } from '@/features/pushups/domain/types';

type PushHistoryGraphProps = {
  days: readonly PushDay[];
  highlightedRepIndex: number | null;
  activeAddAmount: number | null;
  addPulseKey: number;
};

type Size = { width: number; height: number };

const AXIS_WIDTH = 34;
const BOTTOM_LABEL_HEIGHT = 34;
const SQUARE_GAP = 0.7;

export function PushHistoryGraph({
  days,
  highlightedRepIndex,
  activeAddAmount,
  addPulseKey,
}: PushHistoryGraphProps) {
  const [size, setSize] = useState<Size>({ width: 0, height: 0 });
  const metrics = useMemo(() => calculateMetrics(days, size), [days, size]);

  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setSize({ width, height });
  };

  return (
    <View style={styles.container} onLayout={onLayout}>
      {metrics ? (
        <>
          {metrics.axisValues.map((value) => {
            const y = metrics.chartHeight - (value / metrics.axisMax) * metrics.chartHeight;
            return (
              <View key={value} style={[styles.gridRow, { top: y - 8 }]}>
                <Text style={[styles.axisLabel, value === 0 && styles.zeroAxisLabel]}>{value}</Text>
                <View style={[styles.gridLine, value === 0 && styles.zeroGridLine]} />
              </View>
            );
          })}

          {days.map((day, index) => (
            <DayColumn
              key={day.id}
              day={day}
              left={metrics.axisWidth + metrics.slotWidth * index}
              slotWidth={metrics.slotWidth}
              squareSize={metrics.squareSize}
              stackHeight={metrics.stackHeight}
              chartHeight={metrics.chartHeight}
              highlightedRepIndex={day.isToday ? highlightedRepIndex : null}
              activeAddAmount={day.isToday ? activeAddAmount : null}
              addPulseKey={addPulseKey}
            />
          ))}
        </>
      ) : null}
    </View>
  );
}

type DayColumnProps = {
  day: PushDay;
  left: number;
  slotWidth: number;
  squareSize: number;
  stackHeight: number;
  chartHeight: number;
  highlightedRepIndex: number | null;
  activeAddAmount: number | null;
  addPulseKey: number;
};

function DayColumn({
  day,
  left,
  slotWidth,
  squareSize,
  stackHeight,
  chartHeight,
  highlightedRepIndex,
  activeAddAmount,
  addPulseKey,
}: DayColumnProps) {
  const towerWidth = Math.max(28, squareSize * 3 + SQUARE_GAP * 2);
  const repIndices = useMemo(
    () => Array.from({ length: day.reps }, (_, index) => index),
    [day.reps],
  );
  const rowCount = Math.ceil(day.reps / 3);

  return (
    <View
      style={[
        styles.dayColumn,
        {
          left,
          width: slotWidth,
          height: chartHeight + BOTTOM_LABEL_HEIGHT,
          opacity: day.reps === 0 ? 0.38 : 1,
        },
      ]}
    >
      <View style={[styles.towerArea, { height: chartHeight, width: towerWidth }]}>
        {activeAddAmount ? (
          <ColumnGlow
            key={addPulseKey}
            amount={activeAddAmount}
            width={Math.max(74, squareSize * 5.2)}
            height={stackHeight}
          />
        ) : null}

        <View style={[styles.squareStack, { height: stackHeight, width: towerWidth }]}>
          {repIndices.map((repIndex) => (
            <RepSquare
              key={repIndex}
              repIndex={repIndex}
              squareSize={squareSize}
              color={WeekColors[day.colorIndex % WeekColors.length] ?? Colors.yellow}
              isToday={day.isToday}
              isHighlighted={highlightedRepIndex === repIndex}
            />
          ))}
        </View>

        {day.isToday ? (
          <View
            style={[
              styles.todayBadge,
              { bottom: rowCount * (squareSize + SQUARE_GAP) + 13 },
            ]}
          >
            <Text style={styles.todayBadgeText}>{day.reps}</Text>
          </View>
        ) : null}
      </View>

      <View style={[styles.weekdayCircle, day.isToday && styles.todayCircle]}>
        <Text style={[styles.weekday, day.isToday && styles.todayWeekday]}>{day.weekday}</Text>
      </View>
    </View>
  );
}

type RepSquareProps = {
  repIndex: number;
  squareSize: number;
  color: string;
  isToday: boolean;
  isHighlighted: boolean;
};

function RepSquare({ repIndex, squareSize, color, isToday, isHighlighted }: RepSquareProps) {
  const rowIndex = Math.floor(repIndex / 3);
  const positionInRow = repIndex % 3;
  const column = [1, 0, 2][positionInRow] ?? 0;
  const scale = useSharedValue(isHighlighted ? 0.2 : 1);

  useEffect(() => {
    scale.value = withSpring(isHighlighted ? 1.9 : 1, {
      damping: 12,
      stiffness: 390,
    });
  }, [isHighlighted, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  const positionStyle = {
    left: column * (squareSize + SQUARE_GAP),
    bottom: rowIndex * (squareSize + SQUARE_GAP),
    width: squareSize,
    height: squareSize,
  };

  return (
    <Animated.View style={[styles.repSquarePosition, positionStyle, animatedStyle]}>
      {isToday ? (
        <View
          style={[
            styles.todaySquare,
            isHighlighted && styles.highlightedTodaySquare,
          ]}
        />
      ) : (
        <LinearGradient
          colors={[color, `${color}AD`]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.filledSquare}
        />
      )}
    </Animated.View>
  );
}

function ColumnGlow({ amount, width, height }: { amount: number; width: number; height: number }) {
  const color = amount >= 25
    ? Colors.magenta
    : amount >= 10
      ? Colors.pink
      : amount >= 5
        ? Colors.orange
        : Colors.yellow;
  const opacity = amount >= 25 ? 0.9 : amount >= 10 ? 0.78 : amount >= 5 ? 0.66 : 0.52;
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(1, {
      duration: amount >= 25 ? 560 : 340,
      easing: Easing.out(Easing.ease),
    });
  }, [amount, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity * progress.value,
    transform: [
      { scaleX: 0.82 + progress.value * 0.18 },
      { scaleY: 0.88 + progress.value * 0.12 },
    ],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.columnGlow,
        { width, height },
        animatedStyle,
      ]}
    >
      <Svg width="100%" height="100%">
        <Defs>
          <RadialGradient id="columnGlowOuter" cx="50%" cy="50%" rx="50%" ry="50%">
            <Stop offset="0%" stopColor={color} stopOpacity={0.22} />
            <Stop offset="48%" stopColor={color} stopOpacity={0.14} />
            <Stop offset="78%" stopColor={color} stopOpacity={0.05} />
            <Stop offset="100%" stopColor={color} stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id="columnGlowCore" cx="50%" cy="50%" rx="50%" ry="50%">
            <Stop offset="0%" stopColor={color} stopOpacity={0.34} />
            <Stop offset="34%" stopColor={color} stopOpacity={0.2} />
            <Stop offset="70%" stopColor={color} stopOpacity={0.05} />
            <Stop offset="100%" stopColor={color} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect width="100%" height="100%" rx={22} fill="url(#columnGlowOuter)" />
        <Rect
          x="12%"
          y="6%"
          width="76%"
          height="88%"
          rx={16}
          fill="url(#columnGlowCore)"
        />
      </Svg>
    </Animated.View>
  );
}

function calculateMetrics(days: readonly PushDay[], size: Size) {
  if (size.width <= 0 || size.height <= 0) return null;

  const visibleMax = Math.max(...days.map((day) => day.reps), 1);
  const rawStep = visibleMax / 4;
  const step = Math.max(10, Math.ceil(rawStep / 5) * 5);
  const axisMax = step * 4;
  const axisValues = [axisMax, axisMax - step, axisMax - step * 2, step, 0];
  const towerScale = Math.max(90, ...days.map((day) => day.reps));
  const chartHeight = Math.max(1, size.height - BOTTOM_LABEL_HEIGHT);
  const maxRows = Math.max(1, Math.ceil(towerScale / 3));
  const squareSize = Math.max(
    2,
    Math.min(13.9, (chartHeight - (maxRows - 1) * SQUARE_GAP) / maxRows),
  );
  const stackHeight = maxRows * squareSize + (maxRows - 1) * SQUARE_GAP;
  const slotWidth = (size.width - AXIS_WIDTH) / Math.max(days.length, 1);

  return {
    axisWidth: AXIS_WIDTH,
    axisMax,
    axisValues,
    chartHeight,
    squareSize,
    stackHeight,
    slotWidth,
  };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  gridRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  axisLabel: {
    width: 27,
    textAlign: 'right',
    color: 'rgba(255,255,255,0.38)',
    fontSize: 13,
    fontWeight: '500',
  },
  zeroAxisLabel: {
    color: 'rgba(255,255,255,0.45)',
  },
  gridLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.035)',
  },
  zeroGridLine: {
    height: 1.2,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  dayColumn: {
    position: 'absolute',
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
  },
  towerArea: {
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  squareStack: {
    position: 'absolute',
    bottom: 0,
  },
  repSquarePosition: {
    position: 'absolute',
    zIndex: 2,
  },
  filledSquare: {
    flex: 1,
    borderRadius: 1.8,
  },
  todaySquare: {
    flex: 1,
    borderRadius: 1.8,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.72)',
  },
  highlightedTodaySquare: {
    borderWidth: 0.9,
    borderColor: 'rgba(255,255,255,0.95)',
    shadowColor: Colors.white,
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  columnGlow: {
    position: 'absolute',
    bottom: 0,
  },
  todayBadge: {
    position: 'absolute',
    minWidth: 38,
    minHeight: 26,
    paddingHorizontal: 7,
    borderRadius: 13,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.white,
    shadowOpacity: 0.26,
    shadowRadius: 8,
  },
  todayBadgeText: {
    ...Typography.tabularNumbers,
    color: Colors.black,
    fontSize: 13,
    fontWeight: '900',
  },
  weekdayCircle: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
  },
  todayCircle: {
    backgroundColor: Colors.white,
  },
  weekday: {
    color: 'rgba(255,255,255,0.52)',
    fontSize: 13,
    fontWeight: '900',
  },
  todayWeekday: {
    color: Colors.black,
  },
});
