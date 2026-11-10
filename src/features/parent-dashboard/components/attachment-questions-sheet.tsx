import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { BottomSheet } from '@/components/common/bottom-sheet';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { ThemedText } from '@/components/ui/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import type { AssignmentQuestion } from '../types';

/** Cao bang lua chon trac nghiem, du vung cham 44 (design-mobile.md). */
const ROW_MIN_HEIGHT = 48;
const CHECK_ICON_SIZE = 24;
/** De bai dai thi chi hien dau de, du nhan ra cau. */
const PROMPT_LINES = 2;

export type AttachmentQuestionsSheetProps = {
  isVisible: boolean;
  /** Nhan tep dang gan, vd `Ảnh 1`. */
  label: string;
  questions: AssignmentQuestion[];
  selectedIds: readonly string[];
  onChange: (questionIds: string[]) => void;
  onClose: () => void;
};

/**
 * Chon cac cau co bai lam trong mot tep (anh mot trang giay, PDF ca bai). Khong chon cau nao thi tep
 * dung cho ca bai: giao vien tu tim cau trong tep. Bam cau nao luu ngay cau do, "Xong" chi dong sheet.
 */
export function AttachmentQuestionsSheet({
  isVisible,
  label,
  questions,
  selectedIds,
  onChange,
  onClose,
}: AttachmentQuestionsSheetProps) {
  const toggle = (questionId: string) => {
    const isSelected = selectedIds.includes(questionId);
    // Giu thu tu cau trong de, khong theo thu tu bam
    onChange(
      questions
        .map(({ id }) => id)
        .filter((id) => (id === questionId ? !isSelected : selectedIds.includes(id))),
    );
  };

  return (
    <BottomSheet
      isVisible={isVisible}
      title={`${label} có bài làm câu nào?`}
      subtitle="Không chọn câu nào thì giáo viên tự tìm câu trong tệp."
      onClose={onClose}
    >
      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {questions.map((question, index) => (
          <QuestionCheckRow
            key={question.id}
            position={index + 1}
            prompt={question.prompt}
            isChecked={selectedIds.includes(question.id)}
            onPress={() => toggle(question.id)}
          />
        ))}
      </ScrollView>
      <Button title="Xong" onPress={onClose} style={styles.done} />
    </BottomSheet>
  );
}

type QuestionCheckRowProps = {
  position: number;
  prompt: string;
  isChecked: boolean;
  onPress: () => void;
};

function QuestionCheckRow({ position, prompt, isChecked, onPress }: QuestionCheckRowProps) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityLabel={`Câu ${position}: ${prompt}`}
      accessibilityState={{ checked: isChecked }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        {
          borderColor: isChecked ? theme.primary : theme.border,
          backgroundColor: isChecked ? theme.primarySoft : theme.background,
        },
        pressed && styles.pressed,
      ]}
    >
      <Icon
        name={isChecked ? 'checkbox' : 'square-outline'}
        size={CHECK_ICON_SIZE}
        themeColor={isChecked ? 'primary' : 'textSecondary'}
      />
      <View style={styles.rowText}>
        <ThemedText type="smallBold" themeColor="primary">
          Câu {position}
        </ThemedText>
        <ThemedText type="small" numberOfLines={PROMPT_LINES}>
          {prompt}
        </ThemedText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  list: { flexGrow: 0 },
  listContent: { gap: Spacing.two, paddingVertical: Spacing.three },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    minHeight: ROW_MIN_HEIGHT,
    padding: Spacing.three,
    borderWidth: 1,
    borderRadius: Radius.control,
  },
  rowText: { flex: 1, gap: Spacing.half },
  pressed: { opacity: 0.75 },
  done: { borderRadius: Radius.full },
});
