import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { ThemedText } from '@/components/ui/themed-text';
import { ThemedView } from '@/components/ui/themed-view';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { SubmittedImage } from './submitted-image';

/** Vung cham toi thieu 44x44 (design-mobile.md). */
const CLOSE_BUTTON_SIZE = 44;
const CLOSE_ICON_SIZE = 20;

export type SubmittedImageViewerProps = {
  fileIds: readonly string[];
  /** Vi tri anh dang xem trong `fileIds`; null khi dong. */
  index: number | null;
  onChangeIndex: (index: number) => void;
  onClose: () => void;
};

/** Xem tron mot anh bai lam da nop tren ca man hinh, chuyen qua lai giua cac anh cua lan nop. */
export function SubmittedImageViewer({
  fileIds,
  index,
  onChangeIndex,
  onClose,
}: SubmittedImageViewerProps) {
  const theme = useTheme();
  const current = index ?? 0;
  const fileId = index === null ? undefined : fileIds[index];
  const position = current + 1;

  return (
    <Modal
      visible={fileId !== undefined}
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <ThemedView accessibilityViewIsModal style={styles.root}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <ThemedText type="heading" accessibilityRole="header" style={styles.title}>
              Ảnh bài làm {position}/{fileIds.length}
            </ThemedText>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Đóng"
              onPress={onClose}
              style={({ pressed }) => [
                styles.close,
                { backgroundColor: theme.backgroundElement },
                pressed && styles.pressed,
              ]}
            >
              <Icon name="close" size={CLOSE_ICON_SIZE} />
            </Pressable>
          </View>

          {fileId ? (
            <SubmittedImage
              // Doi anh thi dung lai tu dau, khong giu trang thai loi cua anh truoc
              key={fileId}
              fileId={fileId}
              contentFit="contain"
              accessibilityLabel={`Ảnh bài làm ${position}`}
              style={styles.image}
            />
          ) : null}

          {fileIds.length > 1 ? (
            <View style={styles.footer}>
              <Button
                title="Ảnh trước"
                variant="secondary"
                icon="chevron-back"
                accessibilityLabel="Ảnh trước"
                disabled={current === 0}
                onPress={() => onChangeIndex(current - 1)}
                style={styles.nav}
              />
              <Button
                title="Ảnh sau"
                variant="secondary"
                trailingIcon="chevron-forward"
                accessibilityLabel="Ảnh sau"
                disabled={current === fileIds.length - 1}
                onPress={() => onChangeIndex(current + 1)}
                style={styles.nav}
              />
            </View>
          ) : null}
        </SafeAreaView>
      </ThemedView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safeArea: { flex: 1, gap: Spacing.three, padding: Spacing.three },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  title: { flex: 1 },
  close: {
    width: CLOSE_BUTTON_SIZE,
    height: CLOSE_BUTTON_SIZE,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.75 },
  image: { flex: 1, width: '100%', borderRadius: Radius.lg },
  footer: { flexDirection: 'row', gap: Spacing.two },
  nav: { flex: 1, borderRadius: Radius.full },
});
