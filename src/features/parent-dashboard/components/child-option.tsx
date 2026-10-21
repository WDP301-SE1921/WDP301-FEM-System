import { Pressable, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { ThemedText } from '@/components/ui/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import type { LinkedStudent } from '../types';

import { StudentAvatar } from './student-avatar';
import { ToneBadge } from './tone-badge';

/** Vien day bang nhau o hai trang thai de the khong nhay khi doi con. */
const BORDER_WIDTH = 2;
const RADIO_SIZE = 24;
const RADIO_ICON_SIZE = 16;

export type ChildOptionProps = {
  student: LinkedStudent;
  isSelected: boolean;
  onPress: () => void;
};

/** Mot dong trong danh sach chon con: ten, khoi, cac mon dang hoc va nut chon. */
export function ChildOption({ student, isSelected, onPress }: ChildOptionProps) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={`${student.fullName}, khối ${student.grade}`}
      accessibilityState={{ checked: isSelected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { borderColor: isSelected ? theme.primary : theme.border },
        pressed && styles.pressed,
      ]}
    >
      <StudentAvatar fullName={student.fullName} isSelected={isSelected} />

      <View style={styles.info}>
        <ThemedText type="default" numberOfLines={1} style={styles.name}>
          {student.fullName}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Khối {student.grade}
        </ThemedText>
        {student.subjectNames.length > 0 ? (
          <View style={styles.subjects}>
            {student.subjectNames.map((subject) => (
              <ToneBadge key={subject} label={subject} tone={isSelected ? 'primary' : 'neutral'} />
            ))}
          </View>
        ) : null}
      </View>

      <View
        style={[
          styles.radio,
          isSelected
            ? { backgroundColor: theme.primary, borderColor: theme.primary }
            : { borderColor: theme.backgroundSelected },
        ]}
      >
        {isSelected ? (
          <Icon name="checkmark" size={RADIO_ICON_SIZE} themeColor="primaryText" />
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderWidth: BORDER_WIDTH,
    borderRadius: Radius.lg,
  },
  pressed: { opacity: 0.75 },
  info: { flex: 1, gap: Spacing.half },
  name: { fontWeight: 700 },
  subjects: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.one, marginTop: Spacing.one },
  radio: {
    width: RADIO_SIZE,
    height: RADIO_SIZE,
    borderRadius: Radius.full,
    borderWidth: BORDER_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
