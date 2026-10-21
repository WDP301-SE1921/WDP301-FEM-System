import { Pressable, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { ThemedText } from '@/components/ui/themed-text';
import { Spacing } from '@/constants/theme';
import { formatDate } from '@/utils/format';

import { BILL_STATUSES } from '../constants';
import type { TuitionBill } from '../types';
import { formatAmount, formatApiDate, formatPackageLabel } from '../utils';

import { SectionCard } from './section-card';
import { ToneBadge } from './tone-badge';

const LINK_ICON_SIZE = 16;

export type PendingRegistrationCardProps = {
  bill: TuitionBill;
  /** Mo bill cua don nay. */
  onPress: () => void;
};

/** Bill cua don nhan vien da lap nhung trung tam chua xac nhan thu hoc phi, nen chua co goi hoc. */
export function PendingRegistrationCard({ bill, onPress }: PendingRegistrationCardProps) {
  const { label, tone } = BILL_STATUSES.UNPAID;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Xem bill ${bill.class.name}`}
      onPress={onPress}
      style={({ pressed }) => [pressed && styles.pressed]}
    >
      <SectionCard
        title={bill.class.name}
        icon="hourglass-outline"
        tone={tone}
        highlightTone={tone}
        trailing={<ToneBadge label={label} tone={tone} />}
      >
        <ThemedText type="small" themeColor="textSecondary">
          Trung tâm đã lập đăng ký {formatPackageLabel(bill.term.packageMonths).toLowerCase()} ngày{' '}
          {formatDate(bill.issuedAt)}, dự kiến bắt đầu học {formatApiDate(bill.term.startDate)}. Gói
          học được kích hoạt sau khi trung tâm xác nhận đã thu đủ học phí.
        </ThemedText>
        <View style={styles.row}>
          <ThemedText type="small" themeColor="textSecondary">
            Học phí cần đóng
          </ThemedText>
          <ThemedText type="smallBold" style={styles.amount}>
            {formatAmount(bill.pricing.total, bill.pricing.currency)}
          </ThemedText>
        </View>
        <View style={styles.link}>
          <ThemedText type="smallBold" themeColor="primary">
            Xem bill
          </ThemedText>
          <Icon name="chevron-forward" size={LINK_ICON_SIZE} themeColor="primary" />
        </View>
      </SectionCard>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.75 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  amount: { fontVariant: ['tabular-nums'] },
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: Spacing.half,
  },
});
