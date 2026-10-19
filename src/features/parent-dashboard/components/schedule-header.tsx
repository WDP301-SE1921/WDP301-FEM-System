import { Pressable, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { ThemedText } from '@/components/ui/themed-text';
import { ThemedView } from '@/components/ui/themed-view';
import { Radius, Spacing } from '@/constants/theme';
import { getInitials, getShortName } from '@/utils/format';

import type { LinkedStudent } from '../types';
import { formatWeekRange } from '../utils';

const WEEK_BUTTON_HEIGHT = 36;
/** Bu phan thieu cua `WEEK_BUTTON_HEIGHT` de vung cham dat 44x44 (design-mobile.md). */
const WEEK_BUTTON_HIT_SLOP = 4;
const STUDENT_BUTTON_HEIGHT = 44;
const AVATAR_SIZE = 36;
const CHEVRON_SIZE = 16;
/** Du cho ten hai tu, ten dai hon bi cat bot. */
const STUDENT_NAME_MAX_WIDTH = 96;

export type ScheduleHeaderProps = {
  weekStart: Date;
  /** Con dang xem. Chua co con (dang tai, loi, chua lien ket) thi an nut chon tuan va chon con. */
  student: LinkedStudent | undefined;
  /** Khong truyen khi khong xem lich tuan (mon hoc, diem danh): an nut chon tuan. */
  onPressWeek?: () => void;
  onPressStudent: () => void;
};

/** Tieu de man hinh lich hoc, nut chon tuan va nut chon con dang xem. */
export function ScheduleHeader({
  weekStart,
  student,
  onPressWeek,
  onPressStudent,
}: ScheduleHeaderProps) {
  const weekRange = formatWeekRange(weekStart);

  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <ThemedText type="heading" accessibilityRole="header" style={styles.title}>
          Lịch học
        </ThemedText>
        {student ? <StudentButton student={student} onPress={onPressStudent} /> : null}
      </View>

      {/* Hang rieng duoi tieu de: dat canh nut chon con thi man hinh 360dp khong du cho khoang tuan */}
      {student && onPressWeek ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Chọn tuần, đang xem tuần ${weekRange}`}
          hitSlop={WEEK_BUTTON_HIT_SLOP}
          onPress={onPressWeek}
          style={({ pressed }) => [styles.weekPressable, pressed && styles.pressed]}
        >
          <ThemedView type="primarySoft" style={[styles.pill, styles.weekButton]}>
            <ThemedText type="smallBold" themeColor="primary" style={styles.weekText}>
              Tuần: {weekRange}
            </ThemedText>
            <Icon name="chevron-down" size={CHEVRON_SIZE} themeColor="primary" />
          </ThemedView>
        </Pressable>
      ) : null}
    </View>
  );
}

type StudentButtonProps = {
  student: LinkedStudent;
  onPress: () => void;
};

/** Avatar, ten va lop cua con dang xem; bam de mo danh sach chon con. */
function StudentButton({ student, onPress }: StudentButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Chọn học sinh, đang xem ${student.fullName}`}
      onPress={onPress}
      style={({ pressed }) => [pressed && styles.pressed]}
    >
      <ThemedView type="backgroundElement" style={[styles.pill, styles.studentButton]}>
        <ThemedView type="primary" style={styles.avatar}>
          <ThemedText type="smallBold" themeColor="primaryText">
            {getInitials(student.fullName)}
          </ThemedText>
        </ThemedView>
        <View>
          <View style={styles.pill}>
            <ThemedText type="smallBold" numberOfLines={1} style={styles.studentName}>
              {getShortName(student.fullName)}
            </ThemedText>
            <Icon name="chevron-expand" size={CHEVRON_SIZE} themeColor="textSecondary" />
          </View>
          <ThemedText type="small" themeColor="primary">
            Lớp {student.grade}
          </ThemedText>
        </View>
      </ThemedView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.one },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  title: { flexShrink: 1 },
  pressed: { opacity: 0.75 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  weekPressable: { alignSelf: 'flex-start', maxWidth: '100%' },
  weekText: { flexShrink: 1 },
  weekButton: {
    minHeight: WEEK_BUTTON_HEIGHT,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.full,
  },
  studentButton: {
    minHeight: STUDENT_BUTTON_HEIGHT,
    gap: Spacing.two,
    padding: Spacing.one,
    paddingRight: Spacing.three,
    borderRadius: Radius.full,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  studentName: { maxWidth: STUDENT_NAME_MAX_WIDTH },
});
