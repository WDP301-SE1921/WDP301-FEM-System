import { StyleSheet, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { ThemedText } from '@/components/ui/themed-text';
import { Spacing } from '@/constants/theme';

const ICON_SIZE = 16;

export type QuestionFileNoteProps = {
  /** Nhan cac tep gan voi cau, vd `["Ảnh 1", "PDF 1"]`. */
  labels: readonly string[];
};

/** Dong nho duoi mot cau: bai lam cua cau nay nam trong tep nao gui kem. */
export function QuestionFileNote({ labels }: QuestionFileNoteProps) {
  return (
    <View style={styles.row}>
      <Icon name="attach-outline" size={ICON_SIZE} themeColor="primary" />
      <ThemedText type="small" themeColor="textSecondary" style={styles.text}>
        Bài làm gửi kèm: {labels.join(', ')}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  text: { flex: 1 },
});
