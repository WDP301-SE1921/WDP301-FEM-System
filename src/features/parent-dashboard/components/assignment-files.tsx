import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { ThemedText } from '@/components/ui/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { useOpenFile } from '../hooks/use-open-file';
import type { AssignmentFile } from '../types';
import { formatFileSize, getAssignmentFileScope, isImageFile } from '../utils';

import { SectionCard } from './section-card';
import { SubmittedImageViewer } from './submitted-image-viewer';

const ROW_ICON_SIZE = 22;
const OPEN_ICON_SIZE = 18;
/** Vung cham toi thieu 44 (design-mobile.md). */
const ROW_MIN_HEIGHT = 44;

export type AssignmentFilesProps = {
  /** Tep giao vien cho hoc sinh xem, xem `getAssignmentFiles`. */
  files: AssignmentFile[];
};

/**
 * Tai lieu giao vien dinh kem bai (de PDF, anh de bai). Anh xem ngay trong app; PDF mo bang trinh
 * duyet vi app khong co trinh doc PDF.
 */
export function AssignmentFiles({ files }: AssignmentFilesProps) {
  const theme = useTheme();
  const { open, openingId, error } = useOpenFile();
  const images = files.filter(isImageFile);
  const [viewingIndex, setViewingIndex] = useState<number | null>(null);

  const onPress = (file: AssignmentFile) => {
    if (isImageFile(file)) {
      setViewingIndex(images.findIndex(({ fileId }) => fileId === file.fileId));
      return;
    }
    void open(file.fileId);
  };

  return (
    <SectionCard title="Tài liệu của bài" icon="attach-outline">
      <ThemedText type="small" themeColor="textSecondary">
        Giáo viên gửi kèm {files.length} tệp. Bấm để xem.
      </ThemedText>
      <View style={styles.list}>
        {files.map((file) => {
          const isImage = isImageFile(file);
          const isOpening = openingId === file.fileId;
          return (
            <Pressable
              key={file.fileId}
              accessibilityRole="button"
              accessibilityLabel={`${isImage ? 'Xem ảnh' : 'Mở tệp'} ${file.file.name}, ${getAssignmentFileScope(file)}`}
              accessibilityState={{ busy: isOpening }}
              disabled={isOpening}
              onPress={() => onPress(file)}
              style={({ pressed }) => [
                styles.row,
                { borderColor: theme.border },
                pressed && styles.pressed,
              ]}
            >
              <Icon
                name={isImage ? 'image-outline' : 'document-text-outline'}
                size={ROW_ICON_SIZE}
                themeColor="primary"
              />
              <View style={styles.text}>
                <ThemedText type="smallBold" numberOfLines={2}>
                  {file.file.name}
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {getAssignmentFileScope(file)} · {formatFileSize(file.file.size)}
                </ThemedText>
              </View>
              {isOpening ? (
                <ActivityIndicator color={theme.primary} />
              ) : (
                <Icon
                  name={isImage ? 'expand-outline' : 'open-outline'}
                  size={OPEN_ICON_SIZE}
                  themeColor="textSecondary"
                />
              )}
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
        label="Ảnh đề bài"
      />
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  list: { gap: Spacing.two },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    minHeight: ROW_MIN_HEIGHT,
    paddingVertical: Spacing.two,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  text: { flex: 1, gap: Spacing.half },
  pressed: { opacity: 0.75 },
});
