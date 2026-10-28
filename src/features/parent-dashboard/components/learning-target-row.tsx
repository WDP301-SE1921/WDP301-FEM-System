import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ui/themed-text';
import { Spacing } from '@/constants/theme';

import { ToneBadge } from './tone-badge';

export type LearningTargetRowProps = {
  /** Ma CLO, vd `MATH-6-01`. */
  code: string;
  title: string;
  /** Ghi chu duoi tieu de, vd muc tieu khong bat buoc. */
  note?: string;
};

/** Mot muc tieu (CLO): ma o ben trai, tieu de ben phai. */
export function LearningTargetRow({ code, title, note }: LearningTargetRowProps) {
  return (
    <View
      accessible
      accessibilityLabel={[`${code}: ${title}`, note].filter(Boolean).join('. ')}
      style={styles.row}
    >
      <ToneBadge label={code} tone="primary" />
      <View style={styles.text}>
        <ThemedText type="small">{title}</ThemedText>
        {note ? (
          <ThemedText type="small" themeColor="textSecondary">
            {note}
          </ThemedText>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.two },
  text: { flex: 1, gap: Spacing.half },
});
