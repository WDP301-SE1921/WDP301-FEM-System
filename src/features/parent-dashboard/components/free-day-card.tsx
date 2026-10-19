import { StyleSheet } from 'react-native';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { ThemedText } from '@/components/ui/themed-text';
import { ThemedView } from '@/components/ui/themed-view';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const ICON_CIRCLE_SIZE = 64;
const ICON_SIZE = 32;

export type FreeDayCardProps = {
  /** Ten goi cua con, vd `Minh Anh`. */
  studentName: string;
  isToday: boolean;
  onOpenAssignments: () => void;
};

/** Ngay dang chon khong co buoi hoc: goi y on bai o nha thay vi de trang. */
export function FreeDayCard({ studentName, isToday, onOpenAssignments }: FreeDayCardProps) {
  const theme = useTheme();

  return (
    <ThemedView type="backgroundElement" style={[styles.card, { borderColor: theme.border }]}>
      <ThemedView type="primarySoft" style={styles.iconCircle}>
        <Icon name="sunny-outline" size={ICON_SIZE} themeColor="primary" />
      </ThemedView>
      <ThemedText type="default" style={[styles.center, styles.title]}>
        {isToday ? 'Hôm nay học sinh không có buổi học' : 'Ngày này học sinh không có buổi học'}
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary" style={styles.center}>
        {studentName} có thể dành thời gian nghỉ ngơi, tự ôn tập hoặc tham gia các hoạt động ngoại
        khóa.
      </ThemedText>
      <Button
        title="Xem bài tập về nhà"
        icon="document-text-outline"
        onPress={onOpenAssignments}
        style={styles.button}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.four,
    borderWidth: 1,
    borderRadius: Radius.lg,
  },
  iconCircle: {
    width: ICON_CIRCLE_SIZE,
    height: ICON_CIRCLE_SIZE,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.two,
  },
  center: { textAlign: 'center' },
  title: { fontWeight: 700 },
  button: { alignSelf: 'stretch', marginTop: Spacing.three, borderRadius: Radius.full },
});
