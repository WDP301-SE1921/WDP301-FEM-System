import { StyleSheet, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { ThemedText } from '@/components/ui/themed-text';
import { Spacing } from '@/constants/theme';

import { ActionChip } from './action-chip';

const ICON_SIZE = 18;

export type SectionLoadErrorProps = {
  /** Vd `Không tải được điểm.` */
  message: string;
  onRetry: () => void;
};

/**
 * Loi tai mot phan cua the, kem nut thu lai rieng cho phan do: cac phan khac cua trang chu van hien
 * binh thuong. Dung duoc ca trong o so lieu hep lan the rong.
 */
export function SectionLoadError({ message, onRetry }: SectionLoadErrorProps) {
  return (
    <View style={styles.container}>
      <View style={styles.message}>
        <Icon name="alert-circle-outline" size={ICON_SIZE} themeColor="danger" />
        <ThemedText type="small" themeColor="textSecondary" style={styles.text}>
          {message}
        </ThemedText>
      </View>
      <ActionChip
        label="Thử lại"
        variant="soft"
        trailingIcon="refresh"
        accessibilityLabel={`Thử lại: ${message}`}
        onPress={onRetry}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'flex-start', gap: Spacing.two },
  message: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.one },
  text: { flexShrink: 1 },
});
