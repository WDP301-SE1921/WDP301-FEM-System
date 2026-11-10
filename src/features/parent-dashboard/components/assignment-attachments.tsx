import { Image } from 'expo-image';
import { useState } from 'react';
import { ActivityIndicator, Linking, Pressable, StyleSheet, View } from 'react-native';

import { FormError } from '@/components/common/form-error';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { ThemedText } from '@/components/ui/themed-text';
import { ThemedView } from '@/components/ui/themed-view';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { ImageSource } from '@/lib/image-picker';

import {
  FILE_KIND_LABELS,
  FILE_KIND_SPOKEN,
  IMAGE_PICK_PROBLEMS,
  MAX_SUBMISSION_FILES,
  PDF_PICK_PROBLEMS,
} from '../constants';
import type { PendingUpload } from '../hooks/use-submission-upload';
import type { AssignmentQuestion, AttachmentPickProblem, SubmissionAttachment } from '../types';
import { formatAttachmentScope, formatFileSize, getAttachmentNumbers } from '../utils';

import { AttachmentQuestionsSheet } from './attachment-questions-sheet';
import { SubmittedImage } from './submitted-image';

const PREVIEW_SIZE = 72;
const PDF_ICON_SIZE = 28;
const REMOVE_BUTTON_SIZE = 32;
/** Bu phan thieu cua nut xoa de vung cham dat 44x44 (design-mobile.md). */
const REMOVE_HIT_SLOP = 6;
const REMOVE_ICON_SIZE = 18;
/** Nut chon tep hep hon muc nay thi xuong dong, de chu tren nut khong bi cat. */
const ACTION_MIN_WIDTH = 120;

export type AssignmentAttachmentsProps = {
  questions: AssignmentQuestion[];
  attachments: readonly SubmissionAttachment[];
  /** Tep dang tai len (hien kem vong quay), null khi khong co. */
  pending: PendingUpload | null;
  problem: AttachmentPickProblem | null;
  /** Loi khi tai tep len BE. */
  uploadError: unknown;
  onAddImage: (source: ImageSource) => void;
  onAddPdf: () => void;
  onRemove: (fileId: string) => void;
  /** Gan tep voi cac cau, mang rong la tep cua ca bai. */
  onChangeQuestions: (fileId: string, questionIds: string[]) => void;
};

/**
 * Anh hoac PDF bai lam gui kem bai nop: con lam bai ra giay (cong thuc, hinh ve, ca bai kiem tra) roi
 * chup anh hoac gui tep PDF. Tep mac dinh dung cho ca bai; phu huynh gan duoc tep voi tung cau de giao
 * vien tim nhanh. Cau co tep thi de trong duoc, ke ca cau trac nghiem.
 */
