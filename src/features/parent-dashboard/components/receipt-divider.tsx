import { StyleSheet, View } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const NOTCH_SIZE = 24;
const DASH_COUNT = 24;
const DASH_HEIGHT = 2;
const DASHES = Array.from({ length: DASH_COUNT }, (_, index) => index);

/**
 * Duong xe cua bien lai: net dut va hai vet khuyet tron o hai mep. Vet khuyet lay mau nen man hinh
 * va tran mot nua ra ngoai, nen the bien lai phai dat `overflow: 'hidden'`.
 */
export function ReceiptDivider() {
  const theme = useTheme();
  const notchColors = { backgroundColor: theme.background, borderColor: theme.border };

  return (
    <View style={styles.container}>
      <View style={[styles.notch, styles.leftNotch, notchColors]} />
      {/* Ve tung net de khong phu thuoc cach moi nen tang ve `borderStyle: 'dashed'` */}
      <View style={styles.dashes}>
        {DASHES.map((dash) => (
          <View key={dash} style={[styles.dash, { backgroundColor: theme.border }]} />
        ))}
      </View>
      <View style={[styles.notch, styles.rightNotch, notchColors]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { height: NOTCH_SIZE, justifyContent: 'center' },
  notch: {
    position: 'absolute',
    width: NOTCH_SIZE,
    height: NOTCH_SIZE,
    borderWidth: 1,
    borderRadius: Radius.full,
  },
  leftNotch: { left: -NOTCH_SIZE / 2 },
  rightNotch: { right: -NOTCH_SIZE / 2 },
  dashes: { flexDirection: 'row', gap: Spacing.one, marginHorizontal: Spacing.four },
  dash: { flex: 1, height: DASH_HEIGHT, borderRadius: Radius.full },
});
