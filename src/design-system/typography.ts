import { Platform, type TextStyle } from 'react-native';

export const Typography = {
  brand: {
    fontFamily: Platform.select({
      ios: 'EurostileExtended-Black',
      android: 'EurostileExtended',
      default: 'EurostileExtended-Black',
    }),
    fontWeight: '900',
  } satisfies TextStyle,
  tabularNumbers: {
    fontVariant: ['tabular-nums'],
  } satisfies TextStyle,
} as const;

