import { StyleSheet, View } from 'react-native';

import { Spacing } from '@/constants/theme';

import type { LearningTarget } from '../types';

import { LearningTargetRow } from './learning-target-row';
import { SectionCard } from './section-card';

export type AssignmentLearningTargetsProps = {
  /** Cac CLO bai do, xem `getMeasuredTargets`. */
  targets: readonly LearningTarget[];
};

/** Muc tieu bai: cac CLO cau hoi trong bai do, de con biet bai danh gia dieu gi. An voi bai cu. */
export function AssignmentLearningTargets({ targets }: AssignmentLearningTargetsProps) {
  if (targets.length === 0) return null;

  return (
    <SectionCard title="Mục tiêu bài" icon="locate-outline">
      <View style={styles.list}>
        {targets.map(({ id, code, title }) => (
          <LearningTargetRow key={id} code={code} title={title} />
        ))}
      </View>
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  list: { gap: Spacing.two },
});
