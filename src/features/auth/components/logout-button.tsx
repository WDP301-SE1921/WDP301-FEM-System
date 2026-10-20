import { useState } from 'react';
import { StyleSheet } from 'react-native';

import { ConfirmSheet } from '@/components/common/confirm-sheet';
import { Button } from '@/components/ui/button';
import { Radius } from '@/constants/theme';

import { useLogout } from '../hooks/use-auth';

/**
 * Nut dang xuat o man Tai khoan, hoi lai truoc khi dang xuat: bam nham thi phu huynh phai nho lai mat
 * khau moi vao lai duoc, va con dung chung may de lo tay.
 */
export function LogoutButton() {
  const logout = useLogout();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  return (
    <>
      <Button
        title="Đăng xuất"
        variant="danger"
        icon="log-out-outline"
        accessibilityLabel="Đăng xuất"
        onPress={() => setIsConfirmOpen(true)}
        style={styles.pill}
      />
      <ConfirmSheet
        isVisible={isConfirmOpen}
        title="Đăng xuất khỏi ứng dụng?"
        message="Lần sau mở ứng dụng, bạn cần nhập lại email và mật khẩu để đăng nhập."
        confirmLabel="Đăng xuất"
        cancelLabel="Ở lại"
        tone="danger"
        isConfirming={logout.isPending}
        onConfirm={() => logout.mutate()}
        onCancel={() => setIsConfirmOpen(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  pill: { borderRadius: Radius.full },
});
