import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ui/themed-text';
import { ThemedView } from '@/components/ui/themed-view';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const STEP_NUMBER_SIZE = 28;

export type EnrollmentStepsProps = {
  childName: string;
  /** Khoi cua con: trung tam chi xep lop dung khoi ghi trong ho so. */
  grade: number;
  /** Email dang nhap cua phu huynh, nhan vien tra cuu tai khoan theo email nay. */
  parentEmail: string;
};

/**
 * Cac buoc de con co mon hoc sau khi tao ho so (SRS muc 6.1): phu huynh den trung tam, nhan vien tra
 * cuu tai khoan theo email, chon ho so con, dang ky mon/lop va xac nhan da thu hoc phi.
 */
export function EnrollmentSteps({ childName, grade, parentEmail }: EnrollmentStepsProps) {
  const theme = useTheme();
  const steps: { key: string; content: ReactNode }[] = [
    {
      key: 'email',
      content: (
        <>
          Đến trung tâm và đọc email{' '}
          <ThemedText type="smallBold" selectable>
            {parentEmail}
          </ThemedText>{' '}
          cho nhân viên.
        </>
      ),
    },
    {
      key: 'class',
      content: `Nhân viên chọn hồ sơ của ${childName}, rồi chọn môn và lớp dành cho khối ${grade}.`,
    },
    {
      key: 'payment',
      content:
        'Đóng học phí tại quầy. Môn học và lịch học hiện trên ứng dụng ngay sau khi trung tâm xác nhận.',
    },
  ];

  return (
    <ThemedView type="backgroundElement" style={[styles.card, { borderColor: theme.border }]}>
      <ThemedText type="default" accessibilityRole="header" style={styles.title}>
        Bước tiếp theo: đăng ký môn học
      </ThemedText>
      {steps.map(({ key, content }, index) => (
        <View key={key} style={styles.step}>
          <ThemedView type="primarySoft" style={styles.number}>
            <ThemedText type="smallBold" themeColor="primaryStrong">
              {index + 1}
            </ThemedText>
          </ThemedView>
          <ThemedText type="small" themeColor="textSecondary" style={styles.stepText}>
            {content}
          </ThemedText>
        </View>
      ))}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: { gap: Spacing.three, padding: Spacing.three, borderWidth: 1, borderRadius: Radius.lg },
  title: { fontWeight: 700 },
  step: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.two },
  number: {
    width: STEP_NUMBER_SIZE,
    height: STEP_NUMBER_SIZE,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: { flex: 1 },
});
