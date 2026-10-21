import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { ThemedText } from '@/components/ui/themed-text';
import { Spacing } from '@/constants/theme';

import type { RoadmapLesson, SessionLink, StudentEnrollment } from '../types';
import { getRoadmapWindow } from '../utils';

import { CurrentLessonCard } from './current-lesson-card';
import { RoadmapLessonCard } from './roadmap-lesson-card';
import { RoadmapStep } from './roadmap-step';
import { ToneIcon } from './tone-icon';

export type RoadmapTimelineProps = {
  /** Da sap theo thu tu bai (`getRoadmapLessons`). */
  lessons: readonly RoadmapLesson[];
  enrollment: Pick<StudentEnrollment, 'teacherName' | 'room'>;
  onOpenSession: (session: SessionLink) => void;
  onOpenAssignments: () => void;
};

/** Cac bai cua lo trinh theo thu tu, mac dinh thu gon quanh bai dang hoc. */
export function RoadmapTimeline({
  lessons,
  enrollment,
  onOpenSession,
  onOpenAssignments,
}: RoadmapTimelineProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const collapsedLessons = getRoadmapWindow(lessons);
  const visibleLessons = isExpanded ? lessons : collapsedLessons;
  const canToggle = collapsedLessons.length < lessons.length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <ToneIcon name="trail-sign-outline" tone="primary" size="sm" />
        <ThemedText type="default" accessibilityRole="header" style={styles.title}>
          Lộ trình bài học
        </ThemedText>
      </View>

      <View>
        {visibleLessons.map((lesson, index) => (
          <RoadmapStep key={lesson.id} lesson={lesson} isLast={index === visibleLessons.length - 1}>
            {lesson.progress === 'CURRENT' ? (
              <CurrentLessonCard
                lesson={lesson}
                enrollment={enrollment}
                onOpenSession={onOpenSession}
                onOpenAssignments={onOpenAssignments}
              />
            ) : (
              <RoadmapLessonCard lesson={lesson} onOpenSession={onOpenSession} />
            )}
          </RoadmapStep>
        ))}
      </View>

      {canToggle ? (
        <Button
          variant="secondary"
          title={isExpanded ? 'Thu gọn lộ trình' : `Xem toàn bộ ${lessons.length} bài`}
          icon={isExpanded ? 'chevron-up' : 'chevron-down'}
          onPress={() => setIsExpanded((expanded) => !expanded)}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.three },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  title: { flex: 1, fontWeight: 700 },
});
