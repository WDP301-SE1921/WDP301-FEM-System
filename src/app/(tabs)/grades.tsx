import { EmptyState } from '@/components/common/empty-state';
import { Screen } from '@/components/common/screen';

// Chua co thiet ke va endpoint diem, bai tap: nut "Xem bài", "Chuẩn bị bài" o trang chu dan ve day
export default function GradesScreen() {
  return (
    <Screen>
      <EmptyState title="Điểm & Bài tập" description="Tính năng đang được phát triển." />
    </Screen>
  );
}
