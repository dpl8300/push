import { StyleSheet, Text, View } from 'react-native';

import { PlatformIcon } from '@/design-system/PlatformIcon';
import { Colors } from '@/design-system/tokens';
import { Typography } from '@/design-system/typography';
import type { ProgressMonthStats } from '@/features/pushups/domain/types';

type ProgressSummaryStripProps = {
  stats: ProgressMonthStats;
};

export function ProgressSummaryStrip({ stats }: ProgressSummaryStripProps) {
  const definitions = [
    {
      label: 'Total Push-ups',
      value: stats.totalPushUps.toLocaleString(),
      ios: 'square.grid.3x3.fill' as const,
      android: 'apps',
    },
    {
      label: 'Active Days',
      value: String(stats.activeDays),
      ios: 'target' as const,
      android: 'target',
    },
    {
      label: 'Best Day',
      value: String(stats.bestDay),
      ios: 'star.fill' as const,
      android: 'star',
    },
  ];

  return (
    <View style={styles.container}>
      {definitions.map((definition, index) => (
        <View key={definition.label} style={styles.stat}>
          <View style={styles.valueRow}>
            <PlatformIcon
              ios={definition.ios}
              android={definition.android}
              size={18}
              weight="bold"
              tintColor={Colors.purple}
            />
            <Text
              adjustsFontSizeToFit
              numberOfLines={1}
              style={styles.value}
            >
              {definition.value}
            </Text>
          </View>
          <Text adjustsFontSizeToFit numberOfLines={1} style={styles.label}>
            {definition.label}
          </Text>
          {index < definitions.length - 1 ? <View style={styles.divider} /> : null}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'stretch',
    borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.045)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.13)',
    overflow: 'hidden',
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    position: 'relative',
    paddingHorizontal: 5,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    maxWidth: '100%',
  },
  value: {
    ...Typography.tabularNumbers,
    color: Colors.white,
    fontSize: 18,
    fontWeight: '800',
    flexShrink: 1,
  },
  label: {
    color: 'rgba(255,255,255,0.58)',
    fontSize: 11,
    fontWeight: '500',
    maxWidth: '95%',
  },
  divider: {
    position: 'absolute',
    right: 0,
    top: 12,
    bottom: 12,
    width: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
});
