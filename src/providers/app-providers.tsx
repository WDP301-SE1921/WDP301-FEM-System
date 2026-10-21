import { focusManager, QueryClientProvider } from '@tanstack/react-query';
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, type PropsWithChildren } from 'react';
import { AppState, Platform, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { queryClient } from '@/api/query-client';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthStore } from '@/store/auth-store';

/**
 * Noi duy nhat khai bao provider toan cuc.
 * Them provider moi (i18n, toast, ...) o day thay vi sua _layout.
 */
export function AppProviders({ children }: PropsWithChildren) {
  const colorScheme = useColorScheme();
  const hydrate = useAuthStore((s) => s.hydrate);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  // React Query chi tu biet "quay lai cua so" tren web. Tren may that bao cho no khi app tro lai
  // man hinh, de du lieu qua `staleTime` duoc tai lai: phu huynh mo lai app la thay mon moi trung tam
  // vua dang ky (SRS muc 6.1)
  useEffect(() => {
    if (Platform.OS === 'web') return undefined;

    const subscription = AppState.addEventListener('change', (status) => {
      focusManager.setFocused(status === 'active');
    });
    return () => subscription.remove();
  }, []);

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <StatusBar style="auto" />
            {children}
          </ThemeProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
