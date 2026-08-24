import { LinearGradient } from 'expo-linear-gradient';
import { memo, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import Animated, {
  Easing,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

import {
  BOTTOM_LABEL_HEIGHT,
  SQUARE_GAP,
  calculateGraphMetrics,
} from './push-history-graph-metrics';

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

const SQUARE_RESIZE_DURATION = 150;

export function PushHistoryGraph({
  days,
  highlightedRepIndex,
  activeAddAmount,
  addPulseKey,
}: PushHistoryGraphProps) {
  const [size, setSize] = useState<Size>({ width: 0, height: 0 });
  const metrics = useMemo(() => calculateGraphMetrics(days, size), [days, size]);
  const targetSquareSize = metrics?.squareSize ?? null;
  const displayedSquareSize = useSharedValue(0);
  const hasInitialSquareSize = useRef(false);

  useLayoutEffect(() => {
    if (targetSquareSize === null) return;

    if (!hasInitialSquareSize.current) {
      displayedSquareSize.value = targetSquareSize;
      hasInitialSquareSize.current = true;
      return;
    }

    displayedSquareSize.value = withTiming(targetSquareSize, {
      duration: SQUARE_RESIZE_DURATION,
      easing: Easing.out(Easing.cubic),
    });
  }, [displayedSquareSize, targetSquareSize]);

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
              squareSize={displayedSquareSize}
              targetSquareSize={metrics.squareSize}
              glowHeight={metrics.safeTowerHeight}
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
  squareSize: SharedValue<number>;
  targetSquareSize: number;
  glowHeight: number;
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
  targetSquareSize,
  glowHeight,
  chartHeight,
  highlightedRepIndex,
  activeAddAmount,
  addPulseKey,
}: DayColumnProps) {
  const repIndices = useMemo(
    () => Array.from({ length: day.reps }, (_, index) => index),
    [day.reps],
  );
  const rowCount = Math.ceil(day.reps / 3);
  const displayedRowCount = useSharedValue(rowCount);

  useEffect(() => {
    displayedRowCount.value = withTiming(rowCount, {
      duration: SQUARE_RESIZE_DURATION,
      easing: Easing.out(Easing.cubic),
    });
  }, [displayedRowCount, rowCount]);

  const badgeStyle = useAnimatedStyle(() => ({
    bottom: displayedRowCount.value * (squareSize.value + SQUARE_GAP) + 13,
  }));

  return (
    <View
      style={[
        styles.dayColumn,
        {
          left,
          width: slotWidth,
          height: chartHeight + BOTTOM_LABEL_HEIGHT,
        },
      ]}
    >
      <View
        style={[styles.towerArea, { height: chartHeight, width: slotWidth }]}
      >
        {activeAddAmount ? (
          <ColumnGlow
            key={addPulseKey}
            amount={activeAddAmount}
            width={Math.max(74, targetSquareSize * 5.2)}
            height={glowHeight}
          />
        ) : null}

        <View
          style={[styles.squareStack, { height: chartHeight, width: slotWidth }]}
        >
          {repIndices.map((repIndex) => (
            <RepSquare
              key={repIndex}
              repIndex={repIndex}
              squareSize={squareSize}
              slotWidth={slotWidth}
              color={WeekColors[day.colorIndex % WeekColors.length] ?? Colors.yellow}
              isToday={day.isToday}
              isHighlighted={highlightedRepIndex === repIndex}
            />
          ))}
        </View>

        {day.isToday ? (
          <Animated.View style={[styles.todayBadge, badgeStyle]}>
            <Text style={styles.todayBadgeText}>{day.reps}</Text>
          </Animated.View>
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
  squareSize: SharedValue<number>;
  slotWidth: number;
  color: string;
  isToday: boolean;
  isHighlighted: boolean;
};

const RepSquare = memo(function RepSquare({
  repIndex,
  squareSize,
  slotWidth,
  color,
  isToday,
  isHighlighted,
}: RepSquareProps) {
  const rowIndex = Math.floor(repIndex / 3);
  const positionInRow = repIndex % 3;
  const column = [1, 0, 2][positionInRow] ?? 0;
  const translateY = useSharedValue(isHighlighted ? -6 : 0);

  useEffect(() => {
    const settle = {
      damping: 24,
      stiffness: 460,
      mass: 1.2,
    };

    if (isHighlighted) {
      const impact = {
        damping: 22,
        stiffness: 620,
        mass: 1.25,
        overshootClamping: true,
      };

      translateY.value = withSequence(
        withSpring(1.25, impact),
        withSpring(0, settle),
      );
      return;
    }

    translateY.value = withSpring(0, settle);
  }, [isHighlighted, translateY]);

  const animatedStyle = useAnimatedStyle(() => {
    const size = squareSize.value;
    const towerWidth = size * 3 + SQUARE_GAP * 2;

    return {
      left: (slotWidth - towerWidth) / 2 + column * (size + SQUARE_GAP),
      bottom: rowIndex * (size + SQUARE_GAP),
      width: size,
      height: size,
      transform: [{ translateY: translateY.value }],
    };
  }, [column, rowIndex, slotWidth]);

  return (
    <Animated.View style={[styles.repSquarePosition, animatedStyle]}>
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
});

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
    borderColor: 'rgba(255,255,255,0.95)',
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
    color: Colors.white,
    fontSize: 13,
    fontWeight: '900',
  },
  todayWeekday: {
    color: Colors.black,
  },
});
