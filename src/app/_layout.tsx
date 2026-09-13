import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

import { useAuth } from '@/features/auth';
import { AppProviders } from '@/providers/app-providers';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    <AppProviders>
      <RootNavigator />
    </AppProviders>
  );
}

function RootNavigator() {
  const { isHydrated } = useAuth();

  useEffect(() => {
    // Chi an splash khi da doc xong phien dang nhap -> khong nhay man hinh
    if (isHydrated) void SplashScreen.hideAsync();
  }, [isHydrated]);

  if (!isHydrated) return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="+not-found" options={{ headerShown: true, title: 'Khong tim thay' }} />
    </Stack>
  );
}
