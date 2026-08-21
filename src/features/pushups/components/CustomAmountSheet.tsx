import {
  BottomSheetModal,
  BottomSheetTextInput,
  BottomSheetView,
} from '@expo/ui/community/bottom-sheet';
import { LinearGradient } from 'expo-linear-gradient';
import {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
  type ElementRef,
} from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/design-system/tokens';
import { parseAddAmount } from '@/features/pushups/domain/validation';

export type CustomAmountSheetHandle = {
  present: () => void;
  dismiss: () => void;
};

type CustomAmountSheetProps = {
  onAdd: (amount: number) => void;
};

export const CustomAmountSheet = forwardRef<CustomAmountSheetHandle, CustomAmountSheetProps>(
  function CustomAmountSheet({ onAdd }, ref) {
    const sheetRef = useRef<ElementRef<typeof BottomSheetModal>>(null);
    const [amountText, setAmountText] = useState('');
    const amount = parseAddAmount(amountText);
    const hasInput = amountText.length > 0;

    useImperativeHandle(ref, () => ({
      present: () => sheetRef.current?.present(),
      dismiss: () => sheetRef.current?.dismiss(),
    }), []);

    const submit = () => {
      if (amount === null) return;
      onAdd(amount);
      sheetRef.current?.dismiss();
    };

    return (
      <BottomSheetModal
        ref={sheetRef}
        enableDynamicSizing
        enablePanDownToClose
        backgroundStyle={styles.sheetBackground}
        handleIndicatorStyle={styles.handle}
        keyboardBehavior="interactive"
        onDismiss={() => setAmountText('')}
      >
        <BottomSheetView style={styles.content}>
          <Text style={styles.title}>Custom Amount</Text>
          <BottomSheetTextInput
            accessibilityLabel="Custom push-up amount"
            autoFocus
            keyboardType="number-pad"
            maxLength={3}
            placeholder="Push-ups"
            placeholderTextColor="rgba(255,255,255,0.34)"
            selectionColor={Colors.pink}
            value={amountText}
            onChangeText={(value) => setAmountText(value.replace(/\D/g, ''))}
            onSubmitEditing={submit}
            style={styles.input}
          />
          {hasInput && amount === null ? (
            <Text style={styles.validation}>Enter a whole number from 1 to 250.</Text>
          ) : null}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Add custom push-ups"
            disabled={amount === null}
            onPress={submit}
            style={({ pressed }) => [
              styles.submitButton,
              amount === null && styles.disabled,
              pressed && amount !== null && styles.pressed,
            ]}
          >
            <LinearGradient
              colors={[Colors.coral, Colors.magenta]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.submitGradient}
            >
              <Text style={styles.submitLabel}>Add Push-ups</Text>
            </LinearGradient>
          </Pressable>
          <View style={styles.bottomSpacer} />
        </BottomSheetView>
      </BottomSheetModal>
    );
  },
);

const styles = StyleSheet.create({
  sheetBackground: {
    backgroundColor: Colors.surface,
  },
  handle: {
    backgroundColor: 'rgba(255,255,255,0.34)',
  },
  content: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 22,
    paddingBottom: 12,
    gap: 14,
  },
  title: {
    color: Colors.white,
    fontSize: 25,
    fontWeight: '900',
  },
  input: {
    color: Colors.white,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 32,
    fontWeight: '700',
  },
  validation: {
    color: Colors.coral,
    fontSize: 13,
    marginTop: -7,
  },
  submitButton: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  submitGradient: {
    alignItems: 'center',
    paddingVertical: 15,
  },
  submitLabel: {
    color: 'rgba(0,0,0,0.84)',
    fontSize: 17,
    fontWeight: '900',
  },
  disabled: {
    opacity: 0.45,
  },
  pressed: {
    transform: [{ scale: 0.98 }],
  },
  bottomSpacer: {
    height: 8,
  },
});

