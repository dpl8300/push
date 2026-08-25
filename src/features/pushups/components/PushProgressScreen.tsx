import { useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ProgressCalendar } from './ProgressCalendar';
import { ProgressDayCard } from './ProgressDayCard';
import { ProgressSummaryStrip } from './ProgressSummaryStrip';

import { BrandBackground } from '@/components/BrandBackground';
import { ProgressComplianceFooter } from '@/components/ProgressComplianceFooter';
import { PlatformIcon } from '@/design-system/PlatformIcon';
import { Colors, Layout } from '@/design-system/tokens';
import { Typography } from '@/design-system/typography';
import { usePushProgress } from '@/features/pushups/hooks/usePushProgress';

export function PushProgressScreen() {
  const router = useRouter();
  const { height } = useWindowDimensions();
  const compact = height < 760;
  const {
    displayedMonthKey,
    selectedDayKey,
    selectedReps,
    calendarDays,
    monthStats,
    isLoading,
    isAdjusting,
    error,
    canGoToNextMonth,
    selectDay,
    goToPreviousMonth,
    goToNextMonth,
    adjustSelectedDay,
    retry,
    clearError,
  } = usePushProgress();

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace('/');
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <BrandBackground />
      <ScrollView
        alwaysBounceVertical={false}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Back to home"
              onPress={goBack}
              style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}
            >
              <PlatformIcon
                ios="chevron.left"
                android="arrow_back"
                size={21}
                weight="semibold"
                tintColor="rgba(255,255,255,0.78)"
              />
            </Pressable>
            <Text style={[styles.brand, compact && styles.compactBrand]}>PUSH</Text>
          </View>

          <View style={styles.calendarArea}>
            <ProgressCalendar
              displayedMonthKey={displayedMonthKey}
              days={calendarDays}
              canGoToNextMonth={canGoToNextMonth}
              compact={compact}
              onPreviousMonth={goToPreviousMonth}
              onNextMonth={goToNextMonth}
              onSelectDay={selectDay}
            />
            {isLoading ? (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator color={Colors.magenta} />
              </View>
            ) : null}
          </View>

          <ProgressSummaryStrip stats={monthStats} />

          {error ? (
            <View style={styles.errorBanner}>
              <Text numberOfLines={2} style={styles.errorText}>{error}</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Retry loading progress"
                onPress={() => {
                  clearError();
                  void retry();
                }}
              >
                <Text style={styles.retry}>Retry</Text>
              </Pressable>
            </View>
          ) : null}

          <ProgressDayCard
            dayKey={selectedDayKey}
            reps={selectedReps}
            isAdjusting={isAdjusting || isLoading}
            compact={compact}
            onAdjust={(delta) => void adjustSelectedDay(delta)}
          />

          <ProgressComplianceFooter />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Layout.screenHorizontalPadding,
    paddingBottom: 10,
  },
  content: {
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
    gap: 10,
  },
  header: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -12,
    borderRadius: 22,
  },
  backButtonPressed: {
    backgroundColor: 'rgba(255,255,255,0.07)',
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
  calendarArea: {
    position: 'relative',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: 'rgba(4,4,6,0.58)',
  },
  errorBanner: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 9,
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
