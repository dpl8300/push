import { Stack } from 'expo-router';

import { Colors } from '@/design-system/tokens';

export default function AppLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.background },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="progress" />
    </Stack>
  );
}
