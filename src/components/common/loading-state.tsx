import { ActivityIndicator, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/ui/themed-text';
import { ThemedView } from '@/components/ui/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type LoadingStateProps = {
  message?: string;
};

export function LoadingState({ message }: LoadingStateProps) {
  const theme = useTheme();

  return (
    <ThemedView style={styles.container}>
      <ActivityIndicator size="large" color={theme.primary} />
      {message ? (
        <ThemedText type="small" themeColor="textSecondary">
          {message}
        </ThemedText>
      ) : null}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.three },
});
