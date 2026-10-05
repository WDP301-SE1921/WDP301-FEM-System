import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ui/themed-text';
import { Spacing } from '@/constants/theme';
import { formatDayMonth } from '@/utils/format';

import type { SubmissionGrade } from '../types';
import { getGradeLevel } from '../utils';

import { ScoreBox } from './score-box';
import { SectionCard } from './section-card';
import { ToneBadge } from './tone-badge';

export type GradeResultCardProps = {
  grade: SubmissionGrade;
  /** Tong diem toi da cua de. */
  maxScore: number;
};

/** Ket qua giao vien da cong bo cho bai nop: diem, xep loai, ngay cong bo va nhan xet chung. */
export function GradeResultCard({ grade, maxScore }: GradeResultCardProps) {
  const level = getGradeLevel({ totalScore: grade.totalScore, maxScore });

  return (
    <SectionCard
      title="Kết quả"
      icon="ribbon-outline"
      tone={level.tone}
      trailing={<ToneBadge label={level.label} tone={level.tone} />}
    >
      <View style={styles.row}>
        <ScoreBox totalScore={grade.totalScore} maxScore={maxScore} tone={level.tone} />
        <View style={styles.details}>
          <ThemedText type="small" themeColor="textSecondary">
            {grade.publishedAt
              ? `Giáo viên công bố ngày ${formatDayMonth(grade.publishedAt)}`
              : 'Giáo viên đã công bố điểm'}
          </ThemedText>
          {grade.feedback ? (
            <ThemedText type="small" style={styles.feedback}>
              “{grade.feedback}”
            </ThemedText>
          ) : null}
        </View>
      </View>
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  details: { flex: 1, gap: Spacing.one },
  feedback: { fontStyle: 'italic' },
});
