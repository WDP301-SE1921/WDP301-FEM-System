import { StyleSheet, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { ThemedText } from '@/components/ui/themed-text';
import { Spacing } from '@/constants/theme';

/** Dong chu `small` cao 20: icon 16 kem `marginTop` `Spacing.half` nam giua dong dau. */
const ICON_SIZE = 16;

export type LearningTargetRowProps = {
  title: string;
  /** Ghi chu duoi tieu de, vd muc tieu khong bat buoc. */
  note?: string;
};

/**
 * Mot muc tieu (CLO): chi hien ten muc tieu. Khong hien ma CLO (vd `MATH-6-01`): ma ky thuat, khong
 * co nghia voi phu huynh va hoc sinh.
 */
export function LearningTargetRow({ title, note }: LearningTargetRowProps) {
  return (
    <View
      accessible
      accessibilityLabel={[title, note].filter(Boolean).join('. ')}
      style={styles.row}
    >
      <Icon name="flag-outline" size={ICON_SIZE} themeColor="primary" style={styles.icon} />
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
  icon: { marginTop: Spacing.half },
  text: { flex: 1, gap: Spacing.half },
});
