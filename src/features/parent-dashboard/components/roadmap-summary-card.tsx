import { StyleSheet, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { ThemedText } from '@/components/ui/themed-text';
import { ThemedView } from '@/components/ui/themed-view';
import { Radius, Spacing, type ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { DEFAULT_SUBJECT_ICON, SUBJECT_ICONS } from '../constants';
import type { RoadmapLesson, RoadmapSummary, StudentEnrollment } from '../types';
import { formatLessonSchedule } from '../utils';

import { RoadmapProgressBar } from './roadmap-progress-bar';
import { ToneIcon } from './tone-icon';

const ICON_SIZE = 16;

export type RoadmapSummaryCardProps = {
  enrollment: Pick<StudentEnrollment, 'className' | 'programName' | 'subjectName'>;
  summary: RoadmapSummary;
  markers: readonly { id: string; percent: number }[];
};

/** Tong quan lo trinh mot mon: phan tram bai da hoc, moc kiem tra tiep theo, so bai theo vi tri. */
export function RoadmapSummaryCard({ enrollment, summary, markers }: RoadmapSummaryCardProps) {
  const theme = useTheme();

  return (
    <ThemedView type="backgroundElement" style={[styles.card, { borderColor: theme.border }]}>
      <View style={styles.header}>
        <ToneIcon
          name={SUBJECT_ICONS[enrollment.subjectName] ?? DEFAULT_SUBJECT_ICON}
          tone="primary"
          size="lg"
        />
        <View style={styles.titleBlock}>
          <ThemedText type="small" themeColor="textSecondary">
            {enrollment.programName}
          </ThemedText>
          <ThemedText type="default" style={styles.title}>
            {enrollment.className}
          </ThemedText>
        </View>
        <ThemedView type="accentSoft" style={styles.percent}>
          <Icon name="star" size={ICON_SIZE} themeColor="accent" />
          <ThemedText type="smallBold">{summary.percent}%</ThemedText>
        </ThemedView>
      </View>

      <View style={styles.progress}>
        <RoadmapProgressBar percent={summary.percent} markers={markers} />
        <ThemedText type="small" themeColor="textSecondary">
          Đã học {summary.DONE}/{summary.total} bài
        </ThemedText>
      </View>

      {summary.nextAssessment ? <NextAssessment lesson={summary.nextAssessment} /> : null}

      <View style={styles.counters}>
        <RoadmapCounter label="Đã học" value={summary.DONE} background="background" />
        <RoadmapCounter label="Đang học" value={summary.CURRENT} background="accentSoft" />
        <RoadmapCounter label="Sắp tới" value={summary.UPCOMING} background="background" />
      </View>
    </ThemedView>
  );
}

function NextAssessment({ lesson }: { lesson: RoadmapLesson }) {
  return (
    <ThemedView type="background" style={styles.milestone}>
      <Icon name="flag" size={ICON_SIZE} themeColor="accent" />
      <View style={styles.milestoneText}>
        <ThemedText type="small">
          Mốc tiếp theo:{' '}
          <ThemedText type="smallBold">
            Bài {lesson.sequence} · {lesson.title}
          </ThemedText>
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {formatLessonSchedule(lesson)}
        </ThemedText>
      </View>
    </ThemedView>
  );
}

type RoadmapCounterProps = {
  label: string;
  value: number;
  /** Nen cua o, o can chu y dung mau nhat cua sac thai. */
  background: ThemeColor;
};

function RoadmapCounter({ label, value, background }: RoadmapCounterProps) {
  return (
    <ThemedView
      type={background}
      accessible
      accessibilityLabel={`${label}: ${value} bài`}
      style={styles.counter}
    >
      <ThemedText type="heading">{value}</ThemedText>
      <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
        {label}
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: Radius.xl,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  titleBlock: { flex: 1, gap: Spacing.half },
  title: { fontWeight: 700 },
  percent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderRadius: Radius.full,
  },
  progress: { gap: Spacing.two },
  milestone: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
    padding: Spacing.two,
    borderRadius: Radius.control,
  },
  milestoneText: { flex: 1 },
  counters: { flexDirection: 'row', gap: Spacing.two },
  counter: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.one,
    borderRadius: Radius.lg,
  },
});
