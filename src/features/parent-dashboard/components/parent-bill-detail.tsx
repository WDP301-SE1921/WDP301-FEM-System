import { StyleSheet, View } from 'react-native';

import { ErrorState } from '@/components/common/error-state';
import { LoadingState } from '@/components/common/loading-state';
import { Button } from '@/components/ui/button';
import { Radius, Spacing } from '@/constants/theme';

import { useBill } from '../hooks/use-parent-dashboard';

import { BillTicket } from './bill-ticket';
import { DetailHeader } from './detail-header';

export type ParentBillDetailProps = {
  /** Id don dang ky: BE tra bill theo don. */
  registrationId: string;
  onBack: () => void;
  /** Mo bien lai khi bill da thanh toan. */
  onOpenReceipt: (registrationId: string) => void;
};

/** Bill hoc phi cua mot don dang ky. Phu huynh xem de dong hoc phi tai trung tam, khong tra tren app. */
export function ParentBillDetail({ registrationId, onBack, onOpenReceipt }: ParentBillDetailProps) {
  const bill = useBill(registrationId);

  const renderBody = () => {
    if (bill.isPending) return <LoadingState />;
    if (bill.isError) {
      return <ErrorState error={bill.error} onRetry={() => void bill.refetch()} />;
    }
    return (
      <>
        <BillTicket bill={bill.data} />
        {bill.data.status === 'PAID' ? (
          <Button
            title="Xem biên lai"
            // Ten truy cap mac dinh ghep ca ky tu cua icon voi chu tren nut
            accessibilityLabel="Xem biên lai"
            icon="receipt-outline"
            onPress={() => onOpenReceipt(bill.data.registrationId)}
            style={styles.button}
          />
        ) : null}
      </>
    );
  };

  return (
    <View style={styles.container}>
      <DetailHeader title="Chi tiết bill học phí" onBack={onBack} />
      {renderBody()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, gap: Spacing.three },
  button: { borderRadius: Radius.full },
});
