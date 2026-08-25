import { Pressable, StyleSheet, Text, View } from 'react-native';

import { PlatformIcon } from '@/design-system/PlatformIcon';
import { Colors, WeekColors } from '@/design-system/tokens';
import { Typography } from '@/design-system/typography';
import { fromDayKey } from '@/features/pushups/domain/date';
import { PROGRESS_WEEKDAYS } from '@/features/pushups/domain/progress';
import type { DayKey, ProgressCalendarDay } from '@/features/pushups/domain/types';

type ProgressCalendarProps = {
  displayedMonthKey: DayKey;
  days: readonly ProgressCalendarDay[];
  canGoToNextMonth: boolean;
  compact: boolean;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  onSelectDay: (dayKey: DayKey) => void;
};

export function ProgressCalendar({
  displayedMonthKey,
  days,
  canGoToNextMonth,
  compact,
  onPreviousMonth,
  onNextMonth,
  onSelectDay,
}: ProgressCalendarProps) {
  const monthTitle = new Intl.DateTimeFormat(undefined, {
    month: 'long',
    year: 'numeric',
  }).format(fromDayKey(displayedMonthKey));

  return (
    <View>
      <View style={styles.monthNavigation}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Previous month"
          hitSlop={6}
          onPress={onPreviousMonth}
          style={({ pressed }) => [styles.monthButton, pressed && styles.monthButtonPressed]}
        >
          <PlatformIcon
            ios="chevron.left"
            android="chevron_left"
            size={19}
            weight="semibold"
            tintColor="rgba(255,255,255,0.76)"
          />
        </Pressable>

        <Text accessibilityRole="header" style={styles.monthTitle}>{monthTitle}</Text>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Next month"
          accessibilityState={{ disabled: !canGoToNextMonth }}
          disabled={!canGoToNextMonth}
          hitSlop={6}
          onPress={onNextMonth}
          style={({ pressed }) => [
            styles.monthButton,
            !canGoToNextMonth && styles.monthButtonDisabled,
            pressed && styles.monthButtonPressed,
          ]}
        >
          <PlatformIcon
            ios="chevron.right"
            android="chevron_right"
            size={19}
            weight="semibold"
            tintColor="rgba(255,255,255,0.76)"
          />
        </Pressable>
      </View>

      <View style={styles.weekdays}>
        {PROGRESS_WEEKDAYS.map((weekday) => (
          <Text key={weekday} style={styles.weekday}>{weekday}</Text>
        ))}
      </View>

      <View style={styles.grid}>
        {days.map((day) => (
          <CalendarDayCell
            key={day.id}
            day={day}
            compact={compact}
            onPress={() => onSelectDay(day.dayKey)}
          />
        ))}
      </View>
    </View>
  );
}

function CalendarDayCell({
  day,
  compact,
  onPress,
}: {
  day: ProgressCalendarDay;
  compact: boolean;
  onPress: () => void;
}) {
  const formattedDate = new Intl.DateTimeFormat(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(fromDayKey(day.dayKey));
  const countLabel = day.reps === 1 ? '1 push-up' : `${day.reps} push-ups`;
  const textColor = day.reps > 0
    ? WeekColors[day.colorIndex % WeekColors.length] ?? Colors.yellow
    : 'rgba(255,255,255,0.56)';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${formattedDate}, ${countLabel}`}
      accessibilityState={{ disabled: day.isFuture, selected: day.isSelected }}
      disabled={day.isFuture}
      onPress={onPress}
      style={({ pressed }) => [
        styles.dayCell,
        compact && styles.compactDayCell,
        !day.isInDisplayedMonth && styles.adjacentMonthCell,
        day.isFuture && styles.futureCell,
        pressed && styles.dayCellPressed,
      ]}
    >
      <View style={[styles.dayCapsule, day.isSelected && styles.selectedCapsule]}>
        <View style={[
          styles.dateCircle,
          day.isFuture && styles.futureDateCircle,
          day.isToday && !day.isSelected && styles.todayDateCircle,
          day.isSelected && styles.selectedDateCircle,
        ]}>
          <Text style={[
            styles.dateNumber,
            day.isFuture && styles.futureText,
            day.isSelected && styles.selectedDateNumber,
          ]}>
            {day.dayNumber}
          </Text>
        </View>
        <Text
          numberOfLines={1}
          style={[
            styles.repCount,
            { color: textColor },
            day.isFuture && styles.futureText,
            day.isSelected && styles.selectedRepCount,
          ]}
        >
          {day.isFuture ? '–' : day.reps}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  monthNavigation: {
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: -8,
  },
  monthButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthButtonPressed: {
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  monthButtonDisabled: {
    opacity: 0.24,
  },
  monthTitle: {
    color: Colors.white,
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: 0.1,
  },
  weekdays: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 28,
  },
  weekday: {
    width: `${100 / 7}%`,
    color: 'rgba(255,255,255,0.50)',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: `${100 / 7}%`,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
  },
  compactDayCell: {
    height: 48,
  },
  adjacentMonthCell: {
    opacity: 0.58,
  },
  futureCell: {
    opacity: 0.34,
  },
  dayCellPressed: {
    backgroundColor: 'rgba(255,255,255,0.045)',
  },
  dayCapsule: {
    width: 42,
    height: 51,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  selectedCapsule: {
    backgroundColor: 'rgba(128,31,184,0.16)',
    borderColor: Colors.magenta,
    shadowColor: Colors.magenta,
    shadowOpacity: 0.28,
    shadowRadius: 11,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  dateCircle: {
    width: 31,
    height: 31,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.085)',
  },
  futureDateCircle: {
    backgroundColor: 'transparent',
  },
  todayDateCircle: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.38)',
  },
  selectedDateCircle: {
    backgroundColor: 'rgba(128,31,184,0.82)',
    shadowColor: Colors.magenta,
    shadowOpacity: 0.46,
    shadowRadius: 8,
  },
  dateNumber: {
    ...Typography.tabularNumbers,
    color: 'rgba(255,255,255,0.94)',
    fontSize: 14,
    fontWeight: '600',
  },
  selectedDateNumber: {
    color: Colors.white,
    fontWeight: '800',
  },
  repCount: {
    ...Typography.tabularNumbers,
    minWidth: 38,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  selectedRepCount: {
    color: Colors.magenta,
  },
  futureText: {
    color: 'rgba(255,255,255,0.42)',
  },
});
