import type { PropsWithChildren, ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ui/themed-text';
import { ThemedView } from '@/components/ui/themed-view';
import { Radius, Spacing } from '@/constants/theme';

export type SessionInfoRowProps = PropsWithChildren<{
  /** Icon tron hoac avatar dau dong. */
  leading: ReactNode;
  label: string;
  value?: string;
  /** Dong phu duoi cung, vd thoi luong buoi hoc. */
  hint?: string | null;
}>;

/** Mot dong thong tin cua buoi hoc. `children` nam giua gia tri va dong phu, vd nhan trang thai. */
export function SessionInfoRow({ leading, label, value, hint, children }: SessionInfoRowProps) {
  return (
    <ThemedView style={styles.row}>
      {leading}
      <View style={styles.content}>
        <ThemedText type="small" themeColor="textSecondary">
          {label}
        </ThemedText>
        {value ? (
          <ThemedText type="default" style={styles.value}>
            {value}
          </ThemedText>
        ) : null}
        {children}
        {hint ? (
          <ThemedText type="small" themeColor="textSecondary">
            {hint}
          </ThemedText>
        ) : null}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.two,
    paddingRight: Spacing.three,
    borderRadius: Radius.control,
  },
  content: { flex: 1, alignItems: 'flex-start', gap: Spacing.half },
  value: { fontWeight: 700 },
});
