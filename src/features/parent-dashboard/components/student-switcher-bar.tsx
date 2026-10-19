import { Pressable, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { ThemedText } from '@/components/ui/themed-text';
import { ThemedView } from '@/components/ui/themed-view';
import { Radius, Spacing } from '@/constants/theme';
import { getInitials, getShortName } from '@/utils/format';

import type { LinkedStudent } from '../types';

import { ToneBadge } from './tone-badge';

const AVATAR_SIZE = 40;
const SWAP_CIRCLE_SIZE = 32;
const SWAP_ICON_SIZE = 18;

export type StudentSwitcherBarProps = {
  student: LinkedStudent;
  /** Mo danh sach chon con. */
  onPress: () => void;
};

/** Thanh con dang xem o dau man hinh: avatar, ten, lop va cac mon dang hoc. Bam de doi con. */
export function StudentSwitcherBar({ student, onPress }: StudentSwitcherBarProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Chọn học sinh, đang xem ${student.fullName}`}
      onPress={onPress}
      style={({ pressed }) => [pressed && styles.pressed]}
    >
      <ThemedView type="backgroundElement" style={styles.bar}>
        <ThemedView type="primary" style={styles.avatar}>
          <ThemedText type="smallBold" themeColor="primaryText">
            {getInitials(student.fullName)}
          </ThemedText>
        </ThemedView>

        <View style={styles.info}>
          <View style={styles.nameRow}>
            <ThemedText type="default" numberOfLines={1} style={styles.name}>
              {getShortName(student.fullName)}
            </ThemedText>
            <ToneBadge label={`Lớp ${student.grade}`} tone="primary" />
          </View>
          {student.subjectNames.length > 0 ? (
            <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
              {student.subjectNames.join(' · ')}
            </ThemedText>
          ) : null}
        </View>

        <ThemedView type="background" style={styles.swapCircle}>
          <Icon name="swap-horizontal" size={SWAP_ICON_SIZE} themeColor="textSecondary" />
        </ThemedView>
      </ThemedView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.75 },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.one,
    paddingLeft: Spacing.one,
    paddingRight: Spacing.two,
    borderRadius: Radius.full,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  name: { flexShrink: 1, fontWeight: 700 },
  swapCircle: {
    width: SWAP_CIRCLE_SIZE,
    height: SWAP_CIRCLE_SIZE,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
