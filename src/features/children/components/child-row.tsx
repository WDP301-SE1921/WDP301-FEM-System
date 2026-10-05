import { Pressable, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { ThemedText } from '@/components/ui/themed-text';
import { ThemedView } from '@/components/ui/themed-view';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { getInitials } from '@/utils/format';

import type { ChildProfile } from '../types';
import { formatBirthDate } from '../utils';

const AVATAR_SIZE = 44;
const EDIT_ICON_SIZE = 20;

export type ChildRowProps = {
  child: ChildProfile;
  /** Mo man hinh sua ho so cua con. */
  onPress: () => void;
};

/** Mot dong ho so con: chu cai dau, ho ten, lop va ngay sinh. Bam de sua ho so. */
export function ChildRow({ child, onPress }: ChildRowProps) {
  const theme = useTheme();
  const birthDate = formatBirthDate(child.dateOfBirth);
  const details = birthDate ? `Lớp ${child.grade} · Sinh ngày ${birthDate}` : `Lớp ${child.grade}`;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${child.fullName}, ${details}`}
      accessibilityHint="Sửa hồ sơ của con"
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: theme.backgroundElement, borderColor: theme.border },
        pressed && styles.pressed,
      ]}
    >
      <ThemedView type="primarySoft" style={styles.avatar}>
        <ThemedText type="smallBold" themeColor="primary">
          {getInitials(child.fullName)}
        </ThemedText>
      </ThemedView>
      <View style={styles.info}>
        <ThemedText type="default" numberOfLines={1} style={styles.name}>
          {child.fullName}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {details}
        </ThemedText>
      </View>
      <Icon name="create-outline" size={EDIT_ICON_SIZE} themeColor="textSecondary" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderWidth: 1,
    borderRadius: Radius.lg,
  },
  pressed: { opacity: 0.75 },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { flex: 1, gap: Spacing.half },
  name: { fontWeight: 700 },
});
