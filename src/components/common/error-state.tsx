import { StyleSheet } from 'react-native';

import { Button } from '@/components/ui/button';
import { ThemedText } from '@/components/ui/themed-text';
import { ThemedView } from '@/components/ui/themed-view';
import { Spacing } from '@/constants/theme';
import { AppError } from '@/types/api';

type ErrorStateProps = {
  error: unknown;
  onRetry?: () => void;
};

export function ErrorState({ error, onRetry }: ErrorStateProps) {
  const message =
    error instanceof AppError
      ? error.message
      : error instanceof Error
        ? error.message
        : 'Da co loi khong xac dinh.';

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="smallBold" themeColor="danger" style={styles.center}>
        {message}
      </ThemedText>
      {onRetry ? <Button title="Thu lai" variant="secondary" onPress={onRetry} /> : null}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
    padding: Spacing.four,
  },
  center: { textAlign: 'center' },
});
