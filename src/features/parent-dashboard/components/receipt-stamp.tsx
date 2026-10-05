import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ui/themed-text';
import { Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const STAMP_SIZE = 112;
/** Khoang ho giua hai vong tron cua con dau. */
const RING_GAP = 4;
const OUTER_RING_WIDTH = 2;
const STAMP_ROTATION = '-12deg';
const STAMP_OPACITY = 0.85;

export type ReceiptStampProps = {
  /** Ngay trung tam xac nhan da thu tien, da dinh dang san. */
  date: string;
};

/** Con dau tron "Đã thu tiền" tren bien lai, thay cho chu ky va dau cua bien lai giay. */
export function ReceiptStamp({ date }: ReceiptStampProps) {
  const theme = useTheme();

  return (
    <View
      accessible
      accessibilityLabel={`Đã thu tiền ngày ${date}`}
      style={[styles.outerRing, { borderColor: theme.danger }]}
    >
      <View style={[styles.innerRing, { borderColor: theme.danger }]}>
        <ThemedText type="smallBold" themeColor="danger" style={styles.text}>
          ĐÃ THU TIỀN
        </ThemedText>
        <ThemedText type="small" themeColor="danger" style={styles.text}>
          {date}
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerRing: {
    width: STAMP_SIZE,
    height: STAMP_SIZE,
    padding: RING_GAP,
    borderWidth: OUTER_RING_WIDTH,
    borderRadius: Radius.full,
    opacity: STAMP_OPACITY,
    transform: [{ rotate: STAMP_ROTATION }],
  },
  innerRing: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: Radius.full,
  },
  text: { textAlign: 'center', fontVariant: ['tabular-nums'] },
});
