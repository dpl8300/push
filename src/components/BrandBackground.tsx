import { StyleSheet, View } from 'react-native';
import Svg, { Defs, Rect, RadialGradient, Stop } from 'react-native-svg';

import { Colors } from '@/design-system/tokens';

export function BrandBackground() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
        <Defs>
          <RadialGradient id="pinkGlow" cx="96%" cy="0%" rx="62%" ry="48%">
            <Stop offset="0" stopColor={Colors.pink} stopOpacity={0.22} />
            <Stop offset="1" stopColor={Colors.pink} stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id="orangeGlow" cx="0%" cy="100%" rx="55%" ry="38%">
            <Stop offset="0" stopColor={Colors.orange} stopOpacity={0.12} />
            <Stop offset="1" stopColor={Colors.orange} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#pinkGlow)" />
        <Rect width="100%" height="100%" fill="url(#orangeGlow)" />
      </Svg>
    </View>
  );
}

