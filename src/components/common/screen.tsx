import type { PropsWithChildren } from 'react';
import { ScrollView, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { ThemedView } from '@/components/ui/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';

export type ScreenProps = PropsWithChildren<{
  /** Boc noi dung trong ScrollView (mac dinh: co) */
  scrollable?: boolean;
  edges?: readonly Edge[];
  contentStyle?: StyleProp<ViewStyle>;
}>;

/** Khung man hinh chuan: safe area + padding + gioi han be ngang tren tablet/web. */
export function Screen({
  children,
  scrollable = true,
  edges = ['top', 'bottom'],
  contentStyle,
}: ScreenProps) {
  const content = <ThemedView style={[styles.content, contentStyle]}>{children}</ThemedView>;

  return (
    <ThemedView style={styles.root}>
      <SafeAreaView style={styles.safeArea} edges={edges}>
        {scrollable ? (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
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
