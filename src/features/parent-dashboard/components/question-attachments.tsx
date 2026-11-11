import { Image } from 'expo-image';
import { ActivityIndicator, Linking, Pressable, StyleSheet, View } from 'react-native';

import { FormError } from '@/components/common/form-error';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { ThemedText } from '@/components/ui/themed-text';
import { ThemedView } from '@/components/ui/themed-view';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { ImageSource } from '@/lib/image-picker';

import { IMAGE_PICK_PROBLEMS, MAX_SUBMISSION_FILES, PDF_PICK_PROBLEMS } from '../constants';
import type { UploadingAttachment } from '../hooks/use-submission-upload';
import type { AttachmentPickProblem, SubmissionAttachment } from '../types';

import { SubmittedImage } from './submitted-image';

const THUMBNAIL_SIZE = 88;
const REMOVE_BUTTON_SIZE = 28;
/** Bu phan thieu cua nut xoa de vung cham dat 44x44 (design-mobile.md). */
const REMOVE_HIT_SLOP = 8;
const REMOVE_ICON_SIZE = 16;
const PDF_ICON_SIZE = 28;
/** Du cho icon + "Chụp ảnh" tren mot dong; may hep thi nut thu ba xuong hang. */
const ACTION_MIN_WIDTH = 132;

export type QuestionAttachmentsProps = {
  /** Thu tu cau trong de, tinh tu 1. */
  position: number;
  /** Anh/file da tai len cua rieng cau nay. */
  attachments: readonly SubmissionAttachment[];
  /** Tep dang tai len cho cau nay, null khi khong co. */
  uploading: UploadingAttachment | null;
  /** Dang tai tep (o bat ky cau nao): moi luc chi tai mot tep. */
  isBusy: boolean;
  /** So anh/file con them duoc cho ca bai (BE nhan toi da `MAX_SUBMISSION_FILES` moi lan nop). */
  remainingSlots: number;
  problem: AttachmentPickProblem | null;
  /** Loi khi tai tep cua cau nay len BE. */
  uploadError: unknown;
  onAddImage: (source: ImageSource) => void;
  onAddPdf: () => void;
  onRemove: (fileId: string) => void;
};

/**
 * Anh hoac file PDF bai lam cua rieng mot cau tu luan: con lam ra giay (cong thuc, hinh ve) roi chup
 * hoac gui file cho dung cau do, giao vien va AI cham theo anh cua tung cau.
 */
export function QuestionAttachments({
  position,
  attachments,
  uploading,
  isBusy,
  remainingSlots,
  problem,
  uploadError,
  onAddImage,
  onAddPdf,
  onRemove,
}: QuestionAttachmentsProps) {
  const theme = useTheme();
  const isFull = remainingSlots <= 0;
  const canAdd = !isBusy && !isFull;
  const subject = `bài làm câu ${position}`;

  return (
    <ThemedView
      type="background"
      style={[styles.box, { borderColor: theme.border }]}
      accessibilityLabel={`Ảnh và file ${subject}`}
    >
      <View style={styles.header}>
        <Icon name="attach-outline" size={REMOVE_ICON_SIZE + 2} themeColor="primary" />
        <ThemedText type="smallBold" style={styles.title}>
          Ảnh / file PDF câu {position} (không bắt buộc)
        </ThemedText>
      </View>
      <ThemedText type="small" themeColor="textSecondary">
        Làm câu này ra giấy thì chụp ảnh hoặc gửi file PDF riêng cho câu này.
      </ThemedText>

      {attachments.length > 0 || uploading ? (
        <View style={styles.thumbnails}>
          {attachments.map((attachment, index) => (
            <AttachmentThumbnail
              key={attachment.fileId}
              attachment={attachment}
              label={`${attachment.kind === 'PDF' ? 'File PDF' : 'Ảnh'} ${subject} số ${index + 1}`}
              onRemove={() => onRemove(attachment.fileId)}
            />
          ))}
          {uploading ? <UploadingThumbnail uploading={uploading} subject={subject} /> : null}
        </View>
      ) : null}

      <View style={styles.actions}>
        <Button
          title="Chụp ảnh"
          variant="secondary"
          size="sm"
          icon="camera-outline"
          accessibilityLabel={`Chụp ảnh ${subject}`}
          disabled={!canAdd}
          onPress={() => onAddImage('camera')}
          style={styles.action}
        />
        <Button
          title="Chọn ảnh"
          variant="secondary"
          size="sm"
          icon="images-outline"
          accessibilityLabel={`Chọn ảnh ${subject} có sẵn`}
          disabled={!canAdd}
          onPress={() => onAddImage('library')}
          style={styles.action}
        />
        <Button
          title="File PDF"
          variant="secondary"
          size="sm"
          icon="document-attach-outline"
          accessibilityLabel={`Chọn file PDF ${subject}`}
          disabled={!canAdd}
          onPress={onAddPdf}
          style={styles.action}
        />
      </View>

      {isFull ? (
        <ThemedText type="small" themeColor="textSecondary">
          Cả bài đã đủ {MAX_SUBMISSION_FILES} ảnh/file. Xoá bớt ở câu khác nếu muốn gửi thêm.
        </ThemedText>
      ) : null}
      {problem ? <PickProblemNotice problem={problem} /> : null}
      <FormError error={uploadError} />
    </ThemedView>
  );
}

