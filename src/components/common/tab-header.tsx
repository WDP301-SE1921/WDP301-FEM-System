import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ui/themed-text';
import { Spacing } from '@/constants/theme';

/** Bang nut 44x44 o ben phai de tieu de mot dong va tieu de co nut cao nhu nhau. */
const MIN_HEIGHT = 44;

export type TabHeaderProps = {
  title: string;
  subtitle?: string;
  /** Nut ben phai tieu de, vd chuong thong bao. */
  trailing?: ReactNode;
};

/** Tieu de dau moi tab: cung co chu, cung khoang cach tren moi tab. */
export function TabHeader({ title, subtitle, trailing }: TabHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.text}>
        <ThemedText type="heading" accessibilityRole="header">
          {title}
        </ThemedText>
        {subtitle ? (
          <ThemedText type="small" themeColor="textSecondary">
            {subtitle}
          </ThemedText>
        ) : null}
      </View>
      {trailing}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    minHeight: MIN_HEIGHT,
  },
  text: { flex: 1, gap: Spacing.half },
});
