import { Pressable, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { ThemedText } from '@/components/ui/themed-text';
import { ThemedView } from '@/components/ui/themed-view';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatDate } from '@/utils/format';

import { PAYMENT_STATUSES, TONES } from '../constants';
import type { PaidEnrollment } from '../types';
import { formatAmount, formatPackageLabel, formatTermPeriod } from '../utils';

import { ToneBadge } from './tone-badge';

const DOT_SIZE = 8;
const LINK_ICON_SIZE = 16;

export type PaymentHistoryCardProps = {
  enrollment: PaidEnrollment;
  /** Mo bien lai cua lan dong nay. */
  onPress: () => void;
};

/** Mot lan dong hoc phi da duoc xac nhan: ky hoc, lop, ma phieu thu va so tien. Bam de xem bien lai. */
export function PaymentHistoryCard({ enrollment, onPress }: PaymentHistoryCardProps) {
  const theme = useTheme();
  const { payment } = enrollment.registrationOrder;
  const status = PAYMENT_STATUSES[payment.status];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Xem biên lai ${payment.receiptNumber}`}
      onPress={onPress}
      style={({ pressed }) => [pressed && styles.pressed]}
    >
      <ThemedView type="backgroundElement" style={[styles.card, { borderColor: theme.border }]}>
        <View style={styles.header}>
          <View style={styles.titleBlock}>
            <View style={styles.meta}>
              <View style={[styles.dot, { backgroundColor: theme[TONES[status.tone].color] }]} />
              <ThemedText
                type="small"
                themeColor="textSecondary"
                style={[styles.figures, styles.metaText]}
              >
                {formatTermPeriod(enrollment.startDate)} · {formatDate(payment.confirmedAt)}
              </ThemedText>
            </View>
            <ThemedText type="default" style={styles.title}>
              {enrollment.class.name}
            </ThemedText>
          </View>
          <ToneBadge {...status} />
        </View>

        <ThemedView style={styles.summary}>
          <View style={styles.summaryItem}>
            <ThemedText type="small" themeColor="textSecondary">
              Mã phiếu thu
            </ThemedText>
            <ThemedText type="smallBold" numberOfLines={1}>
              #{payment.receiptNumber}
            </ThemedText>
          </View>
          <View style={styles.amount}>
            <ThemedText type="small" themeColor="textSecondary">
              Số tiền đã nộp
            </ThemedText>
            <ThemedText type="default" style={[styles.title, styles.figures]}>
              {formatAmount(payment.amount, payment.currency)}
            </ThemedText>
          </View>
        </ThemedView>

        <View style={styles.footer}>
          <ThemedText type="small" themeColor="textSecondary" style={styles.footerText}>
            {formatPackageLabel(enrollment.packageMonths)}
          </ThemedText>
          <View style={styles.link}>
            <ThemedText type="smallBold" themeColor="primary">
              Xem biên lai
            </ThemedText>
            <Icon name="chevron-forward" size={LINK_ICON_SIZE} themeColor="primary" />
          </View>
        </View>
      </ThemedView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.75 },
  card: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.two },
  titleBlock: { flex: 1, gap: Spacing.one },
  meta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  // Man hinh 360dp: ky hoc va ngay thu dai hon cho con lai canh nhan trang thai
  metaText: { flexShrink: 1 },
  dot: { width: DOT_SIZE, height: DOT_SIZE, borderRadius: Radius.full },
  title: { fontWeight: 700 },
  figures: { fontVariant: ['tabular-nums'] },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.control,
  },
  summaryItem: { flex: 1 },
  amount: { alignItems: 'flex-end' },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  footerText: { flexShrink: 1 },
  link: { flexDirection: 'row', alignItems: 'center', gap: Spacing.half },
});
