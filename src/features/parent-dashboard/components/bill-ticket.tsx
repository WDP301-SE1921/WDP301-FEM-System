import { StyleSheet, View } from 'react-native';

import { ThemedView } from '@/components/ui/themed-view';
import { Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import type { TuitionBillDetail } from '../types';

import { BillBreakdown } from './bill-breakdown';
import { BillHeading } from './bill-heading';
import { BillTotal } from './bill-total';
import { ReceiptDivider } from './receipt-divider';

const RIBBON_HEIGHT = 8;

export type BillTicketProps = {
  bill: TuitionBillDetail;
};

/** To bill hoc phi, cung dang voi to bien lai. Bill khong co QR (`PAYMENT_BILL_API.md` cua BE). */
export function BillTicket({ bill }: BillTicketProps) {
  const theme = useTheme();

  return (
    <ThemedView type="backgroundElement" style={[styles.ticket, { borderColor: theme.border }]}>
      <View style={[styles.ribbon, { backgroundColor: theme.primary }]} />
      <BillHeading bill={bill} />
      <ReceiptDivider />
      <BillBreakdown bill={bill} />
      <ReceiptDivider />
      <BillTotal bill={bill} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  // overflow an nua ngoai cua vet khuyet trong ReceiptDivider
  ticket: { borderWidth: 1, borderRadius: Radius.xl, overflow: 'hidden' },
  ribbon: { height: RIBBON_HEIGHT },
});
