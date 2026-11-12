import { StyleSheet } from 'react-native';

import { StepList, type StepItem } from '@/components/common/step-list';
import { ThemedText } from '@/components/ui/themed-text';
import { ThemedView } from '@/components/ui/themed-view';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type EnrollmentStepsProps = {
  childName: string;
  /** Khoi cua con: trung tam chi xep lop dung khoi ghi trong ho so. */
  grade: number;
  /** Email dang nhap cua phu huynh, nhan vien tra cuu tai khoan theo email nay. */
  parentEmail: string;
};

/**
 * Cac buoc de con co mon hoc sau khi tao ho so (SRS muc 6.1), cung bon buoc voi the "Dang ky hoc" o
 * trang chu: tao ho so (vua xong) -> dang ky tai trung tam -> dong hoc phi -> lich hoc.
 */
export function EnrollmentSteps({ childName, grade, parentEmail }: EnrollmentStepsProps) {
  const theme = useTheme();
  const steps: StepItem[] = [
    {
      key: 'profile',
      title: 'Tạo hồ sơ học sinh',
      state: 'done',
      description: `Đã tạo hồ sơ của ${childName}.`,
    },
    {
      key: 'register',
      title: 'Đăng ký môn tại trung tâm',
      state: 'current',
      description: (
        <>
          Đến trung tâm và đọc email{' '}
          <ThemedText type="smallBold" selectable>
            {parentEmail}
          </ThemedText>{' '}
          cho nhân viên. Nhân viên chọn hồ sơ của {childName} và lớp dành cho khối {grade}.
        </>
      ),
    },
    {
      key: 'payment',
      title: 'Đóng học phí',
      state: 'todo',
      description: 'Đóng tại quầy. Trung tâm xác nhận xong là có biên lai trên ứng dụng.',
    },
    {
      key: 'schedule',
      title: 'Lịch học',
      state: 'todo',
      description: 'Môn học và lịch học hiện trên ứng dụng khi trung tâm xếp buổi.',
    },
  ];

  return (
    <ThemedView type="backgroundElement" style={[styles.card, { borderColor: theme.border }]}>
      <ThemedText type="default" accessibilityRole="header" style={styles.title}>
        Bước tiếp theo: đăng ký môn học
      </ThemedText>
      <StepList steps={steps} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: { gap: Spacing.three, padding: Spacing.three, borderWidth: 1, borderRadius: Radius.lg },
  title: { fontWeight: 700 },
});
