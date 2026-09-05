import { Platform, type TextStyle } from 'react-native';

export const Typography = {
  brand: {
    fontFamily: Platform.select({
      ios: 'Orbitron-Black',
      android: 'Orbitron',
      default: 'Orbitron-Black',
    }),
    fontWeight: '900',
  } satisfies TextStyle,
  tabularNumbers: {
    fontVariant: ['tabular-nums'],
  } satisfies TextStyle,
} as const;
