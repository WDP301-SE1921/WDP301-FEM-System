import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { ThemedText } from '@/components/ui/themed-text';
import { Radius, Spacing } from '@/constants/theme';

import type { AssignmentQuestion, SubmissionRecord } from '../types';
import {
  getAssignmentMaxScore,
  getPublishedGrade,
  getQuestionReview,
  splitSubmissionFiles,
} from '../utils';

import { GradeResultCard } from './grade-result-card';
import { QuestionReviewCard } from './question-review-card';
import { SectionCard } from './section-card';
import { SubmittedFiles } from './submitted-files';

export type AssignmentReviewProps = {
  questions: AssignmentQuestion[];
  /** Ma CLO cua tung cau theo id cau hoi, xem `getQuestionOutcomeCodes`. */
  outcomeCodes: Partial<Record<string, string>>;
  /** Lan nop dang xem; null khi con chua nop va khong nop duoc nua. */
  submission: SubmissionRecord | null;
  /** So lan con con duoc nop; 0 thi khong hien nut nop lai. */
  remainingAttempts: number;
  onRetry: () => void;
};

/**
 * Xem lai bai: ket qua giao vien da cong bo (hoac thong bao dang cho cham), roi tung cau kem cau tra
 * loi cua con, diem va dap an dung. Diem chi hien sau khi giao vien duyet va cong bo (SRS muc 5.12).
 */
export function AssignmentReview({
  questions,
  outcomeCodes,
  submission,
  remainingAttempts,
  onRetry,
}: AssignmentReviewProps) {
  const grade = getPublishedGrade(submission);
  const hasAnswerKey = questions.some(({ correctAnswer }) => Boolean(correctAnswer));
  const { byQuestion, unassigned } = splitSubmissionFiles(submission);

  const renderStatus = () => {
    if (grade) {
      return <GradeResultCard grade={grade} maxScore={getAssignmentMaxScore(questions)} />;
    }
    if (submission) {
      return (
        <SectionCard title="Đã nộp bài" icon="checkmark-done-outline" tone="primary">
          <ThemedText type="small" themeColor="textSecondary">
            Điểm, nhận xét và đáp án đúng sẽ hiện ở đây sau khi giáo viên chấm và công bố.
          </ThemedText>
        </SectionCard>
      );
    }
    return (
      <SectionCard title="Đã hết hạn nộp bài" icon="lock-closed-outline" tone="danger">
        <ThemedText type="small" themeColor="textSecondary">
          Học sinh chưa nộp bài này và không nộp được nữa. Liên hệ giáo viên nếu cần nộp bổ sung.
        </ThemedText>
      </SectionCard>
    );
  };

  return (
    <View style={styles.container}>
      {renderStatus()}
      {grade && !hasAnswerKey ? (
        <ThemedText type="small" themeColor="textSecondary">
          Giáo viên chưa công bố đáp án đúng của bài này.
        </ThemedText>
      ) : null}

      <ThemedText type="default" accessibilityRole="header" style={styles.sectionTitle}>
        {submission ? 'Bài làm của học sinh' : 'Đề bài'}
      </ThemedText>
      {/* Bai nop cu gui anh chung cho ca bai; bai nop moi gui anh theo tung cau */}
      {submission && unassigned.length > 0 ? <SubmittedFiles fileIds={unassigned} /> : null}
      {questions.map((question, index) => (
        <QuestionReviewCard
          key={question.id}
          position={index + 1}
          question={question}
          review={getQuestionReview(question, submission)}
          hasSubmission={submission !== null}
          hasAttachments={unassigned.length > 0 || (byQuestion.get(question.id)?.length ?? 0) > 0}
          fileIds={byQuestion.get(question.id)}
          outcomeCode={outcomeCodes[question.id]}
        />
      ))}

      {submission && remainingAttempts > 0 ? (
        <>
          <ThemedText type="small" themeColor="textSecondary" style={styles.hint}>
            Học sinh còn {remainingAttempts} lần nộp lại trước hạn nộp.
          </ThemedText>
          <Button
            title="Làm lại và nộp lại"
            variant="secondary"
            icon="refresh-outline"
            accessibilityLabel="Làm lại và nộp lại"
            onPress={onRetry}
            style={styles.pill}
          />
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.three },
  sectionTitle: { fontWeight: 700 },
  hint: { textAlign: 'center' },
  pill: { borderRadius: Radius.full },
});
