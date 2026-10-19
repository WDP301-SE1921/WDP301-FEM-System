import { StyleSheet, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { ThemedText } from '@/components/ui/themed-text';
import { ThemedView } from '@/components/ui/themed-view';
import { Radius, Spacing } from '@/constants/theme';
import { formatTime, getInitials } from '@/utils/format';

import { SESSION_STATUSES } from '../constants';
import type { ClassSession } from '../types';
import { getSessionStatus } from '../utils';

import { ActionChip } from './action-chip';
import { SectionCard } from './section-card';
import { ToneBadge } from './tone-badge';

const TITLE = 'Buổi học hôm nay';
const DETAIL_ICON_SIZE = 18;
const TEACHER_AVATAR_SIZE = 36;

export type TodaySessionsProps = {
  sessions: ClassSession[];
  /** Mo bai tap cua con de chuan bi truoc buoi hoc sap dien ra. */
  onPrepare: () => void;
};

/** Moi buoi hoc hom nay mot the. Khong co buoi nao thi van giu the de phu huynh biet. */
export function TodaySessions({ sessions, onPrepare }: TodaySessionsProps) {
  if (sessions.length === 0) {
    return (
      <SectionCard title={TITLE} icon="calendar-outline">
        <ThemedText type="small" themeColor="textSecondary">
          Hôm nay học sinh không có buổi học nào.
        </ThemedText>
      </SectionCard>
    );
  }

  return (
    <>
      {sessions.map((session) => (
        <TodaySessionCard key={session.id} session={session} onPrepare={onPrepare} />
      ))}
    </>
  );
}

function TodaySessionCard({
  session,
  onPrepare,
}: {
  session: ClassSession;
  onPrepare: () => void;
}) {
  const statusKey = getSessionStatus(session);
  const status = SESSION_STATUSES[statusKey];

  return (
    <SectionCard
      title={TITLE}
      icon="calendar-outline"
      highlightTone="accent"
      trailing={<ToneBadge label={status.label} tone={status.tone} />}
    >
      <View style={styles.details}>
        <ThemedText type="heading">{session.className}</ThemedText>
        <View style={styles.meta}>
          <View style={styles.metaItem}>
            <Icon name="time-outline" size={DETAIL_ICON_SIZE} themeColor="accent" />
            <ThemedText type="smallBold">
              {formatTime(session.startsAt)} – {formatTime(session.endsAt)}
            </ThemedText>
          </View>
          {session.room ? (
            <View style={styles.metaItem}>
              <Icon name="location-outline" size={DETAIL_ICON_SIZE} themeColor="primary" />
              <ThemedText type="small" themeColor="textSecondary">
                {session.room}
              </ThemedText>
            </View>
          ) : null}
        </View>
      </View>

      <ThemedView style={styles.teacher}>
        <ThemedView type="primary" style={styles.teacherAvatar}>
          {session.teacherName ? (
            <ThemedText type="smallBold" themeColor="primaryText">
              {getInitials(session.teacherName)}
            </ThemedText>
          ) : (
            <Icon name="book-outline" size={DETAIL_ICON_SIZE} themeColor="primaryText" />
          )}
        </ThemedView>
        {/* Chua co ten giao vien thi chi hien mon hoc */}
        <View style={styles.teacherInfo}>
          <ThemedText type="smallBold" numberOfLines={1}>
            {session.teacherName ?? `Môn ${session.subjectName}`}
          </ThemedText>
          {session.teacherName ? (
            <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
              Giáo viên môn {session.subjectName}
            </ThemedText>
          ) : null}
        </View>
        {/* Buoi da bat dau hoac da xong thi khong con gi de chuan bi */}
        {statusKey === 'UPCOMING' ? (
          <ActionChip
            label="Chuẩn bị bài"
            trailingIcon="arrow-forward"
            accessibilityLabel={`Chuẩn bị bài cho buổi ${session.className}`}
            onPress={onPrepare}
          />
        ) : null}
      </ThemedView>
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  details: { gap: Spacing.two },
  meta: { flexDirection: 'row', flexWrap: 'wrap', columnGap: Spacing.three, rowGap: Spacing.one },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  teacher: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.two,
    borderRadius: Radius.control,
  },
  teacherAvatar: {
    width: TEACHER_AVATAR_SIZE,
    height: TEACHER_AVATAR_SIZE,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  teacherInfo: { flex: 1 },
});
