import { LinearGradient } from 'expo-linear-gradient';
import { useRef } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { CustomAmountSheet, type CustomAmountSheetHandle } from './CustomAmountSheet';

import { PlatformIcon } from '@/design-system/PlatformIcon';
import { Colors, Layout } from '@/design-system/tokens';

type QuickAddControlsProps = {
  disabled: boolean;
  onAdd: (amount: number) => void;
};

const buttons = [
  { amount: 1, colors: [Colors.yellow, Colors.bronze] as const, dots: 1, width: 54, fontSize: 26 },
  { amount: 5, colors: [Colors.orange, Colors.deepOrange] as const, dots: 2, width: 66, fontSize: 28 },
  { amount: 10, colors: [Colors.coral, Colors.pink] as const, dots: 5, width: 86, fontSize: 30 },
  { amount: 25, colors: [Colors.magenta, Colors.purple] as const, dots: 10, width: 125, fontSize: 32 },
];

const TOTAL_BASE_WIDTH = buttons.reduce((sum, button) => sum + button.width, 0);
const BUTTON_GAP = 6;

export function QuickAddControls({ disabled, onAdd }: QuickAddControlsProps) {
  const sheetRef = useRef<CustomAmountSheetHandle>(null);
  const { width } = useWindowDimensions();
  const availableWidth = width - Layout.screenHorizontalPadding * 2 - BUTTON_GAP * 3;
  const scale = Math.min(1, availableWidth / TOTAL_BASE_WIDTH);

  return (
    <View style={[styles.container, disabled && styles.disabledControls]}>
      <View style={styles.row}>
        {buttons.map((button) => (
          <QuickAddButton
            key={button.amount}
            {...button}
            disabled={disabled}
            scale={scale}
            onPress={() => onAdd(button.amount)}
          />
        ))}
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Enter a custom push-up amount"
        disabled={disabled}
        onPress={() => sheetRef.current?.present()}
        style={({ pressed }) => [styles.customButton, pressed && styles.customButtonPressed]}
      >
        <Text style={styles.customLabel}>Custom Amount</Text>
        <PlatformIcon
          ios="pencil"
          android="edit"
          size={13}
          weight="bold"
          tintColor="rgba(255,255,255,0.86)"
        />
      </Pressable>
      <CustomAmountSheet ref={sheetRef} onAdd={onAdd} />
    </View>
  );
}

type QuickAddButtonProps = {
  amount: number;
  colors: readonly [string, string];
  dots: number;
  width: number;
  fontSize: number;
  scale: number;
  disabled: boolean;
  onPress: () => void;
};

function QuickAddButton({
  amount,
  colors,
  dots,
  width,
  fontSize,
  scale,
  disabled,
  onPress,
}: QuickAddButtonProps) {
  const pressed = useSharedValue(false);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{
      scale: withSpring(pressed.value ? 0.94 : 1, { damping: 12, stiffness: 420 }),
    }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Add ${amount} push-up${amount === 1 ? '' : 's'}`}
        disabled={disabled}
        onPress={onPress}
        onPressIn={() => { pressed.value = true; }}
        onPressOut={() => { pressed.value = false; }}
      >
        <LinearGradient
          colors={[`${colors[0]}61`, `${colors[1]}61`]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.quickButton,
            {
              width: width * scale,
              height: 68 * Math.max(scale, 0.88),
              borderColor: `${colors[0]}2E`,
              shadowColor: colors[1],
            },
          ]}
        >
          <Text style={[styles.amount, { color: colors[0], fontSize: fontSize * scale }]}>
            +{amount}
          </Text>
          <View style={styles.dots}>
            {Array.from({ length: dots }, (_, index) => (
              <View key={index} style={[styles.dot, { backgroundColor: colors[0] }]} />
            ))}
          </View>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 9,
  },
  disabledControls: {
    opacity: 0.72,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: BUTTON_GAP,
  },
  quickButton: {
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    shadowOpacity: 0.22,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 7 },
  },
  amount: {
    fontWeight: '900',
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 3,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  customButton: {
    minHeight: 44,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.055)',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 7,
  },
  customButtonPressed: {
    backgroundColor: 'rgba(255,255,255,0.085)',
    transform: [{ scale: 0.99 }],
  },
  customLabel: {
    color: 'rgba(255,255,255,0.86)',
    fontSize: 16,
    fontWeight: '600',
  },
});
