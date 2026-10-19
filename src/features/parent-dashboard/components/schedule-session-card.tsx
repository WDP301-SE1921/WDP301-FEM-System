import { Pressable, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { ThemedText } from '@/components/ui/themed-text';
import { ThemedView } from '@/components/ui/themed-view';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatTime, getInitials } from '@/utils/format';

import { DAY_PERIOD_LABELS, SESSION_STATUSES, SESSION_TYPES, TONES, type Tone } from '../constants';
import type { ScheduleSession } from '../types';
import { getDayPeriod, getSessionStatus } from '../utils';

import { ToneBadge } from './tone-badge';

const HIGHLIGHT_WIDTH = 6;
const TIME_ICON_SIZE = 18;
const DETAIL_ICON_SIZE = 16;
const TEACHER_AVATAR_SIZE = 32;
const CHEVRON_SIZE = 18;

type SessionBadgeProps = {
  session: ScheduleSession;
  /** Buoi co dinh chi hien trang thai (sap / dang dien ra / da ket thuc) khi la ngay hom nay. */
  isToday: boolean;
};

export type ScheduleSessionCardProps = SessionBadgeProps & {
  /** Mo chi tiet buoi hoc. */
  onPress: () => void;
};

/** Mot buoi trong lich: gio, lop, ghi chu cua trung tam, giao vien (hoac mon) va phong hoc. */
export function ScheduleSessionCard({ session, isToday, onPress }: ScheduleSessionCardProps) {
  const theme = useTheme();
  const appearance = SESSION_TYPES[session.type];
  const tone = TONES[appearance.tone];
  const title = session.topic ? `${session.className} – ${session.topic}` : session.className;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityHint="Xem chi tiết buổi học"
      onPress={onPress}
      style={({ pressed }) => [pressed && styles.pressed]}
    >
      <ThemedView type="backgroundElement" style={[styles.card, { borderColor: theme.border }]}>
        <View style={[styles.highlight, { backgroundColor: theme[tone.color] }]} />

        <View style={styles.header}>
          <View style={styles.row}>
            <Icon name="time-outline" size={TIME_ICON_SIZE} themeColor={tone.color} />
            <ThemedText type="smallBold">
              {formatTime(session.startsAt)} – {formatTime(session.endsAt)}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              ({DAY_PERIOD_LABELS[getDayPeriod(session.startsAt)]})
            </ThemedText>
          </View>
          <SessionBadge session={session} isToday={isToday} />
        </View>

        <View style={styles.titleRow}>
          <ThemedText type="default" style={styles.title}>
            {title}
          </ThemedText>
          <Icon name="chevron-forward" size={CHEVRON_SIZE} themeColor="textSecondary" />
        </View>

        {session.note ? (
          <ThemedView type={tone.soft} style={styles.note}>
            <Icon name={appearance.noteIcon} size={DETAIL_ICON_SIZE} themeColor={tone.color} />
            <ThemedText type="small" style={styles.noteText}>
              {session.note}
            </ThemedText>
          </ThemedView>
        ) : null}

        <View style={styles.footer}>
          <SessionTeacher
            teacherName={session.teacherName}
            subjectName={session.subjectName}
            tone={appearance.tone}
          />
          {session.room ? (
            <ThemedView style={[styles.row, styles.room]}>
              <Icon name="location-outline" size={DETAIL_ICON_SIZE} themeColor={tone.color} />
              <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
                {session.room}
              </ThemedText>
            </ThemedView>
          ) : null}
        </View>
      </ThemedView>
    </Pressable>
  );
}

type SessionTeacherProps = Pick<ScheduleSession, 'teacherName' | 'subjectName'> & { tone: Tone };

/** Giao vien cua buoi. Chua co ten giao vien thi chi hien mon hoc. */
function SessionTeacher({ teacherName, subjectName, tone }: SessionTeacherProps) {
  const { color, soft } = TONES[tone];
  if (!teacherName) {
    return (
      <View style={[styles.row, styles.teacher]}>
        <Icon name="book-outline" size={DETAIL_ICON_SIZE} themeColor={color} />
        <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
          Môn {subjectName}
        </ThemedText>
      </View>
    );
  }

  return (
    <View style={[styles.row, styles.teacher]}>
      <ThemedView type={soft} style={styles.teacherAvatar}>
        <ThemedText type="smallBold" themeColor={color}>
          {getInitials(teacherName)}
        </ThemedText>
      </ThemedView>
      <View style={styles.teacherInfo}>
        <ThemedText type="smallBold" numberOfLines={1}>
          {teacherName}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
          Giáo viên môn {subjectName}
        </ThemedText>
      </View>
    </View>
  );
}

/** Buoi hoc bu, doi lich luon hien loai buoi vi day la thong tin phu huynh can biet nhat. */
function SessionBadge({ session, isToday }: SessionBadgeProps) {
  const { badge, tone } = SESSION_TYPES[session.type];
  if (badge) return <ToneBadge label={badge.label} tone={tone} icon={badge.icon} />;
  if (!isToday) return null;

  const status = SESSION_STATUSES[getSessionStatus(session)];
  return <ToneBadge label={status.label} tone={status.tone} />;
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.three,
    gap: Spacing.two,
    overflow: 'hidden',
  },
  highlight: { position: 'absolute', left: 0, top: 0, bottom: 0, width: HIGHLIGHT_WIDTH },
  header: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  pressed: { opacity: 0.75 },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  title: { flex: 1, fontWeight: 700 },
  note: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.two,
    borderRadius: Radius.control,
  },
  noteText: { flex: 1 },
  footer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  teacher: { flexShrink: 1, gap: Spacing.two },
  teacherAvatar: {
    width: TEACHER_AVATAR_SIZE,
    height: TEACHER_AVATAR_SIZE,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  teacherInfo: { flexShrink: 1 },
  room: {
    flexShrink: 1,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderRadius: Radius.full,
  },
});
