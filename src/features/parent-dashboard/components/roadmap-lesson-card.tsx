import { Pressable, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { ThemedText } from '@/components/ui/themed-text';
import { ThemedView } from '@/components/ui/themed-view';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import type { RoadmapLesson } from '../types';
import { formatLessonScore, formatLessonSchedule, getLessonBadge } from '../utils';

import { ToneBadge } from './tone-badge';

const ICON_SIZE = 16;

export type RoadmapLessonCardProps = {
  lesson: RoadmapLesson;
  /** Mo chi tiet buoi day bai, chi co khi lop da xep buoi cho bai. */
  onOpenSession: (sessionId: string) => void;
};

/** The bai da hoc hoac chua hoc tren lo trinh: ngay hoc, ten bai, diem bai tap hoac bai kiem tra. */
export function RoadmapLessonCard({ lesson, onOpenSession }: RoadmapLessonCardProps) {
  const theme = useTheme();
  const { session, sequence, title, description, kind } = lesson;
  const badge = getLessonBadge(lesson);
  const schedule = formatLessonSchedule(lesson);
  const isDone = lesson.progress === 'DONE';
  const score = lesson.assignment?.score ?? null;
  const scoreText = score === null ? null : formatLessonScore(kind, score);

  const card = (
    <ThemedView
      type={isDone ? 'backgroundElement' : 'background'}
      style={[styles.card, !isDone && styles.pendingCard, { borderColor: theme.border }]}
    >
      <View style={styles.header}>
        <ThemedText type="small" themeColor="textSecondary" style={styles.schedule}>
          Bài {sequence} · {schedule}
        </ThemedText>
        <ToneBadge {...badge} />
      </View>
      <ThemedText
        type="default"
        themeColor={isDone ? 'text' : 'textSecondary'}
        style={styles.title}
      >
        {title}
      </ThemedText>
      {description ? (
        <ThemedText type="small" themeColor="textSecondary">
          {description}
        </ThemedText>
      ) : null}

      {scoreText || session ? (
        <View style={styles.footer}>
          {scoreText ? (
            <View style={styles.score}>
              <Icon name="star" size={ICON_SIZE} themeColor="accent" />
              <ThemedText type="smallBold">{scoreText}</ThemedText>
            </View>
          ) : null}
          {session ? (
            <View style={styles.link}>
              <ThemedText type="smallBold" themeColor="primary">
                Xem buổi học
              </ThemedText>
              <Icon name="chevron-forward" size={ICON_SIZE} themeColor="primary" />
            </View>
          ) : null}
        </View>
      ) : null}
    </ThemedView>
  );

  if (!session) return card;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={[`Bài ${sequence}: ${title}`, badge.label, schedule, scoreText]
        .filter(Boolean)
        .join(', ')}
      accessibilityHint="Xem chi tiết buổi học"
      onPress={() => onOpenSession(session.id)}
      style={({ pressed }) => [pressed && styles.pressed]}
    >
      {card}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.75 },
  card: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  // Vien net dut cho bai chua hoc, phan biet voi the bai da hoc
  pendingCard: { borderStyle: 'dashed' },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  schedule: { flexShrink: 1 },
  title: { fontWeight: 700 },
  footer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  score: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  // Day sang phai ca khi khong co diem
  link: { flexDirection: 'row', alignItems: 'center', gap: Spacing.half, marginLeft: 'auto' },
});
