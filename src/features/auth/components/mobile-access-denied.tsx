import { EmptyState } from '@/components/common/empty-state';

import { MOBILE_ACCESS_DENIED_MESSAGE } from '../constants';
import { useLogout } from '../hooks/use-auth';

/**
 * Thay man hinh chinh khi phien da luu la cua tai khoan khong dung app mobile (dang nhap tu truoc khi
 * app chan giao vien, nhan su trung tam). Dang xuat de quay ve man dang nhap.
 */
export function MobileAccessDenied() {
  const logout = useLogout();

  return (
    <EmptyState
      title="Tài khoản không dùng được trên ứng dụng"
      description={MOBILE_ACCESS_DENIED_MESSAGE}
      actionLabel="Đăng xuất"
      onAction={() => logout.mutate()}
    />
  );
}
