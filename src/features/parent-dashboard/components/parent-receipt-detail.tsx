import { StyleSheet, View } from 'react-native';

import { ErrorState } from '@/components/common/error-state';
import { LoadingState } from '@/components/common/loading-state';
import { Spacing } from '@/constants/theme';

import { useReceipt } from '../hooks/use-parent-dashboard';

import { DetailHeader } from './detail-header';
import { ReceiptActions } from './receipt-actions';
import { ReceiptTicket } from './receipt-ticket';

export type ParentReceiptDetailProps = {
  /** Id don dang ky cua bien lai, lay tu ghi danh trong lich su dong hoc phi. */
  registrationId: string;
  onBack: () => void;
};

/** Bien lai thu hoc phi cua mot don dang ky da duoc trung tam xac nhan, kem nut chia se. */
export function ParentReceiptDetail({ registrationId, onBack }: ParentReceiptDetailProps) {
  const receipt = useReceipt(registrationId);

  const renderBody = () => {
    if (receipt.isPending) return <LoadingState />;
    if (receipt.isError) {
      return <ErrorState error={receipt.error} onRetry={() => void receipt.refetch()} />;
    }
    return (
      <>
        <ReceiptTicket receipt={receipt.data} />
        <ReceiptActions receipt={receipt.data} />
      </>
    );
  };

  return (
    <View style={styles.container}>
      <DetailHeader title="Chi tiết biên lai" onBack={onBack} />
      {renderBody()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, gap: Spacing.three },
});
