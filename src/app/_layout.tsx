import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

import { useAuth } from '@/features/auth';
import { useAppFonts } from '@/hooks/use-app-fonts';
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
  const isFontReady = useAppFonts();
  const isReady = isHydrated && isFontReady;

  useEffect(() => {
    // Chi an splash khi da doc xong phien dang nhap va nap xong font -> khong nhay man hinh
    if (isReady) void SplashScreen.hideAsync();
  }, [isReady]);

  if (!isReady) return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="verify-email" />
      <Stack.Screen name="add-child" />
      <Stack.Screen name="edit-account" />
      <Stack.Screen name="change-password" />
      <Stack.Screen name="delete-account" />
      <Stack.Screen name="children/[studentId]" />
      <Stack.Screen name="assignments/[assignmentId]" />
      <Stack.Screen name="sessions/[sessionId]" />
      <Stack.Screen name="receipts/[registrationId]" />
      <Stack.Screen name="bills/[registrationId]" />
      <Stack.Screen name="+not-found" options={{ headerShown: true, title: 'Không tìm thấy' }} />
    </Stack>
  );
}
