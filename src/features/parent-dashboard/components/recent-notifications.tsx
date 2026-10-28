import type { PropsWithChildren } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { ThemedText } from '@/components/ui/themed-text';
import { Spacing } from '@/constants/theme';

import { SectionCard } from './section-card';

const CHEVRON_SIZE = 16;
/** Chu cao 20px, bu them de vung cham dat 44x44 (design-mobile.md). */
const SEE_ALL_HIT_SLOP = 12;

export type RecentNotificationsProps = PropsWithChildren<{
  onSeeAll: () => void;
}>;

/** Khung "Thông báo mới" kem nut "Xem tất cả"; noi dung (danh sach, dang tai, loi) do container dat. */
export function RecentNotifications({ onSeeAll, children }: RecentNotificationsProps) {
  return (
    <SectionCard
      title="Thông báo mới"
      icon="newspaper-outline"
      trailing={<SeeAllLink onPress={onSeeAll} />}
    >
      {children}
    </SectionCard>
  );
}

function SeeAllLink({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Xem tất cả thông báo"
      hitSlop={SEE_ALL_HIT_SLOP}
      onPress={onPress}
      style={({ pressed }) => [styles.seeAll, pressed && styles.pressed]}
    >
      <ThemedText type="smallBold" themeColor="primary">
        Xem tất cả
      </ThemedText>
      <Icon name="chevron-forward" size={CHEVRON_SIZE} themeColor="primary" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  seeAll: { flexDirection: 'row', alignItems: 'center', gap: Spacing.half },
  pressed: { opacity: 0.75 },
});
