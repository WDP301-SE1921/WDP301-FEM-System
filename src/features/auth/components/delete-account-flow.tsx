import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ConfirmSheet } from '@/components/common/confirm-sheet';
import { Button } from '@/components/ui/button';
import { Icon, type IconName } from '@/components/ui/icon';
import { ThemedText } from '@/components/ui/themed-text';
import { ThemedView } from '@/components/ui/themed-view';
import { Radius, Spacing } from '@/constants/theme';

import { useDeleteAccount } from '../hooks/use-account';
import type { DeleteAccountInput } from '../schemas';

import { AccountIntro } from './account-intro';
import { DeleteAccountForm } from './delete-account-form';

const FACT_ICON_SIZE = 18;

/** Dung voi nhung gi BE lam khi phu huynh xoa tai khoan (`DELETE /auth/me`). */
const FACTS: readonly { icon: IconName; text: string }[] = [
  {
    icon: 'person-remove-outline',
    text: 'Họ tên, số điện thoại, ảnh đại diện và mật khẩu của bạn bị xóa. Bạn không đăng nhập lại được bằng tài khoản này.',
  },
  {
    icon: 'phone-portrait-outline',
    text: 'Mọi thiết bị đang đăng nhập tài khoản này đều bị đăng xuất.',
  },
  {
    icon: 'school-outline',
    text: 'Hồ sơ học tập, điểm và học phí của con vẫn được trung tâm lưu giữ. Con đang học vẫn tiếp tục học bình thường.',
  },
  {
    icon: 'mail-outline',
    text: 'Bạn có thể dùng lại email này để tạo tài khoản mới, nhưng hồ sơ con cũ không tự chuyển sang.',
  },
];

export type DeleteAccountFlowProps = {
  /** Phu huynh huy, quay lai man truoc. Xoa xong thi hook tu dang xuat va ve man chao. */
  onCancel: () => void;
};

/** Xoa tai khoan phu huynh: noi ro hau qua, nhap mat khau, hoi lai lan cuoi roi moi xoa. */
export function DeleteAccountFlow({ onCancel }: DeleteAccountFlowProps) {
  const deleteAccount = useDeleteAccount();
  const [pendingInput, setPendingInput] = useState<DeleteAccountInput | null>(null);

  const confirm = () => {
    if (!pendingInput) return;
    // Sai mat khau thi dong sheet de phu huynh thay loi duoi o mat khau
    deleteAccount.mutate(pendingInput, { onError: () => setPendingInput(null) });
  };

  return (
    <View style={styles.flow}>
      <AccountIntro icon="trash-outline" tone="danger" title="Xóa tài khoản">
        Thao tác này không thể hoàn tác. Hãy đọc kỹ trước khi xóa.
      </AccountIntro>

      <ThemedView type="backgroundElement" style={styles.facts}>
        {FACTS.map((fact) => (
          <View key={fact.icon} style={styles.fact}>
            <Icon name={fact.icon} size={FACT_ICON_SIZE} themeColor="textSecondary" />
            <ThemedText type="small" style={styles.factText}>
              {fact.text}
            </ThemedText>
          </View>
        ))}
      </ThemedView>

      <DeleteAccountForm
        onSubmit={setPendingInput}
        isPending={deleteAccount.isPending}
        error={deleteAccount.error}
      />
      <Button title="Giữ tài khoản" variant="ghost" onPress={onCancel} style={styles.pill} />

      <ConfirmSheet
        isVisible={pendingInput !== null}
        title="Xóa vĩnh viễn tài khoản?"
        message="Sau khi xóa, tài khoản không khôi phục được và bạn sẽ bị đăng xuất."
        confirmLabel="Xóa vĩnh viễn"
        cancelLabel="Giữ tài khoản"
        tone="danger"
        isConfirming={deleteAccount.isPending}
        onConfirm={confirm}
        onCancel={() => setPendingInput(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flow: { flex: 1, justifyContent: 'center', gap: Spacing.four },
  facts: { gap: Spacing.three, padding: Spacing.three, borderRadius: Radius.lg },
  fact: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.two },
  factText: { flex: 1 },
  pill: { borderRadius: Radius.full },
});
