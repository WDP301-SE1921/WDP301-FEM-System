import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ui/themed-text';
import { ThemedView } from '@/components/ui/themed-view';
import { Radius, Spacing } from '@/constants/theme';
import { formatDate, formatTime } from '@/utils/format';

import { BILL_STATUSES } from '../constants';
import type { TuitionBillDetail } from '../types';
import { formatAmount, formatAmountInWords, parseAmount } from '../utils';

import { TuitionDetailRow } from './tuition-detail-row';

export type BillTotalProps = {
  bill: Pick<TuitionBillDetail, 'status' | 'pricing' | 'payment'>;
};

/**
 * Phan cuoi bill: tong hoc phi (bang so va bang chu), thong tin thu tien khi trung tam da xac nhan,
 * va loi nhan theo trang thai bill.
 */
export function BillTotal({ bill }: BillTotalProps) {
  const { pricing, payment } = bill;
  const { totalLabel, note } = BILL_STATUSES[bill.status];
  const total = parseAmount(pricing.total);
  const amountInWords = total === null ? null : formatAmountInWords(total);

  return (
    <View style={styles.container}>
      <ThemedView type="primarySoft" style={styles.totalBox}>
        <View style={styles.totalRow}>
          <ThemedText type="smallBold">{totalLabel}</ThemedText>
          <ThemedText type="heading" themeColor="primary" style={styles.amount}>
            {formatAmount(pricing.total, pricing.currency)}
          </ThemedText>
        </View>
        {amountInWords ? (
          <ThemedText type="small" themeColor="textSecondary" style={styles.amountInWords}>
            Bằng chữ: {amountInWords}.
          </ThemedText>
        ) : null}
      </ThemedView>

      {/* Bill co `payment` chi khi `PAID`; don da huy khong duoc hien nhu da thanh toan */}
      {bill.status === 'PAID' && payment ? (
        <ThemedView style={styles.payment}>
          <TuitionDetailRow label="Mã biên lai" value={`#${payment.receiptNumber}`} />
          <TuitionDetailRow
            label="Số tiền đã thu"
            value={formatAmount(payment.paidAmount, pricing.currency)}
          />
          <TuitionDetailRow
            label="Thời gian thu"
            value={`${formatDate(payment.confirmedAt)} · ${formatTime(payment.confirmedAt)}`}
          />
        </ThemedView>
      ) : null}

      <ThemedText type="small" themeColor="textSecondary" style={styles.note}>
        {note}
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
  payment: { gap: Spacing.two, padding: Spacing.three, borderRadius: Radius.lg },
  note: { textAlign: 'center' },
});
