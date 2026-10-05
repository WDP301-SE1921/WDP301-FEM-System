import { StyleSheet, View } from 'react-native';

import { EmptyState } from '@/components/common/empty-state';
import { ErrorState } from '@/components/common/error-state';
import { LoadingState } from '@/components/common/loading-state';
import { ThemedText } from '@/components/ui/themed-text';
import { Spacing } from '@/constants/theme';
import { getShortName } from '@/utils/format';

import { useStudentRegistrations, useTuitionEnrollments } from '../hooks/use-parent-dashboard';
import type { LinkedStudent } from '../types';
import { getActivePackages, getPaymentHistory, getPendingRegistrations } from '../utils';

import { PaymentHistoryCard } from './payment-history-card';
import { PendingRegistrationCard } from './pending-registration-card';
import { ToneBadge } from './tone-badge';
import { TuitionPackageCard } from './tuition-package-card';
import { TuitionPolicyCard } from './tuition-policy-card';

export type StudentTuitionProps = {
  student: LinkedStudent;
  /** Mo bien lai cua don dang ky. */
  onOpenReceipt: (registrationId: string) => void;
};

/**
 * Hoc phi cua con: don dang cho trung tam xac nhan thu, cac goi hoc con hieu luc va lich su dong
 * hoc phi (bam de xem bien lai).
 */
export function StudentTuition({ student, onOpenReceipt }: StudentTuitionProps) {
  const enrollments = useTuitionEnrollments(student.id);
  const registrations = useStudentRegistrations(student.id);

  if (enrollments.isPending || registrations.isPending) return <LoadingState />;
  if (enrollments.isError) {
    return <ErrorState error={enrollments.error} onRetry={() => void enrollments.refetch()} />;
  }
  if (registrations.isError) {
    return <ErrorState error={registrations.error} onRetry={() => void registrations.refetch()} />;
  }

  const pendingRegistrations = getPendingRegistrations(registrations.data);
  if (enrollments.data.length === 0 && pendingRegistrations.length === 0) {
    return (
      <EmptyState
        title="Chưa có gói học nào"
        description={`Gói học và biên lai của ${getShortName(student.fullName)} sẽ hiện ở đây sau khi trung tâm xác nhận đã thu học phí.`}
      />
    );
  }

  const packages = getActivePackages(enrollments.data);
  const payments = getPaymentHistory(enrollments.data);

  return (
    <View style={styles.container}>
      {pendingRegistrations.map((registration) => (
        <PendingRegistrationCard key={registration.id} registration={registration} />
      ))}

      {packages.length > 0 ? (
        <View style={styles.section}>
          <ThemedText type="default" accessibilityRole="header" style={styles.sectionTitle}>
            Gói học đang áp dụng
          </ThemedText>
          {packages.map((enrollment) => (
            <TuitionPackageCard key={enrollment.id} enrollment={enrollment} />
          ))}
        </View>
      ) : null}

      {payments.length > 0 ? (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText type="default" accessibilityRole="header" style={styles.sectionTitle}>
              Lịch sử đóng học phí
            </ThemedText>
            <ToneBadge label={`${payments.length} lần đóng`} tone="neutral" />
          </View>
          {payments.map((enrollment) => (
            <PaymentHistoryCard
              key={enrollment.id}
              enrollment={enrollment}
              onPress={() => onOpenReceipt(enrollment.registrationOrderId)}
            />
          ))}
        </View>
      ) : null}

      <TuitionPolicyCard />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, gap: Spacing.four },
  section: { gap: Spacing.three },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  sectionTitle: { flexShrink: 1, fontWeight: 700 },
});
