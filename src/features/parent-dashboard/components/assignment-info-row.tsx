import { StyleSheet } from 'react-native';

import { Icon, type IconName } from '@/components/ui/icon';
import { ThemedText } from '@/components/ui/themed-text';
import { ThemedView } from '@/components/ui/themed-view';
import { Radius, Spacing } from '@/constants/theme';

const ICON_SIZE = 16;

export type AssignmentInfoRowProps = {
  icon: IconName;
  text: string;
  /** Chu dam o ben phai, vd `15 câu hỏi`. */
  trailing?: string;
};

/** Khoi thong tin trong the bai tap: han nop hoac gio nop, kem mot thong tin phu ben phai. */
export function AssignmentInfoRow({ icon, text, trailing }: AssignmentInfoRowProps) {
  return (
    <ThemedView type="background" style={styles.row}>
      <Icon name={icon} size={ICON_SIZE} themeColor="primary" />
      <ThemedText type="small" style={styles.text}>
        {text}
      </ThemedText>
      {trailing ? (
        <ThemedText type="smallBold" themeColor="primary">
          {trailing}
        </ThemedText>
      ) : null}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.two,
    borderRadius: Radius.control,
  },
  text: { flex: 1 },
});
