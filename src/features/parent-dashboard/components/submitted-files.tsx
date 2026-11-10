import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { ThemedText } from '@/components/ui/themed-text';
import { ThemedView } from '@/components/ui/themed-view';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { useOpenFile } from '../hooks/use-open-file';
import type { SubmittedFileView } from '../types';
import { formatAttachmentCount } from '../utils';

import { SubmittedImage } from './submitted-image';
import { SubmittedImageViewer } from './submitted-image-viewer';

const THUMBNAIL_SIZE = 88;
const FILES_ICON_SIZE = 20;
const PDF_ICON_SIZE = 28;

export type SubmittedFilesProps = {
  /** Tep cua lan nop theo thu tu gui, xem `toSubmittedFiles`. */
  files: readonly SubmittedFileView[];
};

/**
 * Anh va PDF bai lam gui kem lan nop dang xem: anh nho bam de xem tron anh, PDF bam de mo bang trinh
 * duyet. Moi tep co nhan (`Ảnh 1`, `PDF 1`) de doi chieu voi dong "Bài làm gửi kèm" o tung cau.
 */
export function SubmittedFiles({ files }: SubmittedFilesProps) {
  const theme = useTheme();
  const { open, openingId, error } = useOpenFile();
  const [viewingIndex, setViewingIndex] = useState<number | null>(null);
  const images = files.filter(({ kind }) => kind === 'IMAGE');

  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      <View style={styles.header}>
        <Icon name="attach-outline" size={FILES_ICON_SIZE} themeColor="primary" />
        <ThemedText type="small" style={styles.headerText}>
          Đã gửi kèm {formatAttachmentCount(files)} bài làm. Giáo viên chấm theo bài làm gửi kèm và
          phần đã trả lời trên ứng dụng. Bấm vào để xem rõ.
        </ThemedText>
      </View>
      <View style={styles.tiles}>
        {files.map((file) => {
          if (file.kind === 'IMAGE') {
            const imageIndex = images.indexOf(file);
            return (
              <Pressable
                key={file.fileId}
                accessibilityRole="button"
                accessibilityLabel={`Xem ảnh bài làm ${imageIndex + 1}`}
                onPress={() => setViewingIndex(imageIndex)}
                style={({ pressed }) => [styles.tile, pressed && styles.pressed]}
              >
                <SubmittedImage
                  fileId={file.fileId}
                  accessibilityLabel={`Ảnh bài làm ${imageIndex + 1}`}
                  style={styles.thumbnail}
                />
                <ThemedText type="small" themeColor="textSecondary" style={styles.caption}>
                  {file.label}
                </ThemedText>
              </Pressable>
            );
          }
          const isOpening = openingId === file.fileId;
          const name = file.name ?? file.label;
          return (
            <Pressable
              key={file.fileId}
              accessibilityRole="button"
              accessibilityLabel={`Mở tệp ${file.label} bài làm, ${name}`}
              accessibilityState={{ busy: isOpening }}
              disabled={isOpening}
              onPress={() => void open(file.fileId)}
              style={({ pressed }) => [styles.tile, pressed && styles.pressed]}
            >
              <ThemedView
                type="background"
                style={[styles.thumbnail, styles.pdf, { borderColor: theme.border }]}
              >
                {isOpening ? (
                  <ActivityIndicator color={theme.primary} />
                ) : (
                  <Icon name="document-text-outline" size={PDF_ICON_SIZE} themeColor="primary" />
                )}
                <ThemedText type="smallBold" themeColor="primary">
                  {file.label}
                </ThemedText>
              </ThemedView>
              <ThemedText
                type="small"
                themeColor="textSecondary"
                numberOfLines={2}
                style={styles.caption}
              >
                {name}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>
      {error ? (
        <ThemedText type="small" themeColor="danger" accessibilityRole="alert">
          {error}
        </ThemedText>
      ) : null}
      <SubmittedImageViewer
        fileIds={images.map(({ fileId }) => fileId)}
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
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.three },
  tile: { width: THUMBNAIL_SIZE, gap: Spacing.one },
  thumbnail: { width: THUMBNAIL_SIZE, height: THUMBNAIL_SIZE, borderRadius: Radius.lg },
  pdf: { alignItems: 'center', justifyContent: 'center', gap: Spacing.half, borderWidth: 1 },
  caption: { textAlign: 'center' },
  pressed: { opacity: 0.75 },
});
