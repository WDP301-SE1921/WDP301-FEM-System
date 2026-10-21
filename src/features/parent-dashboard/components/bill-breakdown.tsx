import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ui/themed-text';
import { ThemedView } from '@/components/ui/themed-view';
import { Radius, Spacing } from '@/constants/theme';

import type { TuitionBillDetail } from '../types';
import {
  formatAmount,
  formatApiDate,
  formatBillParent,
  formatPackageLabel,
  formatWeeklySlots,
} from '../utils';

import { ToneBadge } from './tone-badge';
import { TuitionDetailRow } from './tuition-detail-row';

export type BillBreakdownProps = {
  bill: TuitionBillDetail;
};

/**
 * Phan giua bill: hoc sinh, phu huynh va goi hoc (lop, ky hoc, lich, hoc phi thang). Cac thong tin
 * nay la ban chup luc nhan vien lap don, lop doi ten hay doi gia sau do thi bill khong doi.
 */
export function BillBreakdown({ bill }: BillBreakdownProps) {
  const { student, class: classroom, term, pricing } = bill;
  const slotLines = formatWeeklySlots(classroom.schedules);

  return (
    <View style={styles.container}>
      <ThemedText type="smallBold" themeColor="textSecondary">
        Thông tin học viên và gói học
      </ThemedText>

      <ThemedView style={styles.student}>
        <View style={styles.studentRow}>
          <View style={styles.studentInfo}>
            <ThemedText type="default" style={styles.studentName}>
              {student.fullName}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Khối {student.grade}
            </ThemedText>
          </View>
          <ToneBadge label={classroom.subject} tone="primary" />
        </View>
        <ThemedText type="small" themeColor="textSecondary">
          Phụ huynh: {formatBillParent(bill.parent)}
        </ThemedText>
      </ThemedView>

      <View style={styles.rows}>
        <TuitionDetailRow label="Lớp học" value={classroom.name} />
        <TuitionDetailRow label="Gói học" value={formatPackageLabel(term.packageMonths)} />
        {slotLines.length > 0 ? (
          <TuitionDetailRow label="Lịch học" value={slotLines.join('\n')} />
        ) : null}
        <TuitionDetailRow label="Ngày bắt đầu" value={formatApiDate(term.startDate)} />
        <TuitionDetailRow label="Ngày hết hạn" value={formatApiDate(term.endDate)} />
        <TuitionDetailRow
          label="Học phí mỗi tháng"
          value={formatAmount(pricing.monthlyFee, pricing.currency)}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.three, paddingHorizontal: Spacing.four, paddingVertical: Spacing.two },
  student: { gap: Spacing.two, padding: Spacing.three, borderRadius: Radius.lg },
  studentRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.two },
  studentInfo: { flex: 1 },
  studentName: { fontWeight: 700 },
  rows: { gap: Spacing.two },
});
