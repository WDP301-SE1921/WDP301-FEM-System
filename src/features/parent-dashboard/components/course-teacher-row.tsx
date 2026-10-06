import { StyleSheet, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { ThemedText } from '@/components/ui/themed-text';
import { ThemedView } from '@/components/ui/themed-view';
import { Radius, Spacing } from '@/constants/theme';
import { getInitials } from '@/utils/format';

import { TONES, type Tone } from '../constants';
import { formatScore } from '../utils';

const AVATAR_SIZE = 32;
const ICON_SIZE = 16;

export type CourseTeacherRowProps = {
  /** null khi app chua co ten giao vien (BE chua tra cho phu huynh). */
  teacherName: string | null;
  /** null khi con chua co diem mon nay. */
  averageScore: number | null;
  tone: Tone;
};

/** Giao vien cua lop va diem trung binh mon cua con. Thieu ca hai thi khong hien gi. */
export function CourseTeacherRow({ teacherName, averageScore, tone }: CourseTeacherRowProps) {
  const { color, soft } = TONES[tone];
  if (!teacherName && averageScore === null) return null;

  return (
    <View style={styles.container}>
      {teacherName ? (
        <View style={styles.teacher}>
          <ThemedView type={soft} style={styles.avatar}>
            <ThemedText type="smallBold" themeColor={color}>
              {getInitials(teacherName)}
            </ThemedText>
          </ThemedView>
          <ThemedText type="smallBold" numberOfLines={1} style={styles.teacherName}>
            {teacherName}
          </ThemedText>
        </View>
      ) : null}

      {averageScore === null ? null : (
        <View
          accessible
          accessibilityLabel={`Điểm trung bình ${formatScore(averageScore)}`}
          style={styles.score}
        >
          <Icon name="star" size={ICON_SIZE} themeColor="accent" />
          <ThemedText type="smallBold">{formatScore(averageScore)}</ThemedText>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  teacher: { flexShrink: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  teacherName: { flexShrink: 1 },
  score: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
});
