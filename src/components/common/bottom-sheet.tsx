import type { PropsWithChildren } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon } from '@/components/ui/icon';
import { ThemedText } from '@/components/ui/themed-text';
import { ThemedView } from '@/components/ui/themed-view';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** Vung cham toi thieu 44x44 (design-mobile.md). */
const CLOSE_BUTTON_SIZE = 44;
const CLOSE_ICON_SIZE = 20;
const HANDLE_WIDTH = 48;
const HANDLE_HEIGHT = 6;
/** Chua lai mot khoang phia tren de nguoi dung thay day la sheet, bam ra ngoai de dong. */
const SHEET_MAX_HEIGHT = '85%';

export type BottomSheetProps = PropsWithChildren<{
  isVisible: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
}>;

/** Sheet truot tu duoi len: tieu de, nut dong, noi dung ben duoi. Bam lop phu cung dong sheet. */
export function BottomSheet({ isVisible, title, subtitle, onClose, children }: BottomSheetProps) {
  const theme = useTheme();

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.root}>
        {/* Nguoi dung trinh doc man hinh dong bang nut "Đóng" nen lop phu khong can focus */}
        <Pressable
          accessible={false}
          onPress={onClose}
          style={[StyleSheet.absoluteFill, { backgroundColor: theme.overlay }]}
        />

        <ThemedView accessibilityViewIsModal style={styles.sheet}>
          <SafeAreaView edges={['bottom']} style={styles.safeArea}>
            <View style={[styles.handle, { backgroundColor: theme.backgroundSelected }]} />

            <View style={[styles.header, { borderBottomColor: theme.border }]}>
              <View style={styles.titleBlock}>
                <ThemedText type="heading" accessibilityRole="header">
                  {title}
                </ThemedText>
                {subtitle ? (
                  <ThemedText type="small" themeColor="textSecondary">
                    {subtitle}
                  </ThemedText>
                ) : null}
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Đóng"
                onPress={onClose}
                style={({ pressed }) => [
                  styles.closeButton,
                  { backgroundColor: theme.backgroundElement },
                  pressed && styles.pressed,
                ]}
              >
                <Icon name="close" size={CLOSE_ICON_SIZE} />
              </Pressable>
            </View>

            {children}
          </SafeAreaView>
        </ThemedView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    maxHeight: SHEET_MAX_HEIGHT,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    overflow: 'hidden',
  },
  safeArea: { flexShrink: 1, paddingHorizontal: Spacing.three, paddingBottom: Spacing.three },
  handle: {
    width: HANDLE_WIDTH,
    height: HANDLE_HEIGHT,
    borderRadius: Radius.full,
    alignSelf: 'center',
    marginVertical: Spacing.three,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
    paddingBottom: Spacing.three,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  titleBlock: { flex: 1, gap: Spacing.half },
  closeButton: {
    width: CLOSE_BUTTON_SIZE,
    height: CLOSE_BUTTON_SIZE,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.75 },
});