type AttachmentThumbnailProps = {
  attachment: SubmissionAttachment;
  label: string;
  onRemove: () => void;
};

function AttachmentThumbnail({ attachment, label, onRemove }: AttachmentThumbnailProps) {
  const theme = useTheme();

  const renderPreview = () => {
    if (attachment.kind === 'PDF') return <PdfTile name={attachment.name} label={label} />;
    if (attachment.uri) {
      return (
        <Image
          source={{ uri: attachment.uri }}
          style={styles.image}
          contentFit="cover"
          accessibilityLabel={label}
        />
      );
    }
    // Tep cua lan nop truoc khong con tren may: tai lai tu BE
    return (
      <SubmittedImage
        fileId={attachment.fileId}
        accessibilityLabel={`${label}, đã gửi ở lần nộp trước`}
        style={styles.image}
      />
    );
  };

  return (
    <View style={styles.thumbnail}>
      {renderPreview()}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Xoá ${label.charAt(0).toLowerCase()}${label.slice(1)}`}
        hitSlop={REMOVE_HIT_SLOP}
        onPress={onRemove}
        style={({ pressed }) => [
          styles.remove,
          { backgroundColor: theme.danger, borderColor: theme.background },
          pressed && styles.pressed,
        ]}
      >
        <Icon name="close" size={REMOVE_ICON_SIZE} themeColor="primaryText" />
      </Pressable>
    </View>
  );
}

function PdfTile({ name, label }: { name?: string; label: string }) {
  const theme = useTheme();

  return (
    <ThemedView
      type="backgroundElement"
      accessible
      accessibilityLabel={name ? `${label}: ${name}` : label}
      style={[styles.image, styles.pdf, { borderColor: theme.border }]}
    >
      <Icon name="document-text-outline" size={PDF_ICON_SIZE} themeColor="primary" />
      <ThemedText type="small" numberOfLines={2} style={styles.pdfName}>
        {name ?? 'File PDF'}
      </ThemedText>
    </ThemedView>
  );
}

function UploadingThumbnail({
  uploading,
  subject,
}: {
  uploading: UploadingAttachment;
  subject: string;
}) {
  const theme = useTheme();

  return (
    <View accessible accessibilityLabel={`Đang gửi tệp ${subject}`} style={styles.thumbnail}>
      {uploading.kind === 'PDF' ? (
        <PdfTile name={uploading.name} label={`File PDF ${subject}`} />
      ) : (
        <Image source={{ uri: uploading.uri }} style={styles.image} contentFit="cover" />
      )}
      <View style={[styles.image, styles.uploading, { backgroundColor: theme.overlay }]}>
        <ActivityIndicator color={theme.primary} />
      </View>
    </View>
  );
}

function PickProblemNotice({ problem }: { problem: AttachmentPickProblem }) {
  const message =
    problem.kind === 'PDF'
      ? PDF_PICK_PROBLEMS[problem.problem]
      : IMAGE_PICK_PROBLEMS[problem.problem];

  return (
    <View style={styles.problem}>
      <ThemedText type="small" themeColor="danger" accessibilityRole="alert">
        {message}
      </ThemedText>
      {problem.kind === 'IMAGE' && problem.problem === 'PERMISSION_DENIED' ? (
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
  box: {
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Radius.control,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  title: { flex: 1 },
  thumbnails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
    paddingTop: Spacing.two,
  },
  thumbnail: { width: THUMBNAIL_SIZE, height: THUMBNAIL_SIZE },
  image: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: THUMBNAIL_SIZE,
    height: THUMBNAIL_SIZE,
    borderRadius: Radius.lg,
  },
  pdf: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
    padding: Spacing.one,
    borderWidth: 1,
  },
  pdfName: { textAlign: 'center' },
  uploading: { alignItems: 'center', justifyContent: 'center' },
  remove: {
    position: 'absolute',
    top: -Spacing.two,
    right: -Spacing.two,
    width: REMOVE_BUTTON_SIZE,
    height: REMOVE_BUTTON_SIZE,
    borderRadius: Radius.full,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.75 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  // Khong de nut co lai lam chu be doi: may hep thi nut thu ba xuong hang
  action: { flexGrow: 1, minWidth: ACTION_MIN_WIDTH, borderRadius: Radius.full },
  problem: { gap: Spacing.two },
  settings: { alignSelf: 'flex-start', borderRadius: Radius.full },
});
