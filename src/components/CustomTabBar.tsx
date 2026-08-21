import type { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PlatformIcon } from '@/design-system/PlatformIcon';
import { Colors } from '@/design-system/tokens';

type TabBarRenderer = NonNullable<ComponentProps<typeof Tabs>['tabBar']>;
type TabBarProps = Parameters<TabBarRenderer>[0];

const ICONS = {
  index: { ios: 'house.fill', android: 'home' },
  progress: { ios: 'chart.bar.fill', android: 'bar_chart' },
  settings: { ios: 'gearshape.fill', android: 'settings' },
} as const;

export function CustomTabBar({ state, descriptors, navigation }: TabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 14) }]}>
      {state.routes.map((route, index) => {
        const isSelected = state.index === index;
        const options = descriptors[route.key]?.options;
        const label = typeof options?.tabBarLabel === 'string'
          ? options.tabBarLabel
          : options?.title ?? route.name;
        const icon = ICONS[route.name as keyof typeof ICONS] ?? ICONS.index;

        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: isSelected }}
            accessibilityLabel={options?.tabBarAccessibilityLabel}
            onPress={() => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!isSelected && !event.defaultPrevented) {
                navigation.navigate(route.name, route.params);
              }
            }}
            onLongPress={() => navigation.emit({ type: 'tabLongPress', target: route.key })}
            style={styles.item}
          >
            {isSelected ? <View style={styles.indicator} /> : null}
            <PlatformIcon
              ios={icon.ios}
              android={icon.android}
              size={19}
              weight="semibold"
              tintColor={isSelected ? Colors.pink : 'rgba(255,255,255,0.42)'}
            />
            <Text style={[styles.label, isSelected && styles.selectedLabel]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.72)',
    borderTopColor: 'rgba(255,255,255,0.07)',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    minHeight: 42,
  },
  indicator: {
    position: 'absolute',
    top: -10,
    width: 24,
    height: 3,
    borderRadius: 2,
    backgroundColor: Colors.pink,
    shadowColor: Colors.pink,
    shadowOpacity: 0.55,
    shadowRadius: 8,
  },
  label: {
    color: 'rgba(255,255,255,0.42)',
    fontSize: 10,
    fontWeight: '600',
  },
  selectedLabel: {
    color: Colors.pink,
  },
});

