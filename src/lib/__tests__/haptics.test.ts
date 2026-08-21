import * as ExpoHaptics from 'expo-haptics';

import { playCompletionHaptic, playRepHaptic, repCadenceMs } from '../haptics';

jest.mock('expo-haptics', () => ({
  ImpactFeedbackStyle: {
    Light: 'light',
    Medium: 'medium',
    Rigid: 'rigid',
  },
  impactAsync: jest.fn().mockResolvedValue(undefined),
}));

const impactAsync = jest.mocked(ExpoHaptics.impactAsync);

describe('haptic choreography', () => {
  beforeEach(() => {
    impactAsync.mockClear();
  });

  it('uses the Swift cadence thresholds', () => {
    expect(repCadenceMs(1)).toBe(0);
    expect(repCadenceMs(5)).toBe(92);
    expect(repCadenceMs(10)).toBe(72);
    expect(repCadenceMs(25)).toBe(58);
  });

  it('adds a medium milestone every five reps for larger additions', async () => {
    await playRepHaptic(4, 10);

    expect(impactAsync).toHaveBeenNthCalledWith(1, ExpoHaptics.ImpactFeedbackStyle.Light);
    expect(impactAsync).toHaveBeenNthCalledWith(2, ExpoHaptics.ImpactFeedbackStyle.Medium);
  });

  it('uses medium and rigid completion impacts', async () => {
    await playCompletionHaptic(10);
    await playCompletionHaptic(25);

    expect(impactAsync).toHaveBeenNthCalledWith(1, ExpoHaptics.ImpactFeedbackStyle.Medium);
    expect(impactAsync).toHaveBeenNthCalledWith(2, ExpoHaptics.ImpactFeedbackStyle.Rigid);
  });
});

