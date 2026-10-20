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

import { IMAGE_PICK_PROBLEMS, MAX_SUBMISSION_FILES } from '../constants';
import type { ImagePickProblem, SubmissionAttachment } from '../types';

const THUMBNAIL_SIZE = 88;
const REMOVE_BUTTON_SIZE = 28;
/** Bu phan thieu cua nut xoa de vung cham dat 44x44 (design-mobile.md). */
const REMOVE_HIT_SLOP = 8;
const REMOVE_ICON_SIZE = 16;
const PLACEHOLDER_ICON_SIZE = 28;

export type AssignmentAttachmentsProps = {
  attachments: readonly SubmissionAttachment[];
  /** Anh dang tai len (hien kem vong quay), null khi khong co. */
  uploadingUri: string | null;
  problem: ImagePickProblem | null;
  /** Loi khi tai anh len BE. */
  uploadError: unknown;
  onAdd: (source: ImageSource) => void;
  onRemove: (fileId: string) => void;
};

/**
 * Anh bai lam gui kem bai nop: con lam bai tu luan ra giay (cong thuc, hinh ve) roi chup gui giao vien.
 * BE nhan anh cho ca lan nop, khong theo tung cau.
 */
export function AssignmentAttachments({
  attachments,
  uploadingUri,
  problem,
  uploadError,
  onAdd,
  onRemove,
}: AssignmentAttachmentsProps) {
  const isUploading = uploadingUri !== null;
  const isFull = attachments.length >= MAX_SUBMISSION_FILES;
  const canAdd = !isUploading && !isFull;

  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      <View style={styles.header}>
        <ThemedText type="default" accessibilityRole="header" style={styles.title}>
          Ảnh bài làm (không bắt buộc)
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Làm bài tự luận ra giấy thì chụp ảnh gửi kèm, tối đa {MAX_SUBMISSION_FILES} ảnh. Giáo viên
          chấm theo ảnh và phần chữ đã gõ.
        </ThemedText>
      </View>

      {attachments.length > 0 || isUploading ? (
        <View style={styles.thumbnails}>
          {attachments.map((attachment, index) => (
            <AttachmentThumbnail
              key={attachment.fileId}
              attachment={attachment}
              position={index + 1}
              onRemove={() => onRemove(attachment.fileId)}
            />
          ))}
          {uploadingUri ? <UploadingThumbnail uri={uploadingUri} /> : null}
        </View>
      ) : null}

      <View style={styles.actions}>
        <Button
          title="Chụp ảnh"
          variant="secondary"
          icon="camera-outline"
          accessibilityLabel="Chụp ảnh bài làm"
          disabled={!canAdd}
          onPress={() => onAdd('camera')}
          style={styles.action}
        />
        <Button
          title="Chọn ảnh"
          variant="secondary"
          icon="images-outline"
          accessibilityLabel="Chọn ảnh bài làm có sẵn"
          disabled={!canAdd}
          onPress={() => onAdd('library')}
          style={styles.action}
        />
      </View>

      {isFull ? (
        <ThemedText type="small" themeColor="textSecondary">
          Đã đủ {MAX_SUBMISSION_FILES} ảnh. Xoá bớt ảnh nếu muốn gửi ảnh khác.
        </ThemedText>
      ) : null}
      {problem ? <PickProblemNotice problem={problem} /> : null}
      <FormError error={uploadError} />
    </ThemedView>
  );
}

type AttachmentThumbnailProps = {
  attachment: SubmissionAttachment;
  position: number;
  onRemove: () => void;
};

function AttachmentThumbnail({ attachment, position, onRemove }: AttachmentThumbnailProps) {
  const theme = useTheme();

  return (
    <View style={styles.thumbnail}>
      {attachment.uri ? (
        <Image
          source={{ uri: attachment.uri }}
          style={styles.image}
          contentFit="cover"
          accessibilityLabel={`Ảnh bài làm ${position}`}
        />
      ) : (
        // Anh cua lan nop truoc: app chua tai duoc anh da nop de xem lai
        <ThemedView
          type="background"
          accessible
          accessibilityLabel={`Ảnh bài làm ${position}, đã gửi ở lần nộp trước`}
          style={[styles.image, styles.placeholder, { borderColor: theme.border }]}
        >
          <Icon name="image-outline" size={PLACEHOLDER_ICON_SIZE} themeColor="textSecondary" />
          <ThemedText type="small" themeColor="textSecondary" style={styles.placeholderText}>
            Lần trước
          </ThemedText>
        </ThemedView>
      )}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Xoá ảnh bài làm ${position}`}
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

function UploadingThumbnail({ uri }: { uri: string }) {
  const theme = useTheme();

  return (
    <View accessible accessibilityLabel="Đang gửi ảnh bài làm" style={styles.thumbnail}>
      <Image source={{ uri }} style={styles.image} contentFit="cover" />
      <View style={[styles.image, styles.uploading, { backgroundColor: theme.overlay }]}>
        <ActivityIndicator color={theme.primary} />
      </View>
    </View>
  );
}

function PickProblemNotice({ problem }: { problem: ImagePickProblem }) {
  return (
    <View style={styles.problem}>
      <ThemedText type="small" themeColor="danger" accessibilityRole="alert">
        {IMAGE_PICK_PROBLEMS[problem]}
      </ThemedText>
      {problem === 'PERMISSION_DENIED' ? (
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
  thumbnails: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.three },
  thumbnail: { width: THUMBNAIL_SIZE, height: THUMBNAIL_SIZE },
  image: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: THUMBNAIL_SIZE,
    height: THUMBNAIL_SIZE,
    borderRadius: Radius.lg,
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.half,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  placeholderText: { textAlign: 'center' },
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
  action: { flexGrow: 1, flexBasis: 0, borderRadius: Radius.full },
  problem: { gap: Spacing.two },
  settings: { alignSelf: 'flex-start', borderRadius: Radius.full },
});
