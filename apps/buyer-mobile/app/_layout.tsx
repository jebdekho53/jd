import 'react-native-gesture-handler';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { AppProviders } from '@/components/providers/app-providers';
import { SessionSync } from '@/components/providers/session-sync';
import { SideDrawer } from '@/components/navigation/side-drawer';

SplashScreen.preventAutoHideAsync().catch(() => {
  /* splash already hidden */
});

export default function RootLayout() {
  useEffect(() => {
    void SplashScreen.hideAsync();
  }, []);

  return (
    <AppProviders>
      <SessionSync />
      <StatusBar style="dark" />
      <SideDrawer />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(app)" />
      </Stack>
    </AppProviders>
  );
}
