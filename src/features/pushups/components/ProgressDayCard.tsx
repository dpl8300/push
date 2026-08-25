import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/design-system/tokens';
import { Typography } from '@/design-system/typography';
import { fromDayKey } from '@/features/pushups/domain/date';
import type { DayKey } from '@/features/pushups/domain/types';

type ProgressDayCardProps = {
  dayKey: DayKey;
  reps: number;
  isAdjusting: boolean;
  compact: boolean;
  onAdjust: (delta: -1 | 1) => void;
};

export function ProgressDayCard({
  dayKey,
  reps,
  isAdjusting,
  compact,
  onAdjust,
}: ProgressDayCardProps) {
  const dateTitle = new Intl.DateTimeFormat(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(fromDayKey(dayKey));

  return (
    <View style={[styles.card, compact && styles.compactCard]}>
      <Text style={styles.date}>{dateTitle}</Text>

      <View style={styles.contentRow}>
        <View style={styles.totalBlock}>
          <Text
            accessibilityLiveRegion="polite"
            adjustsFontSizeToFit
            numberOfLines={1}
            style={[styles.total, compact && styles.compactTotal]}
          >
            {reps.toLocaleString()}
          </Text>
          <Text style={styles.unit}>{reps === 1 ? 'push-up' : 'push-ups'}</Text>
        </View>

        <View style={styles.controls}>
          <AdjustmentButton
            accessibilityLabel={`Remove one push-up from ${dateTitle}`}
            disabled={isAdjusting || reps === 0}
            symbol="−"
            onPress={() => onAdjust(-1)}
          />
          <AdjustmentButton
            accessibilityLabel={`Add one push-up to ${dateTitle}`}
            disabled={isAdjusting}
            symbol="+"
            onPress={() => onAdjust(1)}
          />
        </View>
      </View>
    </View>
  );
}

function AdjustmentButton({
  accessibilityLabel,
  disabled,
  symbol,
  onPress,
}: {
  accessibilityLabel: string;
  disabled: boolean;
  symbol: '−' | '+';
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.adjustButton,
        disabled && styles.adjustButtonDisabled,
        pressed && styles.adjustButtonPressed,
      ]}
    >
      <Text style={styles.adjustSymbol}>{symbol}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 207,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.035)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 19,
    shadowColor: Colors.pink,
    shadowOpacity: 0.08,
    shadowRadius: 24,
    shadowOffset: { width: 10, height: -5 },
  },
  compactCard: {
    minHeight: 184,
    paddingTop: 15,
    paddingBottom: 16,
  },
  date: {
    color: 'rgba(255,255,255,0.94)',
    fontSize: 18,
    fontWeight: '700',
  },
  contentRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 18,
  },
  totalBlock: {
    flex: 1,
    minWidth: 0,
  },
  total: {
    ...Typography.tabularNumbers,
    color: Colors.white,
    fontSize: 64,
    fontWeight: '800',
    lineHeight: 72,
    letterSpacing: -1.4,
  },
  compactTotal: {
    fontSize: 56,
    lineHeight: 62,
  },
  unit: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 17,
    fontWeight: '600',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  adjustButton: {
    width: 66,
    height: 66,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,159,46,0.105)',
    borderWidth: 1,
    borderColor: 'rgba(255,185,51,0.30)',
    shadowColor: Colors.orange,
    shadowOpacity: 0.10,
    shadowRadius: 14,
  },
  adjustButtonPressed: {
    transform: [{ scale: 0.96 }],
    backgroundColor: 'rgba(255,159,46,0.18)',
  },
  adjustButtonDisabled: {
    opacity: 0.34,
  },
  adjustSymbol: {
    ...Typography.tabularNumbers,
    color: Colors.yellow,
    fontSize: 38,
    fontWeight: '500',
    lineHeight: 43,
  },
});
