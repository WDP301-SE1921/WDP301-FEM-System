import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ui/themed-text';
import { ThemedView } from '@/components/ui/themed-view';
import { Images } from '@/constants/images';
import { Radius, Spacing } from '@/constants/theme';
import { formatDate, formatTime } from '@/utils/format';

import { CENTER_NAME, PAYMENT_METHOD_LABEL, RECEIPT_PAID_STATUS } from '../constants';
import type { TuitionReceipt } from '../types';

import { ToneBadge } from './tone-badge';
import { TuitionDetailRow } from './tuition-detail-row';

const LOGO_SIZE = 56;

export type ReceiptHeadingProps = {
  payment: TuitionReceipt['payment'];
};

/** Phan dau bien lai: logo va ten trung tam, trang thai, ma bien lai, thoi gian va hinh thuc thu. */
export function ReceiptHeading({ payment }: ReceiptHeadingProps) {
  return (
    <View style={styles.container}>
      <Image
        source={Images.logo}
        style={styles.logo}
        contentFit="cover"
        accessibilityLabel="Logo EduGrade"
      />
      <ThemedText type="small" themeColor="textSecondary" style={styles.centerName}>
        {CENTER_NAME}
      </ThemedText>
      <ThemedText type="heading" accessibilityRole="header" style={styles.title}>
        Biên lai thu học phí
      </ThemedText>
      <ToneBadge {...RECEIPT_PAID_STATUS} />

      <ThemedView style={styles.meta}>
        <TuitionDetailRow label="Mã biên lai" value={`#${payment.receiptNumber}`} />
        <TuitionDetailRow
          label="Thời gian thu"
          value={`${formatDate(payment.confirmedAt)} · ${formatTime(payment.confirmedAt)}`}
        />
        <TuitionDetailRow label="Hình thức" value={PAYMENT_METHOD_LABEL} />
      </ThemedView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.two,
  },
  logo: { width: LOGO_SIZE, height: LOGO_SIZE, borderRadius: Radius.full },
  centerName: { textAlign: 'center', textTransform: 'uppercase' },
  title: { textAlign: 'center' },
  meta: {
    alignSelf: 'stretch',
    gap: Spacing.two,
    marginTop: Spacing.two,
    padding: Spacing.three,
    borderRadius: Radius.lg,
  },
});
