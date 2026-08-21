export const Colors = {
  background: '#040406',
  surface: '#0D0E11',
  yellow: '#FFD12E',
  bronze: '#A36B14',
  orange: '#FF8530',
  deepOrange: '#A3420F',
  coral: '#FF4F57',
  pink: '#FF2E7A',
  magenta: '#ED3DF2',
  purple: '#801FB8',
  white: '#FFFFFF',
  black: '#000000',
} as const;

export const WeekColors = [
  Colors.yellow,
  Colors.orange,
  Colors.coral,
  Colors.pink,
  Colors.magenta,
  Colors.purple,
] as const;

export const Layout = {
  screenHorizontalPadding: 22,
  cornerRadius: 8,
  tabBarHeight: 82,
} as const;

export const Opacity = {
  secondaryText: 0.62,
  tertiaryText: 0.48,
  grid: 0.035,
} as const;