export function AssignmentAttachments({
  questions,
  attachments,
  pending,
  problem,
  uploadError,
  onAddImage,
  onAddPdf,
  onRemove,
  onChangeQuestions,
}: AssignmentAttachmentsProps) {
  // Giu tep vua dong sheet de tieu de khong doi trong luc sheet truot xuong
  const [mapping, setMapping] = useState<{ fileId: string; isOpen: boolean } | null>(null);
  const isFull = attachments.length >= MAX_SUBMISSION_FILES;
  const canAdd = pending === null && !isFull;
  // De mot cau thi moi tep deu la bai lam cua cau do, khong can gan
  const canPickQuestions = questions.length > 1;
  const numbers = getAttachmentNumbers(attachments);
  const mappingIndex = attachments.findIndex(({ fileId }) => fileId === mapping?.fileId);
  const mappingAttachment = attachments[mappingIndex];

  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      <View style={styles.header}>
        <ThemedText type="default" accessibilityRole="header" style={styles.title}>
          Ảnh hoặc PDF bài làm (không bắt buộc)
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Làm bài ra giấy thì chụp ảnh hoặc chọn tệp PDF gửi kèm, tối đa {MAX_SUBMISSION_FILES} tệp.
          Câu nào có trong bài làm gửi kèm thì để trống cũng được.
        </ThemedText>
      </View>

      {attachments.length > 0 || pending ? (
        <View style={styles.list}>
          {attachments.map((attachment, index) => (
            <AttachmentRow
              key={attachment.fileId}
              attachment={attachment}
              number={numbers[index] ?? index + 1}
              scope={formatAttachmentScope(attachment.questionIds, questions)}
              onPickQuestions={
                canPickQuestions
                  ? () => setMapping({ fileId: attachment.fileId, isOpen: true })
                  : undefined
              }
              onRemove={() => onRemove(attachment.fileId)}
            />
          ))}
          {pending ? <PendingRow pending={pending} /> : null}
        </View>
      ) : null}

      {canPickQuestions && attachments.length > 0 ? (
        <ThemedText type="small" themeColor="textSecondary">
          Tệp chỉ có một vài câu thì bấm “Chọn câu” để giáo viên tìm bài làm nhanh hơn.
        </ThemedText>
      ) : null}

      <View style={styles.actions}>
        <Button
          title="Chụp ảnh"
          variant="secondary"
          icon="camera-outline"
          accessibilityLabel="Chụp ảnh bài làm"
          disabled={!canAdd}
          onPress={() => onAddImage('camera')}
          style={styles.action}
        />
        <Button
          title="Chọn ảnh"
          variant="secondary"
          icon="images-outline"
          accessibilityLabel="Chọn ảnh bài làm có sẵn"
          disabled={!canAdd}
          onPress={() => onAddImage('library')}
          style={styles.action}
        />
        <Button
          title="Chọn PDF"
          variant="secondary"
          icon="document-attach-outline"
          accessibilityLabel="Chọn tệp PDF bài làm"
          disabled={!canAdd}
          onPress={onAddPdf}
          style={styles.action}
        />
      </View>

      {isFull ? (
        <ThemedText type="small" themeColor="textSecondary">
          Đã đủ {MAX_SUBMISSION_FILES} tệp. Xoá bớt nếu muốn gửi ảnh hoặc tệp khác.
        </ThemedText>
      ) : null}
      {problem ? <PickProblemNotice problem={problem} /> : null}
      <FormError error={uploadError} />

      {mappingAttachment ? (
        <AttachmentQuestionsSheet
          isVisible={mapping?.isOpen ?? false}
          label={`${FILE_KIND_LABELS[mappingAttachment.kind]} ${numbers[mappingIndex] ?? ''}`}
          questions={questions}
          selectedIds={mappingAttachment.questionIds}
          onChange={(questionIds) => onChangeQuestions(mappingAttachment.fileId, questionIds)}
          onClose={() => setMapping({ fileId: mappingAttachment.fileId, isOpen: false })}
        />
      ) : null}
    </ThemedView>
  );
}

type AttachmentRowProps = {
  attachment: SubmissionAttachment;
  /** So thu tu trong cung loai tep, xem `getAttachmentNumbers`. */
  number: number;
  /** Cac cau cua tep, vd `Câu 1, Câu 3` hoac `Cả bài`. */
  scope: string;
  /** Khong co khi de chi co mot cau. */
  onPickQuestions?: () => void;
  onRemove: () => void;
};

