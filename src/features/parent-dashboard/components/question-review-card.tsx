import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ui/themed-text';
import { ThemedView } from '@/components/ui/themed-view';
import { Radius, Spacing, type ThemeColor } from '@/constants/theme';

import { ANSWER_RESULTS } from '../constants';
import type { AssignmentQuestion, CriterionReview, QuestionReview } from '../types';
import { formatPoints, getChoiceState } from '../utils';

import { ChoiceOption } from './choice-option';
import { QuestionFileNote } from './question-file-note';
import { QuestionFrame } from './question-frame';
import { ToneBadge } from './tone-badge';

export type QuestionReviewCardProps = {
  /** Thu tu cau trong de, tinh tu 1. */
  position: number;
  question: AssignmentQuestion;
  review: QuestionReview;
  /** false khi con chua nop bai: chi hien de (va dap an neu da cong bo). */
  hasSubmission: boolean;
  /** Lan nop co anh hoac PDF bai lam: cau de trong (ca trac nghiem) la con tra loi trong tep. */
  hasAttachments: boolean;
};

/**
 * Mot cau khi xem lai bai: cau tra loi cua con, diem va nhan xet sau khi giao vien cong bo diem, dap
 * an dung sau khi giao vien cong bo dap an (SRS muc 3.9).
 */
export function QuestionReviewCard({
  position,
  question,
  review,
  hasSubmission,
  hasAttachments,
}: QuestionReviewCardProps) {
  const maxPoints = formatPoints(question.maxScore);
  const result =
    review.isCorrect === null ? null : ANSWER_RESULTS[review.isCorrect ? 'correct' : 'wrong'];

  return (
    <QuestionFrame
      position={position}
      prompt={question.prompt}
      points={review.score === null ? maxPoints : `${review.score} / ${maxPoints}`}
    >
      {question.choices ? (
        <View style={styles.choices}>
          {question.choices.map((choice) => (
            <ChoiceOption key={choice} label={choice} state={getChoiceState(choice, review)} />
          ))}
        </View>
      ) : null}
      {question.choices && hasSubmission && review.answer === '' ? (
        <ThemedText type="small" themeColor="textSecondary">
          {getBlankAnswerText(hasAttachments)}
        </ThemedText>
      ) : null}

      {!question.choices && hasSubmission ? (
        <AnswerBlock
          label="Câu trả lời của học sinh"
          text={review.answer === '' ? getBlankAnswerText(hasAttachments) : review.answer}
          background="background"
        />
      ) : null}
      {review.fileLabels.length > 0 ? <QuestionFileNote labels={review.fileLabels} /> : null}
      {!question.choices && review.correctAnswer ? (
        <AnswerBlock
          label="Đáp án tham khảo"
          text={review.correctAnswer}
          background="successSoft"
        />
      ) : null}

      {result ? (
        <View style={styles.result}>
          <ToneBadge label={result.label} tone={result.tone} icon={result.icon} />
        </View>
      ) : null}
      {review.criteria.length > 0 ? <CriteriaBlock criteria={review.criteria} /> : null}
      {review.feedback ? (
        <ThemedText type="small" style={styles.feedback}>
          Nhận xét: {review.feedback}
        </ThemedText>
      ) : null}
    </QuestionFrame>
  );
}

/** Cau con de trong: co tep bai lam thi con lam cau nay trong tep, giao vien cham theo tep. */
function getBlankAnswerText(hasAttachments: boolean): string {
  return hasAttachments ? 'Học sinh trả lời bằng bài làm gửi kèm.' : 'Học sinh để trống câu này.';
}

/** Diem tung tieu chi giao vien cham cho cau tu luan (BE PR #12). */
function CriteriaBlock({ criteria }: { criteria: CriterionReview[] }) {
  return (
    <ThemedView type="background" style={styles.block}>
      <ThemedText type="smallBold" themeColor="textSecondary">
        Điểm theo tiêu chí
      </ThemedText>
      {criteria.map((criterion) => (
        <View key={criterion.id} style={styles.criterion}>
          <View style={styles.criterionHeader}>
            <ThemedText type="small" style={styles.criterionTitle}>
              {criterion.title}
            </ThemedText>
            <ThemedText type="smallBold">
              {criterion.maxScore === null
                ? formatPoints(criterion.score)
                : `${criterion.score} / ${formatPoints(criterion.maxScore)}`}
            </ThemedText>
          </View>
          {criterion.feedback ? (
            <ThemedText type="small" themeColor="textSecondary" style={styles.feedback}>
              {criterion.feedback}
            </ThemedText>
          ) : null}
        </View>
      ))}
    </ThemedView>
  );
}

function AnswerBlock({
  label,
  text,
  background,
}: {
  label: string;
  text: string;
  background: ThemeColor;
}) {
  return (
    <ThemedView type={background} style={styles.block}>
      <ThemedText type="smallBold" themeColor="textSecondary">
        {label}
      </ThemedText>
      <ThemedText type="small">{text}</ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  choices: { gap: Spacing.two },
  block: { gap: Spacing.one, padding: Spacing.two, borderRadius: Radius.control },
  result: { flexDirection: 'row' },
  feedback: { fontStyle: 'italic' },
  criterion: { gap: Spacing.half },
  criterionHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.two },
  criterionTitle: { flex: 1 },
});
