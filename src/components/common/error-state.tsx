import { StyleSheet } from 'react-native';

import { Button } from '@/components/ui/button';
import { ThemedText } from '@/components/ui/themed-text';
import { ThemedView } from '@/components/ui/themed-view';
import { Spacing } from '@/constants/theme';
import { getErrorMessage } from '@/utils/error';

export type ErrorStateProps = {
  error: unknown;
  onRetry?: () => void;
};

export function ErrorState({ error, onRetry }: ErrorStateProps) {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="smallBold" themeColor="danger" style={styles.center}>
        {getErrorMessage(error)}
      </ThemedText>
      {onRetry ? <Button title="Thử lại" variant="secondary" onPress={onRetry} /> : null}
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
