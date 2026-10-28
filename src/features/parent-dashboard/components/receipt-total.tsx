import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ui/themed-text';
import { ThemedView } from '@/components/ui/themed-view';
import { Radius, Spacing } from '@/constants/theme';
import { formatCurrency, formatDate } from '@/utils/format';

import type { TuitionReceipt } from '../types';
import { formatAmountInWords } from '../utils';

import { ReceiptStamp } from './receipt-stamp';

const CONFIRMATION_TEXT_MIN_WIDTH = 120;

export type ReceiptTotalProps = {
  payment: TuitionReceipt['payment'];
};

/** Phan cuoi bien lai: tong so tien da thu (bang so va bang chu) va xac nhan cua trung tam. */
export function ReceiptTotal({ payment }: ReceiptTotalProps) {
  const amountInWords = formatAmountInWords(payment.amount);
  const confirmedDate = formatDate(payment.confirmedAt);

  return (
    <View style={styles.container}>
      <ThemedView type="primarySoft" style={styles.totalBox}>
        <View style={styles.totalRow}>
          <ThemedText type="smallBold">Tổng số tiền thu</ThemedText>
          <ThemedText type="heading" themeColor="primary" style={styles.amount}>
            {formatCurrency(payment.amount, payment.currency)}
          </ThemedText>
        </View>
        {amountInWords ? (
          <ThemedText type="small" themeColor="textSecondary" style={styles.amountInWords}>
            Bằng chữ: {amountInWords}.
          </ThemedText>
        ) : null}
      </ThemedView>

      <View style={styles.confirmation}>
        <View style={styles.confirmationText}>
          <ThemedText type="smallBold">Xác nhận của trung tâm</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Trung tâm đã thu đủ học phí của biên lai này.
          </ThemedText>
        </View>
        <ReceiptStamp date={confirmedDate} />
      </View>

      <ThemedText type="small" themeColor="textSecondary" style={styles.note}>
        Biên lai điện tử dùng để tra cứu. Biên lai gốc được lưu tại trung tâm.
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.four,
  },
  totalBox: { gap: Spacing.one, padding: Spacing.three, borderRadius: Radius.lg },
  totalRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  amount: { fontVariant: ['tabular-nums'] },
  amountInWords: { fontStyle: 'italic' },
  // Man hinh 320dp chi con khoang 95dp cho chu canh con dau: chua du CONFIRMATION_TEXT_MIN_WIDTH thi
  // con dau roi xuong hang duoi, can phai
  confirmation: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: Spacing.three,
  },
  confirmationText: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: CONFIRMATION_TEXT_MIN_WIDTH,
    gap: Spacing.half,
  },
  note: { textAlign: 'center' },
});
