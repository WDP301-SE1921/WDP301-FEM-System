import { StyleSheet, View } from 'react-native';

import { Spacing } from '@/constants/theme';

import { OPTIONAL_OUTCOME_NOTE } from '../constants';
import { useOutcomeSet } from '../hooks/use-parent-dashboard';
import type { LearningTarget } from '../types';
import { getOptionalOutcomeIds } from '../utils';

import { LearningTargetRow } from './learning-target-row';
import { SectionCard } from './section-card';

export type AssignmentLearningTargetsProps = {
  /** Bo CLO cua bai (`AssignmentDetail.outcomeSetId`), cho biet muc tieu nao khong bat buoc. */
  outcomeSetId: string;
  /** Cac CLO bai do, xem `getMeasuredTargets`. */
  targets: readonly LearningTarget[];
};

/**
 * Muc tieu bai: cac CLO cau hoi trong bai do, de con biet bai danh gia dieu gi. `learningTargets` cua
 * bai khong co `required` nen ghi chu muc tieu mo rong lay tu bo CLO. Ghi chu chi la thong tin them:
 * bo CLO dang tai, tai loi hay khong con xem duoc thi van hien muc tieu, chi khong co ghi chu.
 */
export function AssignmentLearningTargets({
  outcomeSetId,
  targets,
}: AssignmentLearningTargetsProps) {
  const outcomeSet = useOutcomeSet(outcomeSetId);
  const optionalIds = getOptionalOutcomeIds(outcomeSet.data?.outcomes ?? []);

  return (
    <SectionCard title="Mục tiêu bài" icon="locate-outline">
      <View style={styles.list}>
        {targets.map(({ id, code, title }) => (
          <LearningTargetRow
            key={id}
            code={code}
            title={title}
            note={optionalIds.has(id) ? OPTIONAL_OUTCOME_NOTE : undefined}
          />
        ))}
      </View>
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  list: { gap: Spacing.two },
});
