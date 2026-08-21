import { fireEvent, render } from '@testing-library/react-native';

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

// These imports must follow the mocks so the components receive the test doubles.
// eslint-disable-next-line import/first
import { ComingSoonScreen } from '@/components/ComingSoonScreen';
// eslint-disable-next-line import/first
import { PushHomeScreen } from '@/features/pushups/components/PushHomeScreen';

describe('navigation', () => {
  beforeEach(() => {
    mockPush.mockReset();
    mockBack.mockReset();
    mockReplace.mockReset();
    mockCanGoBack.mockReset().mockReturnValue(true);
  });

  it('opens Progress from the link below the stats without making the graph a control', async () => {
    const screen = await render(<PushHomeScreen />);

    expect(screen.getByTestId('history-graph').props.accessibilityRole).toBeUndefined();
    fireEvent.press(screen.getByRole('link', { name: 'See more progress' }));

    expect(mockPush).toHaveBeenCalledWith('/progress');
  });

  it('returns through navigation history from Progress', async () => {
    const screen = await render(
      <ComingSoonScreen
        title="Progress"
        description="Progress details"
        icon="chart.bar.fill"
        androidIcon="bar_chart"
      />,
    );

    fireEvent.press(screen.getByRole('button', { name: 'Back to home' }));

    expect(mockBack).toHaveBeenCalledTimes(1);
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('falls back to Home when Progress has no navigation history', async () => {
    mockCanGoBack.mockReturnValue(false);
    const screen = await render(
      <ComingSoonScreen
        title="Progress"
        description="Progress details"
        icon="chart.bar.fill"
        androidIcon="bar_chart"
      />,
    );

    fireEvent.press(screen.getByRole('button', { name: 'Back to home' }));

    expect(mockBack).not.toHaveBeenCalled();
    expect(mockReplace).toHaveBeenCalledWith('/');
  });
});
