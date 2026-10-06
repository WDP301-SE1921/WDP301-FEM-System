import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ui/themed-text';
import { ThemedView } from '@/components/ui/themed-view';
import { Images } from '@/constants/images';
import { Radius, Spacing } from '@/constants/theme';
import { formatDate, formatTime } from '@/utils/format';

import { BILL_STATUSES, CENTER_NAME } from '../constants';
import type { TuitionBillDetail } from '../types';

import { ToneBadge } from './tone-badge';
import { TuitionDetailRow } from './tuition-detail-row';

const LOGO_SIZE = 56;

export type BillHeadingProps = {
  bill: Pick<TuitionBillDetail, 'billNumber' | 'status' | 'issuedAt'>;
};

/** Phan dau bill: logo va ten trung tam, trang thai thanh toan, ma bill va luc nhan vien lap don. */
export function BillHeading({ bill }: BillHeadingProps) {
  const { label, tone, icon } = BILL_STATUSES[bill.status];

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
        Bill học phí
      </ThemedText>
      <ToneBadge label={label} tone={tone} icon={icon} />

      <ThemedView style={styles.meta}>
        <TuitionDetailRow label="Mã bill" value={bill.billNumber} />
        <TuitionDetailRow
          label="Ngày lập"
          value={`${formatDate(bill.issuedAt)} · ${formatTime(bill.issuedAt)}`}
        />
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
