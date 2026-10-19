import type { PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';

import { Icon, type IconName } from '@/components/ui/icon';
import { ThemedText } from '@/components/ui/themed-text';
import { ThemedView } from '@/components/ui/themed-view';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { COURSE_STATUSES, DEFAULT_SUBJECT_ICON, SUBJECT_ICONS, TONES } from '../constants';
import type { SessionLink, StudentEnrollment } from '../types';
import { formatWeeklySlots, getCourseProgress, getCourseStatus } from '../utils';

import { CourseFooter } from './course-footer';
import { CourseProgress } from './course-progress';
import { CourseTeacherRow } from './course-teacher-row';
import { ToneBadge } from './tone-badge';
import { ToneIcon } from './tone-icon';

const HIGHLIGHT_WIDTH = 6;
const DETAIL_ICON_SIZE = 16;

export type CourseCardProps = {
  enrollment: StudentEnrollment;
  /** Mo chi tiet buoi tiep theo cua mon. */
  onOpenSession: (session: SessionLink) => void;
};

/** The mot mon cua con: lop, giao vien, diem, lich co dinh, tien do va dong cuoi theo trang thai. */
export function CourseCard({ enrollment, onOpenSession }: CourseCardProps) {
  const theme = useTheme();
  const status = getCourseStatus(enrollment);
  const { label, tone, progressLabel } = COURSE_STATUSES[status];
  const progress = getCourseProgress(enrollment);
  const isStudying = status === 'ACTIVE';

  return (
    <ThemedView type="backgroundElement" style={[styles.card, { borderColor: theme.border }]}>
      {isStudying ? (
        <View style={[styles.highlight, { backgroundColor: theme[TONES[tone].color] }]} />
      ) : null}

      <View style={styles.header}>
        <ToneIcon
          name={SUBJECT_ICONS[enrollment.subjectName] ?? DEFAULT_SUBJECT_ICON}
          tone={tone}
          size="lg"
        />
        <View style={styles.titleBlock}>
          <ThemedText type="default" accessibilityRole="header" style={styles.title}>
            {enrollment.className}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {enrollment.programName}
          </ThemedText>
        </View>
        <ToneBadge label={label} tone={tone} />
      </View>

      <CourseTeacherRow
        teacherName={enrollment.teacherName}
        averageScore={enrollment.averageScore}
        tone={tone}
      />

      {/* Lich co dinh va phong hoc chi co y nghia khi con dang di hoc */}
      {isStudying ? (
        <ClassTimetable
          slotLines={formatWeeklySlots(enrollment.weeklySlots)}
          room={enrollment.room}
        />
      ) : null}

      {progress === null ? null : (
        <CourseProgress
          label={progressLabel}
          completedSessions={enrollment.completedSessions}
          totalSessions={enrollment.totalSessions}
          percent={progress}
          tone={tone}
        />
      )}

      <CourseFooter enrollment={enrollment} onOpenSession={onOpenSession} />
    </ThemedView>
  );
}

type ClassTimetableProps = {
  slotLines: string[];
  room: string | null;
};

function ClassTimetable({ slotLines, room }: ClassTimetableProps) {
  return (
    <>
      {slotLines.length > 0 ? (
        <DetailRow icon="time-outline">
          {slotLines.map((line) => (
            <ThemedText key={line} type="small">
              {line}
            </ThemedText>
          ))}
        </DetailRow>
      ) : null}
      {room ? (
        <DetailRow icon="location-outline">
          <ThemedText type="small">{room}</ThemedText>
        </DetailRow>
      ) : null}
    </>
  );
}

function DetailRow({ icon, children }: PropsWithChildren<{ icon: IconName }>) {
  return (
    <View style={styles.detailRow}>
      <Icon
        name={icon}
        size={DETAIL_ICON_SIZE}
        themeColor="textSecondary"
        style={styles.detailIcon}
      />
      <View style={styles.detailText}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.three,
    gap: Spacing.three,
    overflow: 'hidden',
  },
  highlight: { position: 'absolute', left: 0, top: 0, bottom: 0, width: HIGHLIGHT_WIDTH },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.three },
  titleBlock: { flex: 1, gap: Spacing.half },
  title: { fontWeight: 700 },
  detailRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.two },
  // Can icon voi dong chu dau tien (lineHeight 20 cua chu `small`)
  detailIcon: { marginTop: Spacing.half },
  detailText: { flex: 1 },
});
