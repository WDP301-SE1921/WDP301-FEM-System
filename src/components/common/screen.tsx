import type { PropsWithChildren } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
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

/**
 * `edges` cho man hinh nam tren thanh tab: thanh tab da tu chua safe area phia duoi. iOS lay safe
 * area cua ca cua so chu khong tru phan thanh tab, nen giu canh duoi thi thua mot khoang trong ngay
 * tren thanh tab.
 */
export const TAB_SCREEN_EDGES: readonly Edge[] = ['top'];

export type ScreenProps = PropsWithChildren<{
  /** Boc noi dung trong ScrollView (mac dinh: co) */
  scrollable?: boolean;
  edges?: readonly Edge[];
  contentStyle?: StyleProp<ViewStyle>;
  /** Keo xuong de tai lai. Chi co tac dung khi `scrollable`. */
  onRefresh?: () => void;
  isRefreshing?: boolean;
}>;

/**
 * Khung man hinh chuan: safe area + padding + gioi han be ngang tren tablet/web. Tu nang noi dung
 * len khi ban phim mo, nen man hinh co o nhap khong boc them `KeyboardAvoidingView`.
 */
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
  // iOS: ScrollView tu chen inset va cuon toi o dang nhap, bat ca hai thi noi dung bi day hai lan
  const isKeyboardHandledByScrollView = scrollable && Platform.OS === 'ios';

  return (
    <ThemedView style={styles.root}>
      <SafeAreaView style={styles.safeArea} edges={edges}>
        {/*
          Android ve tran vien nen cua so khong tu co lai khi ban phim mo: phai tu chua cho. Khung
          co lai thi ScrollView cua Android tu cuon toi o dang nhap. Phep tinh cua
          KeyboardAvoidingView chi dung khi man hinh nam sat mep tren cua so (route khong co header).
        */}
        <KeyboardAvoidingView
          behavior="padding"
          enabled={!isKeyboardHandledByScrollView}
          style={styles.keyboardAvoider}
        >
          {scrollable ? (
            <ScrollView
              automaticallyAdjustKeyboardInsets
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
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safeArea: { flex: 1, width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center' },
  keyboardAvoider: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  content: { flex: 1, padding: Spacing.four, gap: Spacing.three },
});
