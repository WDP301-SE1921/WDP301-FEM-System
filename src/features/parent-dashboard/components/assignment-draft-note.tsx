import { StyleSheet } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { ThemedText } from '@/components/ui/themed-text';
import { ThemedView } from '@/components/ui/themed-view';
import { Radius, Spacing } from '@/constants/theme';

const ICON_SIZE = 16;

export type AssignmentDraftNoteProps = {
  /** true khi vua mo lai bai lam dang do tu lan truoc. */
  isRestored: boolean;
};

/** Bao bai lam dang duoc tu luu, de con yen tam roi man hinh giua chung. */
export function AssignmentDraftNote({ isRestored }: AssignmentDraftNoteProps) {
  return (
    <ThemedView type="backgroundElement" style={styles.note}>
      <Icon name="save-outline" size={ICON_SIZE} themeColor="textSecondary" />
      <ThemedText type="small" themeColor="textSecondary" style={styles.text}>
        {isRestored
          ? 'Đã mở lại bài làm đang dở. Bài làm được tự lưu trên máy này cho tới khi nộp.'
          : 'Bài làm được tự lưu trên máy này, thoát ra rồi mở lại vẫn còn.'}
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  note: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.two,
    borderRadius: Radius.control,
  },
  text: { flex: 1 },
});
