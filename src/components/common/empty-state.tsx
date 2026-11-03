import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import type { IconName } from '@/components/ui/icon';
import { ThemedText } from '@/components/ui/themed-text';
import { ThemedView } from '@/components/ui/themed-view';
import { Spacing } from '@/constants/theme';

import { StateIcon } from './state-icon';

/** Chu dai qua thi xuong dong trong khoang nay, khong trai het be ngang man hinh. */
const TEXT_MAX_WIDTH = 320;

export type EmptyStateProps = {
  title: string;
  description?: string;
  /** Icon minh hoa. Mac dinh: kinh lup (khong tim thay, chua co gi). */
  icon?: IconName;
  actionLabel?: string;
  actionIcon?: IconName;
  onAction?: () => void;
};

export function EmptyState({
  title,
  description,
  icon = 'search-outline',
  actionLabel,
  actionIcon,
  onAction,
}: EmptyStateProps) {
  return (
    <ThemedView style={styles.container}>
      <StateIcon name={icon} />
      <View style={styles.text}>
        <ThemedText type="heading" style={styles.center}>
          {title}
        </ThemedText>
        {description ? (
          <ThemedText type="small" themeColor="textSecondary" style={styles.center}>
            {description}
          </ThemedText>
        ) : null}
      </View>
      {actionLabel && onAction ? (
        <Button title={actionLabel} icon={actionIcon} onPress={onAction} style={styles.action} />
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
  text: { gap: Spacing.two, maxWidth: TEXT_MAX_WIDTH },
  center: { textAlign: 'center' },
  action: { alignSelf: 'stretch' },
});
