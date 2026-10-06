import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { ThemedText } from '@/components/ui/themed-text';
import { ThemedView } from '@/components/ui/themed-view';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import type { RoadmapLesson, SessionLink, StudentEnrollment } from '../types';
import { formatLessonSchedule, getLessonBadge } from '../utils';

import { CourseTeacherRow } from './course-teacher-row';
import { LessonAssignmentRow } from './lesson-assignment-row';
import { ToneBadge } from './tone-badge';

const ICON_SIZE = 16;
const CARD_BORDER_WIDTH = 2;

export type CurrentLessonCardProps = {
  lesson: RoadmapLesson;
  enrollment: Pick<StudentEnrollment, 'teacherName' | 'room'>;
  onOpenSession: (session: SessionLink) => void;
  onOpenAssignments: () => void;
};

/** The lam noi bai con dang hoc: buoi hoc sap toi, giao vien, phong, bai tap va nut xem buoi hoc. */
export function CurrentLessonCard({
  lesson,
  enrollment,
  onOpenSession,
  onOpenAssignments,
}: CurrentLessonCardProps) {
  const theme = useTheme();
  const { session, assignment } = lesson;
  // BE chua tra giao vien va phong hoc: thieu ca hai thi an khoi thong tin lop
  const hasClassInfo = Boolean(enrollment.teacherName) || Boolean(enrollment.room);

  return (
    <ThemedView style={[styles.card, { borderColor: theme.primary }]}>
      <View style={styles.header}>
        <ToneBadge {...getLessonBadge(lesson)} />
        <ThemedText type="smallBold" themeColor="primary" style={styles.schedule}>
          {formatLessonSchedule(lesson)}
        </ThemedText>
      </View>

      <View style={styles.titleBlock}>
        <ThemedText type="heading">
          Bài {lesson.sequence}: {lesson.title}
        </ThemedText>
        {lesson.description ? (
          <ThemedText type="small" themeColor="textSecondary">
            {lesson.description}
          </ThemedText>
        ) : null}
      </View>

      {hasClassInfo ? (
        <ThemedView type="backgroundElement" style={styles.classInfo}>
          <CourseTeacherRow
            teacherName={enrollment.teacherName}
            averageScore={null}
            tone="primary"
          />
          {enrollment.room ? (
            <View style={styles.room}>
              <Icon name="location-outline" size={ICON_SIZE} themeColor="textSecondary" />
              <ThemedText type="small" themeColor="textSecondary">
                Phòng {enrollment.room}
              </ThemedText>
            </View>
          ) : null}
        </ThemedView>
      ) : null}

      {assignment ? (
        <LessonAssignmentRow assignment={assignment} onPress={onOpenAssignments} />
      ) : null}
      {session ? (
        <Button
          title="Xem chi tiết buổi học"
          icon="book-outline"
          onPress={() => onOpenSession(session)}
        />
      ) : null}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: CARD_BORDER_WIDTH,
    borderRadius: Radius.xl,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  schedule: { flexShrink: 1, textAlign: 'right' },
  titleBlock: { gap: Spacing.one },
  classInfo: { gap: Spacing.two, padding: Spacing.two, borderRadius: Radius.lg },
  room: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
});
