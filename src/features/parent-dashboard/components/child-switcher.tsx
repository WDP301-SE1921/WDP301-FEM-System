import { Pressable, ScrollView, StyleSheet } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { ThemedText } from '@/components/ui/themed-text';
import { ThemedView } from '@/components/ui/themed-view';
import { Radius, Spacing, type ThemeColor } from '@/constants/theme';
import { getShortName } from '@/utils/format';

import type { Tone } from '../constants';
import type { LinkedStudent } from '../types';

import { STUDENT_AVATAR_OUTER_SIZE, StudentAvatar } from './student-avatar';
import { ToneBadge } from './tone-badge';

const ADD_ICON_SIZE = 24;
/** Du cho ten hai tu, ten dai hon bi cat bot. */
const ITEM_MAX_WIDTH = 96;

const LABEL_APPEARANCES: Record<'selected' | 'idle', { name: ThemeColor; gradeTone: Tone }> = {
  selected: { name: 'primary', gradeTone: 'primary' },
  idle: { name: 'text', gradeTone: 'neutral' },
};

export type ChildSwitcherProps = {
  students: LinkedStudent[];
  selectedId: string;
  onSelect: (studentId: string) => void;
  onAddChild: () => void;
};

/** Chon con dang xem, cuon ngang khi co nhieu con (design-mobile.md: child switcher). */
export function ChildSwitcher({ students, selectedId, onSelect, onAddChild }: ChildSwitcherProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scroll}
      contentContainerStyle={styles.content}
    >
      {students.map((student) => (
        <ChildItem
          key={student.id}
          student={student}
          isSelected={student.id === selectedId}
          onPress={() => onSelect(student.id)}
        />
      ))}
      <AddChildItem onPress={onAddChild} />
    </ScrollView>
  );
}

type ChildItemProps = {
  student: LinkedStudent;
  isSelected: boolean;
  onPress: () => void;
};

function ChildItem({ student, isSelected, onPress }: ChildItemProps) {
  const appearance = LABEL_APPEARANCES[isSelected ? 'selected' : 'idle'];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${student.fullName}, lớp ${student.grade}`}
      accessibilityState={{ selected: isSelected }}
      onPress={onPress}
      style={({ pressed }) => [styles.item, pressed && styles.pressed]}
    >
      <StudentAvatar fullName={student.fullName} isSelected={isSelected} />
      <ThemedText
        type={isSelected ? 'smallBold' : 'small'}
        themeColor={appearance.name}
        numberOfLines={1}
      >
        {getShortName(student.fullName)}
      </ThemedText>
      <ToneBadge label={`Lớp ${student.grade}`} tone={appearance.gradeTone} />
    </Pressable>
  );
}

function AddChildItem({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Thêm con"
      accessibilityHint="Nhập mã liên kết trung tâm gửi qua email"
      onPress={onPress}
      style={({ pressed }) => [styles.item, pressed && styles.pressed]}
    >
      <ThemedView type="backgroundElement" style={styles.addCircle}>
        <Icon name="add" size={ADD_ICON_SIZE} themeColor="textSecondary" />
      </ThemedView>
      <ThemedText type="small" themeColor="textSecondary">
        Thêm con
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // Tran ra het be ngang man hinh de cuon sat mep, noi dung van thang hang voi padding cua Screen
  scroll: { flexGrow: 0, marginHorizontal: -Spacing.four },
  content: { paddingHorizontal: Spacing.four, gap: Spacing.three },
  item: { alignItems: 'center', gap: Spacing.one, maxWidth: ITEM_MAX_WIDTH },
  pressed: { opacity: 0.75 },
  addCircle: {
    width: STUDENT_AVATAR_OUTER_SIZE,
    height: STUDENT_AVATAR_OUTER_SIZE,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
