import type { PropsWithChildren } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { ThemedView } from '@/components/ui/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ScreenProps = PropsWithChildren<{
  /** Boc noi dung trong ScrollView (mac dinh: co) */
  scrollable?: boolean;
  edges?: readonly Edge[];
  contentStyle?: StyleProp<ViewStyle>;
  /** Keo xuong de tai lai. Chi co tac dung khi `scrollable`. */
  onRefresh?: () => void;
  isRefreshing?: boolean;
}>;

/** Khung man hinh chuan: safe area + padding + gioi han be ngang tren tablet/web. */
export function Screen({
  children,
  scrollable = true,
  edges = ['top', 'bottom'],
  contentStyle,
  onRefresh,
  isRefreshing = false,
}: ScreenProps) {
  const theme = useTheme();
  const content = <ThemedView style={[styles.content, contentStyle]}>{children}</ThemedView>;

  return (
    <ThemedView style={styles.root}>
      <SafeAreaView style={styles.safeArea} edges={edges}>
        {scrollable ? (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            refreshControl={
              onRefresh ? (
                <RefreshControl
                  refreshing={isRefreshing}
                  onRefresh={onRefresh}
                  tintColor={theme.primary}
                  colors={[theme.primary]}
                />
              ) : undefined
            }
          >
            {content}
          </ScrollView>
        ) : (
          content
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safeArea: { flex: 1, width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center' },
  scrollContent: { flexGrow: 1 },
  content: { flex: 1, padding: Spacing.four, gap: Spacing.three },
});
