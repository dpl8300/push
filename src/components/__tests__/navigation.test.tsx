import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { Linking } from 'react-native';

const mockPush = jest.fn();
const mockBack = jest.fn();
const mockReplace = jest.fn();
const mockCanGoBack = jest.fn(() => true);
const mockUsePushHome = jest.fn(() => ({
  visibleWeek: [],
  stats: {
    currentStreak: 4,
    lifetimePushUps: 120,
    bestDay: 30,
    dailyAverage: 12,
    activeDaysPercentage: 80,
  },
  todayReps: 10,
  motivation: 'Keep pushing',
  isLoading: false,
  isAdding: false,
  error: null,
  highlightedRepIndex: null,
  activeAddAmount: null,
  addPulseKey: 0,
  addPushUps: jest.fn(),
  retry: jest.fn(),
  clearError: jest.fn(),
}));
const mockUsePushProgress = jest.fn(() => ({
  displayedMonthKey: '2026-08-01',
  selectedDayKey: '2026-08-20',
  selectedReps: 10,
  calendarDays: [],
  monthStats: {
    totalPushUps: 120,
    activeDays: 8,
    bestDay: 30,
  },
  isLoading: false,
  isAdjusting: false,
  error: null,
  canGoToNextMonth: false,
  selectDay: jest.fn(),
  goToPreviousMonth: jest.fn(),
  goToNextMonth: jest.fn(),
  adjustSelectedDay: jest.fn(),
  retry: jest.fn(),
  clearError: jest.fn(),
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
    back: mockBack,
    replace: mockReplace,
    canGoBack: mockCanGoBack,
  }),
}));

jest.mock('@/components/BrandBackground', () => ({
  BrandBackground: () => null,
}));

jest.mock('@/design-system/PlatformIcon', () => ({
  PlatformIcon: () => null,
}));

jest.mock('@/features/pushups/components/PushHistoryGraph', () => {
  const { View } = jest.requireActual('react-native');
  return { PushHistoryGraph: () => <View testID="history-graph" /> };
});

jest.mock('@/features/pushups/components/QuickAddControls', () => ({
  QuickAddControls: () => null,
}));

jest.mock('@/features/pushups/components/StatsStrip', () => {
  const { View } = jest.requireActual('react-native');
  return { StatsStrip: () => <View testID="stats-strip" /> };
});

jest.mock('@/features/pushups/hooks/usePushHome', () => ({
  usePushHome: () => mockUsePushHome(),
}));

jest.mock('@/features/pushups/hooks/usePushProgress', () => ({
  usePushProgress: () => mockUsePushProgress(),
}));

// These imports must follow the mocks so the components receive the test doubles.
// eslint-disable-next-line import/first
import { APP_URLS } from '@/config/app-urls';
// eslint-disable-next-line import/first
import { PushHomeScreen } from '@/features/pushups/components/PushHomeScreen';
// eslint-disable-next-line import/first
import { PushProgressScreen } from '@/features/pushups/components/PushProgressScreen';

describe('navigation', () => {
  const openURL = jest.spyOn(Linking, 'openURL');

  beforeEach(() => {
    mockPush.mockReset();
    mockBack.mockReset();
    mockReplace.mockReset();
    mockCanGoBack.mockReset().mockReturnValue(true);
    openURL.mockReset().mockResolvedValue(undefined);
  });

  it('opens Progress from the link below the stats without making the graph a control', async () => {
    const screen = await render(<PushHomeScreen />);

    expect(screen.getByTestId('history-graph').props.accessibilityRole).toBeUndefined();
    fireEvent.press(screen.getByRole('link', { name: 'See more progress' }));

    expect(mockPush).toHaveBeenCalledWith('/progress');
  });

  it('returns through navigation history from Progress', async () => {
    const screen = await render(<PushProgressScreen />);

    fireEvent.press(screen.getByRole('button', { name: 'Back to home' }));

    expect(mockBack).toHaveBeenCalledTimes(1);
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('falls back to Home when Progress has no navigation history', async () => {
    mockCanGoBack.mockReturnValue(false);
    const screen = await render(<PushProgressScreen />);

    fireEvent.press(screen.getByRole('button', { name: 'Back to home' }));

    expect(mockBack).not.toHaveBeenCalled();
    expect(mockReplace).toHaveBeenCalledWith('/');
  });

  it('opens the Progress privacy and support links', async () => {
    const screen = await render(<PushProgressScreen />);

    await act(async () => {
      fireEvent.press(screen.getByRole('link', { name: 'Open Privacy Policy' }));
      await Promise.resolve();
    });
    await act(async () => {
      fireEvent.press(screen.getByRole('link', { name: 'Open Support' }));
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(openURL).toHaveBeenNthCalledWith(1, APP_URLS.privacyPolicy);
      expect(openURL).toHaveBeenNthCalledWith(2, APP_URLS.support);
    });
    expect(screen.getByText('Your push-up history stays on this device.')).toBeTruthy();
    expect(screen.getByText('Version 1.0.0')).toBeTruthy();
  });

  it('shows a recoverable message when an external link cannot open', async () => {
    openURL.mockRejectedValueOnce(new Error('No browser'));
    const screen = await render(<PushProgressScreen />);

    await act(async () => {
      fireEvent.press(screen.getByRole('link', { name: 'Open Privacy Policy' }));
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(screen.getByText('Unable to open the link. Please try again.')).toBeTruthy();
    });
  });
});
