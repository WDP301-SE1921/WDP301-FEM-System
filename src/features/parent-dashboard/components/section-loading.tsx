import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ui/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type SectionLoadingProps = {
  /** Vd `Đang tải điểm…`. */
  message: string;
};

/** Mot phan cua the dang tai, nho gon de khong day cac phan da tai xong. */
export function SectionLoading({ message }: SectionLoadingProps) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <ActivityIndicator size="small" color={theme.primary} />
      <ThemedText type="small" themeColor="textSecondary" style={styles.text}>
        {message}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  text: { flexShrink: 1 },
});
