import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ui/themed-text';
import { ThemedView } from '@/components/ui/themed-view';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatDate } from '@/utils/format';

import { PAYMENT_METHOD_LABEL, PAYMENT_STATUSES, TERM_STATUSES, TONES } from '../constants';
import type { TuitionEnrollment } from '../types';
import {
  countTermSessions,
  formatAmount,
  formatApiDate,
  formatPackageLabel,
  getCourseProgress,
  getTermStatus,
} from '../utils';

import { CourseProgress } from './course-progress';
import { ToneBadge } from './tone-badge';
import { TuitionDetailRow } from './tuition-detail-row';

const ACCENT_STRIP_HEIGHT = 6;

export type TuitionPackageCardProps = {
  enrollment: TuitionEnrollment;
};

/** Goi hoc con hieu luc cua con: lop, ky hoc, hoc phi da dong va tien do ky hoc theo lich co dinh. */
export function TuitionPackageCard({ enrollment }: TuitionPackageCardProps) {
  const theme = useTheme();
  const { class: classroom, registrationOrder, packageMonths } = enrollment;
  const { payment } = registrationOrder;
  const term = TERM_STATUSES[getTermStatus(enrollment)];
  const sessions = countTermSessions(enrollment);
  const progress = sessions
    ? getCourseProgress({ completedSessions: sessions.elapsed, totalSessions: sessions.total })
    : null;

  return (
    <ThemedView type="backgroundElement" style={[styles.card, { borderColor: theme.border }]}>
      <View style={[styles.accentStrip, { backgroundColor: theme[TONES[term.tone].color] }]} />

      <View style={styles.badges}>
        <ToneBadge label={term.label} tone={term.tone} />
        {classroom.weeklySchedules.length > 0 ? (
          <ToneBadge
            label={`${classroom.weeklySchedules.length} buổi / tuần`}
            tone="neutral"
            icon="book-outline"
          />
        ) : null}
        {payment ? <ToneBadge {...PAYMENT_STATUSES[payment.status]} /> : null}
      </View>

      <View style={styles.titleBlock}>
        <ThemedText type="default" accessibilityRole="header" style={styles.title}>
          {formatPackageLabel(packageMonths)} · {classroom.name}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {classroom.program.name}
        </ThemedText>
      </View>

      {payment ? (
        <ThemedView style={styles.amountBox}>
          <ThemedText type="small" themeColor="textSecondary">
            Học phí đã đóng
          </ThemedText>
          <ThemedText type="subtitle" style={styles.amount}>
            {formatAmount(payment.amount, payment.currency)}
          </ThemedText>
        </ThemedView>
      ) : null}

      {sessions && progress !== null ? (
        <CourseProgress
          label="Tiến độ theo lịch học"
          completedSessions={sessions.elapsed}
          totalSessions={sessions.total}
          percent={progress}
          tone={term.tone}
        />
      ) : null}

      <View style={styles.details}>
        <TuitionDetailRow
          icon="calendar-outline"
          label="Ngày bắt đầu"
          value={formatApiDate(enrollment.startDate)}
        />
        <TuitionDetailRow
          icon="flag-outline"
          label="Ngày hết hạn"
          value={formatApiDate(enrollment.endDate)}
        />
        {enrollment.activatedAt ? (
          <TuitionDetailRow
            icon="checkmark-done-outline"
            label="Ngày kích hoạt"
            value={formatDate(enrollment.activatedAt)}
          />
        ) : null}
        <TuitionDetailRow icon="cash-outline" label="Hình thức đóng" value={PAYMENT_METHOD_LABEL} />
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.three,
    paddingTop: Spacing.three + ACCENT_STRIP_HEIGHT,
    gap: Spacing.three,
    overflow: 'hidden',
  },
  accentStrip: { position: 'absolute', left: 0, right: 0, top: 0, height: ACCENT_STRIP_HEIGHT },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  titleBlock: { gap: Spacing.half },
  title: { fontWeight: 700 },
  amountBox: { gap: Spacing.half, padding: Spacing.three, borderRadius: Radius.control },
  amount: { fontWeight: 700, fontVariant: ['tabular-nums'] },
  details: { gap: Spacing.two },
});
