import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ui/themed-text';
import { Spacing } from '@/constants/theme';
import { formatDate } from '@/utils/format';

import { PENDING_REGISTRATION_STATUS } from '../constants';
import type { StudentRegistration } from '../types';
import { formatAmount, formatApiDate, formatPackageLabel } from '../utils';

import { SectionCard } from './section-card';
import { ToneBadge } from './tone-badge';

export type PendingRegistrationCardProps = {
  registration: StudentRegistration;
};

/** Don dang ky nhan vien da lap nhung trung tam chua xac nhan thu hoc phi, nen chua co goi hoc. */
export function PendingRegistrationCard({ registration }: PendingRegistrationCardProps) {
  const { label, tone } = PENDING_REGISTRATION_STATUS;

  return (
    <SectionCard
      title={registration.class.name}
      icon="hourglass-outline"
      tone={tone}
      highlightTone={tone}
      trailing={<ToneBadge label={label} tone={tone} />}
    >
      <ThemedText type="small" themeColor="textSecondary">
        Trung tâm đã lập đăng ký {formatPackageLabel(registration.packageMonths).toLowerCase()} ngày{' '}
        {formatDate(registration.createdAt)}, dự kiến bắt đầu học{' '}
        {formatApiDate(registration.startDate)}. Gói học được kích hoạt sau khi trung tâm xác nhận
        đã thu đủ học phí.
      </ThemedText>
      <View style={styles.amountRow}>
        <ThemedText type="small" themeColor="textSecondary">
          Học phí cần đóng
        </ThemedText>
        <ThemedText type="smallBold" style={styles.amount}>
          {formatAmount(registration.quotedAmount, registration.currency)}
        </ThemedText>
      </View>
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  amount: { fontVariant: ['tabular-nums'] },
});
