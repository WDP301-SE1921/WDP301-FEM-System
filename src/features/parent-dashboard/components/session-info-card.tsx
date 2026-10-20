import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ui/themed-text';
import { ThemedView } from '@/components/ui/themed-view';
import { Radius, Spacing } from '@/constants/theme';
import { formatTime, getInitials } from '@/utils/format';

import { DAY_PERIOD_LABELS } from '../constants';
import type { AttendanceStatus, SessionDetail } from '../types';
import { formatLessonTitle, getAttendanceBadge, getDayPeriod, getMinutesBetween } from '../utils';

import { SectionCard } from './section-card';
import { SessionInfoRow } from './session-info-row';
import { ToneBadge } from './tone-badge';
import { ToneIcon } from './tone-icon';

/** Bang `ToneIcon` co `md` de cac dong thang hang. */
const TEACHER_AVATAR_SIZE = 36;

export type SessionInfoCardProps = {
  session: SessionDetail;
};

/**
 * Thoi gian, phong, giao vien, bai hoc va diem danh cua buoi hoc. Phong, giao vien va diem danh chi
 * hien khi co du lieu: buoi chua xep phong, giao vien chua dat ten hien thi, hoac con chua co trong
 * danh sach diem danh cua buoi.
 */
export function SessionInfoCard({ session }: SessionInfoCardProps) {
  const period = DAY_PERIOD_LABELS[getDayPeriod(session.startsAt)];
  const duration = getMinutesBetween(session.startsAt, session.endsAt);
  const { lesson } = session;
  const lessonTitle = lesson ? formatLessonTitle(lesson) : session.topic;

  return (
    <SectionCard title="Thông tin buổi học" icon="information-circle-outline">
      <View style={styles.rows}>
        <SessionInfoRow
          leading={<ToneIcon name="time-outline" tone="primary" />}
          label="Thời gian học"
          value={`${formatTime(session.startsAt)} – ${formatTime(session.endsAt)}`}
          hint={`${period} · ${duration} phút`}
        />
        {session.room ? (
          <SessionInfoRow
            leading={<ToneIcon name="location-outline" tone="accent" />}
            label="Phòng học"
            value={session.room}
          />
        ) : null}
        {session.teacherName ? (
          <SessionInfoRow
            leading={<TeacherAvatar name={session.teacherName} />}
            label="Giáo viên phụ trách"
            value={session.teacherName}
            hint={`Giáo viên môn ${session.subjectName}`}
          />
        ) : null}
        {lessonTitle ? (
          <SessionInfoRow
            leading={<ToneIcon name="book-outline" tone="primary" />}
            label="Nội dung bài học"
            value={lessonTitle}
            hint={lesson?.description}
          />
        ) : null}
        {session.status === 'CANCELLED' || session.attendance === null ? null : (
          <AttendanceRow session={session} attendance={session.attendance} />
        )}
      </View>
    </SectionCard>
  );
}

type AttendanceRowProps = SessionInfoCardProps & {
  attendance: AttendanceStatus;
};

function AttendanceRow({ session, attendance }: AttendanceRowProps) {
  const badge = getAttendanceBadge({ ...session, attendance });

  return (
    <SessionInfoRow
      leading={<ToneIcon name="checkmark-done-outline" tone={badge.tone} />}
      label="Trạng thái điểm danh"
      hint={session.checkedInAt ? `Vào lớp lúc ${formatTime(session.checkedInAt)}` : null}
    >
      <ToneBadge label={badge.label} tone={badge.tone} />
    </SessionInfoRow>
  );
}

function TeacherAvatar({ name }: { name: string }) {
  return (
    <ThemedView type="primarySoft" style={styles.avatar}>
      <ThemedText type="smallBold" themeColor="primaryStrong">
        {getInitials(name)}
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  rows: { gap: Spacing.two },
  avatar: {
    width: TEACHER_AVATAR_SIZE,
    height: TEACHER_AVATAR_SIZE,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
