import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { ThemedText } from '@/components/ui/themed-text';
import { ThemedView } from '@/components/ui/themed-view';
import { Radius, Spacing } from '@/constants/theme';

const ILLUSTRATION_SIZE = 80;
const ICON_SIZE = 40;
const TEXT_MAX_WIDTH = 320;

export type LinkSuccessProps = {
  studentName: string;
  onDone: () => void;
};

/** Bao lien ket con thanh cong, dua phu huynh ve trang chu de xem con vua them. */
export function LinkSuccess({ studentName, onDone }: LinkSuccessProps) {
  return (
    <View style={styles.container}>
      <View style={styles.message}>
        <ThemedView type="successSoft" style={styles.illustration}>
          <Icon name="checkmark-circle" size={ICON_SIZE} themeColor="success" />
        </ThemedView>
        <ThemedText type="heading" accessibilityRole="header" style={styles.center}>
          Đã thêm con vào tài khoản
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={[styles.center, styles.text]}>
          {studentName} đã được liên kết. Bạn có thể theo dõi việc học của con ngay ở trang chủ.
        </ThemedText>
      </View>

      <Button title="Về trang chủ" icon="home-outline" onPress={onDone} style={styles.pill} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', gap: Spacing.five },
  message: { alignItems: 'center', gap: Spacing.two },
  illustration: {
    width: ILLUSTRATION_SIZE,
    height: ILLUSTRATION_SIZE,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.two,
  },
  center: { textAlign: 'center' },
  text: { maxWidth: TEXT_MAX_WIDTH },
  pill: { borderRadius: Radius.full },
});
