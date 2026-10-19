import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ui/themed-text';
import { ThemedView } from '@/components/ui/themed-view';
import { Radius, Spacing, type ThemeColor } from '@/constants/theme';

import { ANSWER_RESULTS } from '../constants';
import type { AssignmentQuestion, QuestionReview } from '../types';
import { formatPoints, getChoiceState } from '../utils';

import { ChoiceOption } from './choice-option';
import { QuestionFrame } from './question-frame';
import { ToneBadge } from './tone-badge';

export type QuestionReviewCardProps = {
  /** Thu tu cau trong de, tinh tu 1. */
  position: number;
  question: AssignmentQuestion;
  review: QuestionReview;
  /** false khi con chua nop bai: chi hien de (va dap an neu da cong bo). */
  hasSubmission: boolean;
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

      {!question.choices && hasSubmission ? (
        <AnswerBlock
          label="Câu trả lời của học sinh"
          text={review.answer === '' ? 'Học sinh để trống câu này.' : review.answer}
          background="background"
        />
      ) : null}
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
      {review.feedback ? (
        <ThemedText type="small" style={styles.feedback}>
          Nhận xét: {review.feedback}
        </ThemedText>
      ) : null}
    </QuestionFrame>
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
});