function AttachmentRow({
  attachment,
  number,
  scope,
  onPickQuestions,
  onRemove,
}: AttachmentRowProps) {
  const theme = useTheme();
  const label = `${FILE_KIND_LABELS[attachment.kind]} ${number}`;
  const spoken = `${FILE_KIND_SPOKEN[attachment.kind]} ${number}`;
  const isPdf = attachment.kind === 'PDF';

  return (
    <View style={[styles.row, { borderColor: theme.border }]}>
      {isPdf ? (
        <PdfPreview />
      ) : attachment.uri ? (
        <Image
          source={{ uri: attachment.uri }}
          style={styles.preview}
          contentFit="cover"
          accessibilityLabel={`Ảnh bài làm ${number}`}
        />
      ) : (
        // Anh cua lan nop truoc khong con tren may: tai lai tu BE
        <SubmittedImage
          fileId={attachment.fileId}
          accessibilityLabel={`Ảnh bài làm ${number}, đã gửi ở lần nộp trước`}
          style={styles.preview}
        />
      )}

      <View style={styles.rowText}>
        <ThemedText type="smallBold" numberOfLines={2}>
          {isPdf && attachment.name ? attachment.name : label}
        </ThemedText>
        {isPdf ? (
          <ThemedText type="small" themeColor="textSecondary">
            {attachment.size === null ? label : `${label} · ${formatFileSize(attachment.size)}`}
          </ThemedText>
        ) : null}
        <ThemedText type="small" themeColor="textSecondary">
          Bài làm cho: {scope}
        </ThemedText>
        {onPickQuestions ? (
          <Button
            title="Chọn câu"
            variant="ghost"
            size="sm"
            icon="list-outline"
            accessibilityLabel={`Chọn câu cho ${spoken}`}
            onPress={onPickQuestions}
            style={styles.pickQuestions}
          />
        ) : null}
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Xoá ${spoken}`}
        hitSlop={REMOVE_HIT_SLOP}
        onPress={onRemove}
        style={({ pressed }) => [
          styles.remove,
          { backgroundColor: theme.dangerSoft },
          pressed && styles.pressed,
        ]}
      >
        <Icon name="trash-outline" size={REMOVE_ICON_SIZE} themeColor="danger" />
      </Pressable>
    </View>
  );
}

function PendingRow({ pending }: { pending: PendingUpload }) {
  const theme = useTheme();
  const isPdf = pending.kind === 'PDF';

  return (
    <View
      accessible
      accessibilityLabel={`Đang gửi ${FILE_KIND_SPOKEN[pending.kind]}`}
      style={[styles.row, { borderColor: theme.border }]}
    >
      <View style={styles.preview}>
        {isPdf ? (
          <PdfPreview />
        ) : (
          <Image source={{ uri: pending.file.uri }} style={styles.preview} contentFit="cover" />
        )}
        <View style={[styles.preview, styles.uploading, { backgroundColor: theme.overlay }]}>
          <ActivityIndicator color={theme.primary} />
        </View>
      </View>
      <View style={styles.rowText}>
        {isPdf ? (
          <ThemedText type="smallBold" numberOfLines={2}>
            {pending.file.name}
          </ThemedText>
        ) : null}
        <ThemedText type="small" themeColor="textSecondary">
          Đang gửi…
        </ThemedText>
      </View>
    </View>
  );
}

/** Khung xem truoc cua PDF: app khong ve trang PDF, chi hien bieu tuong. */
function PdfPreview() {
  return (
    <ThemedView type="background" style={[styles.preview, styles.pdf]}>
      <Icon name="document-text-outline" size={PDF_ICON_SIZE} themeColor="primary" />
      <ThemedText type="smallBold" themeColor="primary">
        PDF
      </ThemedText>
    </ThemedView>
  );
}

function PickProblemNotice({ problem }: { problem: AttachmentPickProblem }) {
  const message =
    problem.kind === 'PDF'
      ? PDF_PICK_PROBLEMS[problem.reason]
      : IMAGE_PICK_PROBLEMS[problem.reason];

  return (
    <View style={styles.problem}>
      <ThemedText type="small" themeColor="danger" accessibilityRole="alert">
        {message}
      </ThemedText>
      {problem.kind === 'IMAGE' && problem.reason === 'PERMISSION_DENIED' ? (
        <Button
          title="Mở Cài đặt"
          variant="ghost"
          size="sm"
          icon="settings-outline"
          accessibilityLabel="Mở Cài đặt"
          onPress={() => void Linking.openSettings()}
          style={styles.settings}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { gap: Spacing.three, padding: Spacing.three, borderRadius: Radius.lg },
  header: { gap: Spacing.half },
  title: { fontWeight: 700 },
  list: { gap: Spacing.two },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.three,
    paddingTop: Spacing.two,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  preview: { width: PREVIEW_SIZE, height: PREVIEW_SIZE, borderRadius: Radius.control },
  pdf: { alignItems: 'center', justifyContent: 'center', gap: Spacing.half },
  uploading: {
    position: 'absolute',
    top: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: { flex: 1, gap: Spacing.half },
  pickQuestions: { alignSelf: 'flex-start', borderRadius: Radius.full },
  remove: {
    width: REMOVE_BUTTON_SIZE,
    height: REMOVE_BUTTON_SIZE,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.75 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  action: { flexGrow: 1, flexBasis: 0, minWidth: ACTION_MIN_WIDTH, borderRadius: Radius.full },
  problem: { gap: Spacing.two },
  settings: { alignSelf: 'flex-start', borderRadius: Radius.full },
});
