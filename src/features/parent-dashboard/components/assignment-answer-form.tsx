import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ConfirmSheet } from '@/components/common/confirm-sheet';
import { FormError } from '@/components/common/form-error';
import { LoadingState } from '@/components/common/loading-state';
import { Button } from '@/components/ui/button';
import { ThemedText } from '@/components/ui/themed-text';
import { Radius, Spacing } from '@/constants/theme';

import { useAssignmentDraft } from '../hooks/use-assignment-draft';
import { useSubmissionUpload } from '../hooks/use-submission-upload';
import { useSubmitAssignment } from '../hooks/use-submit-assignment';
import type { AssignmentDraft, AssignmentQuestion, AssignmentRef } from '../types';
import {
  getBlankCoveredPositions,
  getQuestionFileLabels,
  getSubmitConfirmMessage,
  getSubmitHint,
  getUnansweredPositions,
  toSubmitAssignmentPayload,
} from '../utils';

import { AssignmentAttachments } from './assignment-attachments';
import { AssignmentDraftNote } from './assignment-draft-note';
import { QuestionAnswerCard } from './question-answer-card';

const EMPTY_DRAFT: AssignmentDraft = { answers: {}, attachments: [] };

export type AssignmentAnswerFormProps = AssignmentRef & {
  /** Con dang nop bai, xem `AssignmentDetail.recipients`. */
  recipientId: string;
  questions: AssignmentQuestion[];
  /** Bai lam (ca tep) cua lan nop truoc khi con nop lai; bo trong khi nop lan dau. */
  initialDraft?: AssignmentDraft;
  /** So lan con con duoc nop, tinh ca lan nay. */
  remainingAttempts: number;
  onSubmitted: () => void;
  /** Co khi dang nop lai: bo lan nop lai, quay ve bai da nop. */
  onCancel?: () => void;
};

/**
 * Con lam bai va nop qua phien dang nhap cua phu huynh (SRS muc 3.5). Cau tra loi la state cua man
 * hinh thay vi react-hook-form: so cau va loai cau thay doi theo tung de, quy tac duy nhat la tra loi
 * du moi cau (BE tu choi bai thieu cau: INVALID_ANSWERS); cau co anh hoac PDF bai lam (tep cua ca bai
 * hoac tep da gan voi cau) thi de trong duoc, ke ca cau trac nghiem. Bai lam (ca tep) luu tren may
 * trong luc lam; bam nop khi con thieu cau thi chi ra cau thieu, du cau thi hoi lai truoc khi nop (ke
 * ca cau de trong) vi nop roi khong lay lai duoc.
 */
export function AssignmentAnswerForm({
  studentId,
  assignmentId,
  recipientId,
  questions,
  initialDraft = EMPTY_DRAFT,
  remainingAttempts,
  onSubmitted,
  onCancel,
}: AssignmentAnswerFormProps) {
  const {
    draft,
    restoreStatus,
    updateAnswer,
    addAttachment,
    removeAttachment,
    setAttachmentQuestions,
    discard,
  } = useAssignmentDraft({ studentId, assignmentId }, initialDraft);
  const upload = useSubmissionUpload(addAttachment);
  const submit = useSubmitAssignment({ studentId, assignmentId });
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [shouldShowMissing, setShouldShowMissing] = useState(false);

  // Chua doc xong ban nhap thi chua cho go, de ban nhap khong ghi de len chu vua go
  if (restoreStatus === 'PENDING') return <LoadingState />;

  const { answers, attachments } = draft;
  const isUploading = upload.pending !== null;
  const unanswered = getUnansweredPositions(questions, answers, attachments);
  const blankPositions = getBlankCoveredPositions(questions, answers, attachments);
  const missing = new Set(shouldShowMissing ? unanswered : []);
  const isShowingMissing = shouldShowMissing && unanswered.length > 0;

  const requestSubmit = () => {
    if (unanswered.length > 0) {
      setShouldShowMissing(true);
      return;
    }
    setIsConfirmOpen(true);
  };

  const confirmSubmit = () =>
    submit.mutate(toSubmitAssignmentPayload(recipientId, questions, draft), {
      onSuccess: async () => {
        await discard();
        setIsConfirmOpen(false);
        onSubmitted();
      },
      // Dong hoi lai de loi hien ngay duoi nut nop
      onError: () => setIsConfirmOpen(false),
    });

  const cancelRetry = async () => {
    await discard();
    onCancel?.();
  };

  return (
    <View style={styles.form}>
      <AssignmentDraftNote isRestored={restoreStatus === 'RESTORED'} />

      {questions.map((question, index) => (
        <QuestionAnswerCard
          key={question.id}
          position={index + 1}
          question={question}
          value={answers[question.id] ?? ''}
          isMissing={missing.has(index + 1)}
          fileLabels={getQuestionFileLabels(question.id, attachments)}
          onChange={(answer) => updateAnswer(question.id, answer)}
        />
      ))}

      {/* Ca de chi co trac nghiem cung gui duoc tep: con lam bai kiem tra tren giay roi chup lai */}
      <AssignmentAttachments
        questions={questions}
        attachments={attachments}
        pending={upload.pending}
        problem={upload.problem}
        uploadError={upload.uploadError}
        onAddImage={(source) => void upload.addImage(source)}
        onAddPdf={() => void upload.addPdf()}
        onRemove={removeAttachment}
        onChangeQuestions={setAttachmentQuestions}
      />

      <ThemedText
        type={isShowingMissing ? 'smallBold' : 'small'}
        themeColor={isShowingMissing ? 'danger' : 'textSecondary'}
        accessibilityRole={shouldShowMissing ? 'alert' : undefined}
        style={styles.hint}
      >
        {isUploading
          ? 'Đang gửi ảnh hoặc tệp bài làm, chờ gửi xong rồi nộp bài.'
          : getSubmitHint({ unanswered, remainingAttempts, blankPositions })}
      </ThemedText>
      <FormError error={submit.error} />
      <Button
        title="Nộp bài"
        icon="paper-plane-outline"
        accessibilityLabel="Nộp bài"
        // Nop luc tep dang gui thi bai nop thieu tep do
        disabled={isUploading}
        loading={submit.isPending}
        onPress={requestSubmit}
        style={styles.pill}
      />
      {onCancel ? (
        <Button
          title="Giữ bài đã nộp"
          variant="ghost"
          disabled={submit.isPending}
          onPress={() => void cancelRetry()}
          style={styles.pill}
        />
      ) : null}

      <ConfirmSheet
        isVisible={isConfirmOpen}
        title="Nộp bài?"
        message={getSubmitConfirmMessage({
          questionCount: questions.length,
          remainingAttempts,
          attachments,
          blankPositions,
        })}
        confirmLabel="Xác nhận nộp"
        cancelLabel="Kiểm tra lại"
        isConfirming={submit.isPending}
        onConfirm={confirmSubmit}
        onCancel={() => setIsConfirmOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: Spacing.three },
  hint: { textAlign: 'center' },
  pill: { borderRadius: Radius.full },
});
