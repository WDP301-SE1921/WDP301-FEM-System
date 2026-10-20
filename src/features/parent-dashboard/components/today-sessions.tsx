import { Pressable, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { ThemedText } from '@/components/ui/themed-text';
import { ThemedView } from '@/components/ui/themed-view';
import { Radius, Spacing } from '@/constants/theme';
import { formatTime, getInitials } from '@/utils/format';

import { SESSION_STATUSES, SESSION_TYPES, type StatusAppearance } from '../constants';
import type { ScheduleSession } from '../types';
import { getSessionStatus } from '../utils';

import { ActionChip } from './action-chip';
import { SectionCard } from './section-card';
import { ToneBadge } from './tone-badge';

const TITLE = 'Buổi học hôm nay';
const DETAIL_ICON_SIZE = 18;
const CHEVRON_SIZE = 18;
const TEACHER_AVATAR_SIZE = 36;
const TEACHER_INFO_MIN_WIDTH = 120;

export type TodaySessionsProps = {
  sessions: ScheduleSession[];
  /** Bam vao the: mo chi tiet buoi hoc. */
  onOpenSession: (sessionId: string) => void;
  /** Mo bai tap cua con de chuan bi truoc buoi hoc sap dien ra. */
  onPrepare: () => void;
};

/** Moi buoi hoc hom nay mot the. Khong co buoi nao thi van giu the de phu huynh biet. */
export function TodaySessions({ sessions, onOpenSession, onPrepare }: TodaySessionsProps) {
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
        <TodaySessionCard
          key={session.id}
          session={session}
          onOpen={() => onOpenSession(session.id)}
          onPrepare={onPrepare}
        />
      ))}
    </>
  );
}

/** Buoi bi huy bao huy thay cho trang thai theo gio. */
function getTodayStatus(session: ScheduleSession): StatusAppearance {
  const { badge, tone } = SESSION_TYPES[session.type];
  if (session.type === 'CANCELLED' && badge) return { label: badge.label, tone, icon: badge.icon };
  return SESSION_STATUSES[getSessionStatus(session)];
}

type TodaySessionCardProps = {
  session: ScheduleSession;
  onOpen: () => void;
  onPrepare: () => void;
};

function TodaySessionCard({ session, onOpen, onPrepare }: TodaySessionCardProps) {
  const isCancelled = session.type === 'CANCELLED';
  const status = getTodayStatus(session);
  const canPrepare = !isCancelled && getSessionStatus(session) === 'UPCOMING';
  const time = `${formatTime(session.startsAt)} – ${formatTime(session.endsAt)}`;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${TITLE}: ${session.className}, ${time}, ${status.label}`}
      accessibilityHint="Xem chi tiết buổi học"
      // Ca the la mot nut voi trinh doc man hinh, nen nut "Chuẩn bị bài" ben trong thanh thao tac phu
      accessibilityActions={canPrepare ? [{ name: 'prepare', label: 'Chuẩn bị bài' }] : undefined}
      onAccessibilityAction={({ nativeEvent }) => {
        if (nativeEvent.actionName === 'prepare') onPrepare();
      }}
      onPress={onOpen}
      style={({ pressed }) => [pressed && styles.pressed]}
    >
      <SectionCard
        title={TITLE}
        icon="calendar-outline"
        highlightTone={isCancelled ? 'danger' : 'accent'}
        trailing={<ToneBadge label={status.label} tone={status.tone} icon={status.icon} />}
      >
        <View style={styles.details}>
          <View style={styles.titleRow}>
            <ThemedText type="heading" style={styles.title}>
              {session.className}
            </ThemedText>
            <Icon name="chevron-forward" size={CHEVRON_SIZE} themeColor="textSecondary" />
          </View>
          <View style={styles.meta}>
            <View style={styles.metaItem}>
              <Icon name="time-outline" size={DETAIL_ICON_SIZE} themeColor="accent" />
              <ThemedText type="smallBold">{time}</ThemedText>
            </View>
            {session.room ? (
              <View style={styles.metaItem}>
                <Icon name="location-outline" size={DETAIL_ICON_SIZE} themeColor="primary" />
                <ThemedText type="small" themeColor="textSecondary" style={styles.metaText}>
                  {session.room}
                </ThemedText>
              </View>
            ) : null}
          </View>
        </View>

        {/* Chi buoi bi huy co ghi chu: ly do huy cua trung tam */}
        {session.note ? (
          <ThemedText type="small" themeColor="textSecondary">
            {SESSION_TYPES[session.type].noteTitle}: {session.note}
          </ThemedText>
        ) : null}

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
          {/* Buoi bi huy, da bat dau hoac da xong thi khong con gi de chuan bi */}
          {canPrepare ? (
            <ActionChip
              label="Chuẩn bị bài"
              trailingIcon="arrow-forward"
              accessibilityLabel={`Chuẩn bị bài cho buổi ${session.className}`}
              onPress={onPrepare}
            />
          ) : null}
        </ThemedView>
      </SectionCard>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.75 },
  details: { gap: Spacing.two },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  title: { flex: 1 },
  meta: { flexDirection: 'row', flexWrap: 'wrap', columnGap: Spacing.three, rowGap: Spacing.one },
  metaItem: { flexShrink: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  metaText: { flexShrink: 1 },
  // Khong du cho cho ten giao vien rong toi thieu TEACHER_INFO_MIN_WIDTH (man hinh 360dp) thi nut
  // "Chuẩn bị bài" roi xuong hang duoi, can phai, thay vi cat ten giao vien con vai chu
  teacher: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'flex-end',
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
  teacherInfo: { flexGrow: 1, flexShrink: 1, flexBasis: TEACHER_INFO_MIN_WIDTH },
});
