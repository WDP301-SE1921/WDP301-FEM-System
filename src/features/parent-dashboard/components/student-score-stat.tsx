import { ThemedText } from '@/components/ui/themed-text';

import { SCORE_STAT_LABEL } from '../constants';
import { useStudentGrades } from '../hooks/use-parent-dashboard';

import { ScoreStatCard } from './score-stat-card';
import { SectionLoadError } from './section-load-error';
import { SectionLoading } from './section-loading';
import { StatCard } from './stat-card';

export type StudentScoreStatProps = {
  studentId: string;
};

/** O "Điểm trung bình" cua con: tu tai diem, loi thi chi o nay bao loi va thu lai. */
export function StudentScoreStat({ studentId }: StudentScoreStatProps) {
  const grades = useStudentGrades(studentId);

  if (grades.isSuccess) return <ScoreStatCard score={grades.data.summary} />;

  return (
    <StatCard label={SCORE_STAT_LABEL}>
      <ThemedText type="subtitle">--</ThemedText>
      {grades.isError ? (
        <SectionLoadError message="Không tải được điểm." onRetry={() => void grades.refetch()} />
      ) : (
        <SectionLoading message="Đang tải điểm…" />
      )}
    </StatCard>
  );
}
