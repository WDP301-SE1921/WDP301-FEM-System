import { ScrollView, StyleSheet } from 'react-native';

import { BottomSheet } from '@/components/common/bottom-sheet';
import { Button } from '@/components/ui/button';
import { Radius, Spacing } from '@/constants/theme';

import type { LinkedStudent } from '../types';

import { ChildOption } from './child-option';

export type ChildPickerSheetProps = {
  isVisible: boolean;
  students: LinkedStudent[];
  selectedId: string;
  onSelect: (studentId: string) => void;
  onAddChild: () => void;
  onClose: () => void;
};

/** Bottom sheet chon con: xem khoi va mon cua tung con, hoac mo form them con. */
export function ChildPickerSheet({
  isVisible,
  students,
  selectedId,
  onSelect,
  onAddChild,
  onClose,
}: ChildPickerSheetProps) {
  return (
    <BottomSheet
      isVisible={isVisible}
      title="Chọn học sinh"
      subtitle="Chuyển hồ sơ để theo dõi tình hình học tập"
      onClose={onClose}
    >
      <ScrollView
        accessibilityRole="radiogroup"
        style={styles.list}
        contentContainerStyle={styles.listContent}
      >
        {students.map((student) => (
          <ChildOption
            key={student.id}
            student={student}
            isSelected={student.id === selectedId}
            onPress={() => onSelect(student.id)}
          />
        ))}
      </ScrollView>

      <Button
        title="Thêm học sinh"
        variant="ghost"
        icon="person-add-outline"
        onPress={onAddChild}
        style={styles.addButton}
      />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  list: { flexGrow: 0 },
  listContent: { gap: Spacing.three, paddingVertical: Spacing.three },
  addButton: { borderRadius: Radius.full },
});
