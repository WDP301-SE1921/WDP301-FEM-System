import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ConfirmSheet } from '@/components/common/confirm-sheet';
import { FormError } from '@/components/common/form-error';
import { LoadingState } from '@/components/common/loading-state';
import { Button } from '@/components/ui/button';
import { ThemedText } from '@/components/ui/themed-text';
import { Radius, Spacing } from '@/constants/theme';

import { MAX_SUBMISSION_FILES } from '../constants';
import { useAssignmentDraft } from '../hooks/use-assignment-draft';
import { useSubmissionUpload } from '../hooks/use-submission-upload';
import { useSubmitAssignment } from '../hooks/use-submit-assignment';
import type { AssignmentDraft, AssignmentQuestion, AssignmentRef } from '../types';
import {
  getQuestionIdsWithFiles,
  getSubmitConfirmMessage,
  getSubmitHint,
  getUnansweredPositions,
  groupAttachmentsByQuestion,
  hasEmptyEssay,
  toSubmissionAnswers,
} from '../utils';

import { AssignmentDraftNote } from './assignment-draft-note';
import { QuestionAnswerCard } from './question-answer-card';
import { QuestionAttachments } from './question-attachments';

const EMPTY_DRAFT: AssignmentDraft = { answers: {}, attachments: [] };

export type AssignmentAnswerFormProps = AssignmentRef & {
  /** Con dang nop bai, xem `AssignmentDetail.recipients`. */
  recipientId: string;
  questions: AssignmentQuestion[];
  /** Ma CLO cua tung cau theo id cau hoi, xem `getQuestionOutcomeCodes`. */
  outcomeCodes: Partial<Record<string, string>>;
  /** Bai lam (ca anh) cua lan nop truoc khi con nop lai; bo trong khi nop lan dau. */
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
 * du moi cau (BE tu choi bai thieu cau: INVALID_ANSWERS). Moi cau tu luan co khu anh/file PDF rieng,
 * gui kem dung cau qua `answers[].fileIds`; cau co anh/file thi de trong chu duoc. Bai lam (ca anh)
 * luu tren may trong luc lam; bam nop khi con thieu cau thi chi ra cau thieu, du cau thi hoi lai truoc
 * khi nop vi nop roi khong lay lai duoc.
 */
export function AssignmentAnswerForm({
  studentId,
  assignmentId,
  recipientId,
  questions,
  outcomeCodes,
  initialDraft = EMPTY_DRAFT,
  remainingAttempts,
  onSubmitted,
  onCancel,
}: AssignmentAnswerFormProps) {
  const { draft, restoreStatus, updateAnswer, addAttachment, removeAttachment, discard } =
    useAssignmentDraft({ studentId, assignmentId }, initialDraft);
  const upload = useSubmissionUpload(addAttachment);
  const submit = useSubmitAssignment({ studentId, assignmentId });
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [shouldShowMissing, setShouldShowMissing] = useState(false);

  // Chua doc xong ban nhap thi chua cho go, de ban nhap khong ghi de len chu vua go
  if (restoreStatus === 'PENDING') return <LoadingState />;

  const { answers, attachments } = draft;
  const hasAttachments = attachments.length > 0;
  const filesByQuestion = groupAttachmentsByQuestion(questions, attachments);
  const questionIdsWithFiles = getQuestionIdsWithFiles(filesByQuestion);
  const isUploading = upload.uploading !== null;
  // BE nhan toi da MAX_SUBMISSION_FILES tep cho ca lan nop, tinh ca tep dang tai
  const remainingSlots = MAX_SUBMISSION_FILES - attachments.length - (isUploading ? 1 : 0);
  const unanswered = getUnansweredPositions(questions, answers, questionIdsWithFiles);
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
    submit.mutate(
      {
        recipientId,
        answers: toSubmissionAnswers(questions, answers, filesByQuestion),
        ...(hasAttachments ? { fileIds: attachments.map(({ fileId }) => fileId) } : {}),
      },
      {
        onSuccess: async () => {
          await discard();
          setIsConfirmOpen(false);
          onSubmitted();
        },
        // Dong hoi lai de loi hien ngay duoi nut nop
        onError: () => setIsConfirmOpen(false),
      },
    );

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
          outcomeCode={outcomeCodes[question.id]}
          onChange={(answer) => updateAnswer(question.id, answer)}
          attachments={
            question.kind === 'ESSAY' ? (
              <QuestionAttachments
                position={index + 1}
                attachments={filesByQuestion.get(question.id) ?? []}
                uploading={upload.uploading?.questionId === question.id ? upload.uploading : null}
                isBusy={isUploading}
                remainingSlots={remainingSlots}
                problem={upload.problem?.questionId === question.id ? upload.problem : null}
                uploadError={
                  upload.uploadError?.questionId === question.id ? upload.uploadError.error : null
                }
                onAddImage={(source) => void upload.addImage(question.id, source)}
                onAddPdf={() => void upload.addPdf(question.id)}
                onRemove={removeAttachment}
              />
            ) : undefined
          }
        />
      ))}

      <ThemedText
        type={isShowingMissing ? 'smallBold' : 'small'}
        themeColor={isShowingMissing ? 'danger' : 'textSecondary'}
        accessibilityRole={shouldShowMissing ? 'alert' : undefined}
        style={styles.hint}
      >
        {isUploading
          ? 'Đang gửi ảnh/file bài làm, chờ gửi xong rồi nộp bài.'
          : getSubmitHint({
              unanswered,
              remainingAttempts,
              hasEmptyEssay: hasEmptyEssay(questions, answers, questionIdsWithFiles),
            })}
      </ThemedText>
      <FormError error={submit.error} />
      <Button
        title="Nộp bài"
        icon="paper-plane-outline"
        accessibilityLabel="Nộp bài"
        // Nop luc anh dang gui thi bai nop thieu anh do
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
        message={getSubmitConfirmMessage(questions.length, remainingAttempts, attachments.length)}
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
