import { StyleSheet, Text, View } from 'react-native';

import { PlatformIcon } from '@/design-system/PlatformIcon';
import { Colors } from '@/design-system/tokens';
import { Typography } from '@/design-system/typography';
import type { PushStats } from '@/features/pushups/domain/types';

type StatsStripProps = {
  stats: PushStats;
};

const statDefinitions = [
  {
    key: 'lifetimePushUps',
    label: 'LIFETIME',
    ios: 'figure.strengthtraining.traditional',
    android: 'fitness_center',
    format: (value: number) => value.toLocaleString(),
  },
  {
    key: 'bestDay',
    label: 'BEST DAY',
    ios: 'star.fill',
    android: 'star',
    format: String,
  },
  {
    key: 'dailyAverage',
    label: 'DAILY AVG',
    ios: 'chart.line.uptrend.xyaxis',
    android: 'trending_up',
    format: String,
  },
  {
    key: 'activeDaysPercentage',
    label: 'ACTIVE DAYS',
    ios: 'target',
    android: 'target',
    format: (value: number) => `${value}%`,
  },
] as const;

export function StatsStrip({ stats }: StatsStripProps) {
  return (
    <View style={styles.container}>
      {statDefinitions.map((definition, index) => (
        <View key={definition.key} style={styles.stat}>
          <PlatformIcon
            ios={definition.ios}
            android={definition.android}
            size={11}
            weight="bold"
            tintColor={Colors.purple}
          />
          <Text numberOfLines={1} adjustsFontSizeToFit style={styles.value}>
            {definition.format(stats[definition.key])}
          </Text>
          <Text numberOfLines={1} adjustsFontSizeToFit style={styles.label}>
            {definition.label}
          </Text>
          {index < statDefinitions.length - 1 ? <View style={styles.divider} /> : null}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.055)',
    borderTopColor: 'rgba(255,255,255,0.025)',
    borderTopWidth: 1,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    gap: 5,
    position: 'relative',
  },
  value: {
    ...Typography.tabularNumbers,
    color: Colors.white,
    fontSize: 20,
    fontWeight: '600',
    maxWidth: '92%',
  },
  label: {
    color: 'rgba(255,255,255,0.48)',
    fontSize: 11,
    fontWeight: '500',
    maxWidth: '96%',
  },
  divider: {
    position: 'absolute',
    right: 0,
    top: 2,
    width: StyleSheet.hairlineWidth,
    height: 48,
    backgroundColor: 'rgba(255,255,255,0.09)',
  },
});

