import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { FormError } from '@/components/common/form-error';
import { Button } from '@/components/ui/button';
import { ThemedText } from '@/components/ui/themed-text';
import { Radius, Spacing } from '@/constants/theme';

import { useSubmitAssignment } from '../hooks/use-submit-assignment';
import type { AnswerDraft, AssignmentQuestion, AssignmentRef } from '../types';
import { countUnanswered, toSubmissionAnswers } from '../utils';

import { QuestionAnswerCard } from './question-answer-card';

export type AssignmentAnswerFormProps = AssignmentRef & {
  /** Con dang nop bai, xem `AssignmentDetail.recipients`. */
  recipientId: string;
  questions: AssignmentQuestion[];
  /** Bai lam cua lan nop truoc khi con nop lai; bo trong khi nop lan dau. */
  initialDraft?: AnswerDraft;
  /** So lan con con duoc nop, tinh ca lan nay. */
  remainingAttempts: number;
  onSubmitted: () => void;
  /** Co khi dang nop lai: bo lan nop lai, quay ve bai da nop. */
  onCancel?: () => void;
};

/**
 * Con lam bai va nop qua phien dang nhap cua phu huynh (SRS muc 3.5). Cau tra loi la state cua man
 * hinh thay vi react-hook-form: so cau va loai cau thay doi theo tung de, quy tac duy nhat la tra loi
 * du moi cau (BE tu choi bai thieu cau: INVALID_ANSWERS).
 */
export function AssignmentAnswerForm({
  studentId,
  assignmentId,
  recipientId,
  questions,
  initialDraft = {},
  remainingAttempts,
  onSubmitted,
  onCancel,
}: AssignmentAnswerFormProps) {
  const [draft, setDraft] = useState<AnswerDraft>(initialDraft);
  const submit = useSubmitAssignment({ studentId, assignmentId });
  const unanswered = countUnanswered(questions, draft);

  const submitAnswers = () =>
    submit.mutate(
      { recipientId, answers: toSubmissionAnswers(questions, draft) },
      { onSuccess: onSubmitted },
    );

  return (
    <View style={styles.form}>
      {questions.map((question, index) => (
        <QuestionAnswerCard
          key={question.id}
          position={index + 1}
          question={question}
          value={draft[question.id] ?? ''}
          onChange={(answer) => setDraft((current) => ({ ...current, [question.id]: answer }))}
        />
      ))}

      <ThemedText type="small" themeColor="textSecondary" style={styles.hint}>
        {unanswered > 0 ? `Còn ${unanswered} câu chưa trả lời.` : getSubmitHint(remainingAttempts)}
      </ThemedText>
      <FormError error={submit.error} />
      <Button
        title="Nộp bài"
        icon="paper-plane-outline"
        accessibilityLabel="Nộp bài"
        disabled={unanswered > 0}
        loading={submit.isPending}
        onPress={submitAnswers}
        style={styles.pill}
      />
      {onCancel ? (
        <Button
          title="Giữ bài đã nộp"
          variant="ghost"
          disabled={submit.isPending}
          onPress={onCancel}
          style={styles.pill}
        />
      ) : null}
    </View>
  );
}

/** Nhac con so lan nop con lai sau lan nay, de con soat bai truoc khi nop. */
function getSubmitHint(remainingAttempts: number): string {
  const attemptsAfterSubmit = remainingAttempts - 1;
  return attemptsAfterSubmit > 0
    ? `Đã trả lời đủ. Sau lần này con còn ${attemptsAfterSubmit} lần nộp lại.`
    : 'Đã trả lời đủ. Đây là lần nộp cuối, con kiểm tra lại bài trước khi nộp nhé.';
}

const styles = StyleSheet.create({
  form: { gap: Spacing.three },
  hint: { textAlign: 'center' },
  pill: { borderRadius: Radius.full },
});
