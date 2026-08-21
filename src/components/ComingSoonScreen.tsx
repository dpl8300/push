import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandBackground } from '@/components/BrandBackground';
import { PlatformIcon } from '@/design-system/PlatformIcon';
import { Colors } from '@/design-system/tokens';
import { Typography } from '@/design-system/typography';

type ComingSoonScreenProps = {
  title: string;
  description: string;
  icon: 'chart.bar.fill' | 'gearshape.fill';
  androidIcon: 'bar_chart' | 'settings';
};

export function ComingSoonScreen({
  title,
  description,
  icon,
  androidIcon,
}: ComingSoonScreenProps) {
  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <BrandBackground />
      <Text style={styles.brand}>PUSH</Text>
      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <PlatformIcon
            ios={icon}
            android={androidIcon}
            size={34}
            tintColor={Colors.pink}
          />
        </View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: 22,
  },
  brand: {
    ...Typography.brand,
    color: Colors.white,
    fontSize: 39,
    letterSpacing: 1,
    marginTop: 4,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 72,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 46, 122, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255, 46, 122, 0.22)',
    marginBottom: 22,
  },
  title: {
    color: Colors.white,
    fontSize: 28,
    fontWeight: '900',
  },
  description: {
    color: 'rgba(255,255,255,0.58)',
    fontSize: 16,
    lineHeight: 23,
    maxWidth: 300,
    textAlign: 'center',
    marginTop: 9,
  },
});

