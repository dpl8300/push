import { BottomSheetModalProvider } from '@expo/ui/community/bottom-sheet';
import { Stack } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import { Suspense } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { Colors } from '@/design-system/tokens';
import { migrateDatabase } from '@/features/pushups/data/database';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <Suspense fallback={<LoadingDatabase />}>
        <SQLiteProvider
          databaseName="push.db"
          onInit={migrateDatabase}
          useSuspense
        >
          <BottomSheetModalProvider>
            <StatusBar style="light" />
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="(tabs)" />
            </Stack>
          </BottomSheetModalProvider>
        </SQLiteProvider>
      </Suspense>
    </GestureHandlerRootView>
  );
}

function LoadingDatabase() {
  return (
    <View style={styles.loading}>
      <ActivityIndicator color={Colors.pink} />
      <Text style={styles.loadingText}>Loading your history…</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: Colors.background,
  },
  loadingText: {
    color: 'rgba(255,255,255,0.58)',
    fontSize: 14,
  },
});

