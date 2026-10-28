import { StyleSheet, View } from 'react-native';

import { Icon, type IconName } from '@/components/ui/icon';
import { ThemedText } from '@/components/ui/themed-text';
import { Spacing } from '@/constants/theme';

const ICON_SIZE = 16;

export type TuitionDetailRowProps = {
  label: string;
  /** Xuong dong bang `\n` khi co nhieu gia tri, vd nhieu khung gio hoc. */
  value: string;
  /** Icon dat truoc nhan. */
  icon?: IconName;
};

/** Mot dong nhan ben trai, gia tri ben phai cua the goi hoc va bien lai. */
export function TuitionDetailRow({ label, value, icon }: TuitionDetailRowProps) {
  return (
    <View style={styles.row}>
      <View style={styles.label}>
        {icon ? <Icon name={icon} size={ICON_SIZE} themeColor="textSecondary" /> : null}
        <ThemedText type="small" themeColor="textSecondary" style={styles.labelText}>
          {label}
        </ThemedText>
      </View>
      <ThemedText type="smallBold" style={styles.value}>
        {value}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  // Nhan giu be ngang tu nhien; chi khi chu he thong phong to lam nhan dai hon ca hang moi co lai
  label: { flexShrink: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  labelText: { flexShrink: 1 },
  value: { flex: 1, textAlign: 'right', fontVariant: ['tabular-nums'] },
});
