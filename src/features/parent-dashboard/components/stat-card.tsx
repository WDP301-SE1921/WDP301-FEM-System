import type { PropsWithChildren, ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ui/themed-text';
import { ThemedView } from '@/components/ui/themed-view';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type StatCardProps = PropsWithChildren<{
  label: string;
  /** Icon hoac nhan o goc phai. */
  trailing?: ReactNode;
  /** Co thi ca o la nut mo phan chi tiet cua so lieu. */
  onPress?: () => void;
  /** Ten doc cho trinh doc man hinh khi o bam duoc, vd `Tỷ lệ đi học 92%`. */
  accessibilityLabel?: string;
  accessibilityHint?: string;
}>;

/** O so lieu nho, dat hai o canh nhau tren mot hang. */
export function StatCard({
  label,
  trailing,
  onPress,
  accessibilityLabel,
  accessibilityHint,
  children,
}: StatCardProps) {
  const theme = useTheme();

  const card = (
    <ThemedView type="backgroundElement" style={[styles.card, { borderColor: theme.border }]}>
      <View style={styles.header}>
        <ThemedText type="small" themeColor="textSecondary" numberOfLines={1} style={styles.label}>
          {label}
        </ThemedText>
        {trailing}
      </View>
      {children}
    </ThemedView>
  );
  if (!onPress) return card;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint={accessibilityHint}
      onPress={onPress}
      style={({ pressed }) => [styles.pressable, pressed && styles.pressed]}
    >
      {card}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: { flex: 1 },
  pressed: { opacity: 0.75 },
  card: {
    flex: 1,
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  // Hai o tren mot hang chi rong khoang 115dp tren man hinh 360dp: nhan xep loai ("Khá", "Chưa đạt")
  // xuong dong duoi tieu de thay vi cat tieu de con vai chu
  header: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.one,
  },
  label: { flexShrink: 1 },
});
