import { StyleSheet, View } from 'react-native';

import { ThemedView } from '@/components/ui/themed-view';
import { Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import type { TuitionReceipt } from '../types';

import { ReceiptBreakdown } from './receipt-breakdown';
import { ReceiptDivider } from './receipt-divider';
import { ReceiptHeading } from './receipt-heading';
import { ReceiptTotal } from './receipt-total';

const RIBBON_HEIGHT = 8;

export type ReceiptTicketProps = {
  receipt: TuitionReceipt;
};

/** To bien lai thu hoc phi: ba phan ngan cach bang duong xe nhu bien lai giay. */
export function ReceiptTicket({ receipt }: ReceiptTicketProps) {
  const theme = useTheme();

  return (
    <ThemedView type="backgroundElement" style={[styles.ticket, { borderColor: theme.border }]}>
      <View style={[styles.ribbon, { backgroundColor: theme.primary }]} />
      <ReceiptHeading payment={receipt.payment} />
      <ReceiptDivider />
      <ReceiptBreakdown receipt={receipt} />
      <ReceiptDivider />
      <ReceiptTotal payment={receipt.payment} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  // overflow an nua ngoai cua vet khuyet trong ReceiptDivider
  ticket: { borderWidth: 1, borderRadius: Radius.xl, overflow: 'hidden' },
  ribbon: { height: RIBBON_HEIGHT },
});
