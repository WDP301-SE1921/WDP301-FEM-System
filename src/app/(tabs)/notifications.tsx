import { EmptyState } from '@/components/common/empty-state';
import { Screen } from '@/components/common/screen';

// Chua co thiet ke va endpoint danh sach thong bao: nut chuong va "Xem tất cả" dan ve day
export default function NotificationsScreen() {
  return (
    <Screen>
      <EmptyState title="Thông báo" description="Tính năng đang được phát triển." />
    </Screen>
  );
}
