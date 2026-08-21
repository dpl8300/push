import * as Haptics from 'expo-haptics';

export function repCadenceMs(amount: number): number {
  if (amount >= 25) return 58;
  if (amount >= 10) return 72;
  if (amount >= 5) return 92;
  return 0;
}

export async function playRepHaptic(index: number, total: number): Promise<void> {
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

  if (total >= 10 && (index + 1) % 5 === 0 && index < total - 1) {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }
}

export async function playCompletionHaptic(amount: number): Promise<void> {
  if (amount >= 25) {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid);
  } else if (amount >= 5) {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }
}

export function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

