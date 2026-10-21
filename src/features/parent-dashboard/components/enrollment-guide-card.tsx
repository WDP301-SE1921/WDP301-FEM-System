import { ThemedText } from '@/components/ui/themed-text';

import { SectionCard } from './section-card';

export type EnrollmentGuideCardProps = {
  /** Ten goi cua con, vd `Minh Anh`. */
  childName: string;
  /** Email dang nhap cua phu huynh, nhan vien tra cuu tai khoan theo email nay. */
  parentEmail: string;
};

/**
 * Hien khi con chua co mon dang hoc: phu huynh khong tu dang ky tren app, phai den trung tam de nhan
 * vien tra cuu tai khoan theo email, dang ky mon/lop va xac nhan da thu hoc phi (SRS muc 6.1).
 */
export function EnrollmentGuideCard({ childName, parentEmail }: EnrollmentGuideCardProps) {
  return (
    <SectionCard
      title="Chưa có môn đang học"
      icon="school-outline"
      tone="accent"
      highlightTone="accent"
    >
      <ThemedText type="small" themeColor="textSecondary">
        Để đăng ký môn cho {childName}, đến trung tâm và đọc email{' '}
        <ThemedText type="smallBold" selectable>
          {parentEmail}
        </ThemedText>{' '}
        cho nhân viên. Môn học và lịch học hiện ở đây ngay sau khi trung tâm xác nhận đã thu học
        phí; kéo màn hình xuống để tải lại.
      </ThemedText>
    </SectionCard>
  );
}
