import { StyleSheet } from 'react-native';

import { Button } from '@/components/ui/button';
import { ThemedText } from '@/components/ui/themed-text';
import { ThemedView } from '@/components/ui/themed-view';
import { Spacing } from '@/constants/theme';
import { getErrorMessage } from '@/utils/error';

import { StateIcon } from './state-icon';

/** Chu dai qua thi xuong dong trong khoang nay, khong trai het be ngang man hinh. */
const TEXT_MAX_WIDTH = 320;

export type ErrorStateProps = {
  error: unknown;
  onRetry?: () => void;
};

export function ErrorState({ error, onRetry }: ErrorStateProps) {
  return (
    <ThemedView style={styles.container}>
      <StateIcon name="alert-circle-outline" tone="danger" />
      <ThemedText type="default" style={styles.message}>
        {getErrorMessage(error)}
      </ThemedText>
      {onRetry ? (
        <Button title="Thử lại" variant="secondary" icon="refresh" onPress={onRetry} />
      ) : null}
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
  message: { textAlign: 'center', maxWidth: TEXT_MAX_WIDTH },
});
