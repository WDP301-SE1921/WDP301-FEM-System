import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { ThemedText } from '@/components/ui/themed-text';
import { ThemedView } from '@/components/ui/themed-view';
import { Radius, Spacing } from '@/constants/theme';

import { SubmittedImage } from './submitted-image';
import { SubmittedImageViewer } from './submitted-image-viewer';

const THUMBNAIL_SIZE = 88;
const FILES_ICON_SIZE = 20;

export type SubmittedFilesProps = {
  fileIds: readonly string[];
  /** Dong mo ta tren cum anh; bo trong thi dung cau chung cho ca lan nop. */
  heading?: string;
  /** Ten tung anh cho trinh doc man hinh, vd `Ảnh bài làm câu 2`. */
  itemLabel?: string;
};

/** Anh bai lam gui kem lan nop dang xem: anh nho, bam de xem tron anh. */
export function SubmittedFiles({
  fileIds,
  heading,
  itemLabel = 'Ảnh bài làm',
}: SubmittedFilesProps) {
  const [viewingIndex, setViewingIndex] = useState<number | null>(null);

  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      <View style={styles.header}>
        <Icon name="images-outline" size={FILES_ICON_SIZE} themeColor="primary" />
        <ThemedText type="small" style={styles.headerText}>
          {heading ??
            `Đã gửi kèm ${fileIds.length} ảnh bài làm. Giáo viên chấm câu tự luận theo ảnh và phần chữ đã gõ. Bấm vào ảnh để xem rõ.`}
        </ThemedText>
      </View>
      <View style={styles.thumbnails}>
        {fileIds.map((fileId, index) => (
          <Pressable
            key={fileId}
            accessibilityRole="button"
            accessibilityLabel={`Xem ${itemLabel.toLowerCase()} ${index + 1}`}
            onPress={() => setViewingIndex(index)}
            style={({ pressed }) => [styles.thumbnail, pressed && styles.pressed]}
          >
            <SubmittedImage
              fileId={fileId}
              accessibilityLabel={`${itemLabel} ${index + 1}`}
              style={styles.image}
            />
          </Pressable>
        ))}
      </View>
      <SubmittedImageViewer
        fileIds={fileIds}
        index={viewingIndex}
        onChangeIndex={setViewingIndex}
        onClose={() => setViewingIndex(null)}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: { gap: Spacing.three, padding: Spacing.three, borderRadius: Radius.control },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  headerText: { flex: 1 },
  thumbnails: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.three },
  thumbnail: { width: THUMBNAIL_SIZE, height: THUMBNAIL_SIZE },
  image: { width: THUMBNAIL_SIZE, height: THUMBNAIL_SIZE, borderRadius: Radius.lg },
  pressed: { opacity: 0.75 },
});
