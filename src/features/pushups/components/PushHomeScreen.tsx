import { useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PushHistoryGraph } from './PushHistoryGraph';
import { QuickAddControls } from './QuickAddControls';
import { StatsStrip } from './StatsStrip';

import { BrandBackground } from '@/components/BrandBackground';
import { PlatformIcon } from '@/design-system/PlatformIcon';
import { Colors, Layout } from '@/design-system/tokens';
import { Typography } from '@/design-system/typography';
import { usePushHome } from '@/features/pushups/hooks/usePushHome';

export function PushHomeScreen() {
  const router = useRouter();
  const { height } = useWindowDimensions();
  const compact = height < 760;
  const graphHeight = compact
    ? Math.max(176, Math.min(200, height * 0.27))
    : Math.max(230, Math.min(270, height * 0.305));
  const {
    visibleWeek,
    stats,
    todayReps,
    motivation,
    isLoading,
    isAdding,
    error,
    highlightedRepIndex,
    activeAddAmount,
    addPulseKey,
    addPushUps,
    retry,
    clearError,
  } = usePushHome();

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <BrandBackground />
      <View style={[styles.content, compact && styles.compactContent]}>
        <View style={styles.header}>
          <Text style={[styles.brand, compact && styles.compactBrand]}>PUSH</Text>
          <View style={styles.streak}>
            <View style={styles.streakValueRow}>
              <PlatformIcon
                ios="flame.fill"
                android="local_fire_department"
                size={18}
                weight="bold"
                tintColor={Colors.orange}
              />
              <Text style={styles.streakValue}>{stats.currentStreak}</Text>
            </View>
            <Text style={styles.streakLabel}>DAY STREAK</Text>
          </View>
        </View>

        <View style={[styles.totalBlock, compact && styles.compactTotalBlock]}>
          <Text style={styles.eyebrow}>PUSH-UPS TODAY</Text>
          <Text
            accessibilityLiveRegion="polite"
            adjustsFontSizeToFit
            numberOfLines={1}
            style={[styles.total, compact && styles.compactTotal]}
          >
            {todayReps}
          </Text>
          <View style={styles.motivationRow}>
            <PlatformIcon
              ios="flame.fill"
              android="local_fire_department"
              size={17}
              tintColor={Colors.orange}
            />
            <Text numberOfLines={1} adjustsFontSizeToFit style={styles.motivation}>
              {motivation}
            </Text>
          </View>
        </View>

        <View
          style={[styles.graph, { height: graphHeight }]}
        >
          <PushHistoryGraph
            days={visibleWeek}
            highlightedRepIndex={highlightedRepIndex}
            activeAddAmount={activeAddAmount}
            addPulseKey={addPulseKey}
          />
        </View>

        <StatsStrip stats={stats} />

        <Pressable
          accessibilityRole="link"
          accessibilityLabel="See more progress"
          onPress={() => router.push('/progress')}
          style={({ pressed }) => [styles.progressLink, pressed && styles.progressLinkPressed]}
        >
          <Text style={styles.progressLinkLabel}>See more progress</Text>
          <PlatformIcon
            ios="chevron.right"
            android="chevron_right"
            size={12}
            weight="semibold"
            tintColor="rgba(255,255,255,0.46)"
          />
        </Pressable>

        {error ? (
          <View style={styles.errorBanner}>
            <Text numberOfLines={2} style={styles.errorText}>{error}</Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                clearError();
                void retry();
              }}
            >
              <Text style={styles.retry}>Retry</Text>
            </Pressable>
          </View>
        ) : null}

        <View style={styles.spacer} />

        {isLoading ? (
          <View style={styles.loadingControls}>
            <ActivityIndicator color={Colors.pink} />
          </View>
        ) : (
          <QuickAddControls disabled={isAdding} onAdd={(amount) => void addPushUps(amount)} />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: Layout.screenHorizontalPadding,
    paddingTop: 4,
    paddingBottom: 12,
    gap: 10,
  },
  compactContent: {
    gap: 7,
    paddingBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brand: {
    ...Typography.brand,
    color: Colors.white,
    fontSize: 39,
    letterSpacing: 1,
    textShadowColor: 'rgba(255,255,255,0.18)',
    textShadowRadius: 12,
  },
  compactBrand: {
    fontSize: 34,
  },
  streak: {
    alignItems: 'flex-end',
    gap: 3,
  },
  streakValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  streakValue: {
    ...Typography.tabularNumbers,
    color: Colors.coral,
    fontSize: 23,
    fontWeight: '900',
  },
  streakLabel: {
    color: 'rgba(255,255,255,0.50)',
    fontSize: 13,
    fontWeight: '500',
  },
  totalBlock: {
    alignItems: 'center',
    gap: 4,
    paddingTop: 2,
  },
  compactTotalBlock: {
    gap: 1,
    paddingTop: 0,
  },
  eyebrow: {
    color: 'rgba(255,255,255,0.62)',
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  total: {
    ...Typography.tabularNumbers,
    color: Colors.white,
    fontSize: 76,
    fontWeight: '700',
    lineHeight: 84,
    minWidth: 120,
    textAlign: 'center',
    textShadowColor: 'rgba(255,255,255,0.22)',
    textShadowRadius: 14,
  },
  compactTotal: {
    fontSize: 62,
    lineHeight: 68,
  },
  motivationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    maxWidth: '100%',
  },
  motivation: {
    color: 'rgba(255,255,255,0.90)',
    fontSize: 17,
    fontWeight: '600',
  },
  graph: {
    flexShrink: 0,
  },
  spacer: {
    flex: 1,
    minHeight: 2,
  },
  progressLink: {
    minHeight: 44,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 5,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  progressLinkPressed: {
    backgroundColor: 'rgba(255,255,255,0.055)',
  },
  progressLinkLabel: {
    color: 'rgba(255,255,255,0.58)',
    fontSize: 13,
    fontWeight: '600',
  },
  loadingControls: {
    minHeight: 121,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,79,87,0.12)',
    borderColor: 'rgba(255,79,87,0.28)',
    borderWidth: 1,
  },
  errorText: {
    flex: 1,
    color: 'rgba(255,255,255,0.78)',
    fontSize: 12,
  },
  retry: {
    color: Colors.coral,
    fontSize: 13,
    fontWeight: '800',
  },
});
