import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { ThemedText } from '@/components/ui/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import type { User } from '@/types/auth';

import { useUpdateProfile } from '../hooks/use-account';

import { AccountIntro } from './account-intro';
import { AccountProfileForm } from './account-profile-form';

export type AccountProfileFlowProps = {
  /** Tai khoan cua phien dang nhap. */
  user: User;
  /** Roi man hinh: da luu, hoac phu huynh huy. */
  onDone: () => void;
};

/**
 * Phu huynh sua ten hien thi va so dien thoai lien he. Email dang nhap khong doi duoc. BE khong tra so
 * dien thoai dang luu, nen o so dien thoai de trong va chi gui khi nhap so moi.
 */
export function AccountProfileFlow({ user, onDone }: AccountProfileFlowProps) {
  const updateProfile = useUpdateProfile();

  return (
    <View style={styles.flow}>
      <AccountIntro icon="person-circle-outline" tone="primary" title="Thông tin tài khoản">
        Trung tâm dùng tên và số điện thoại này để liên hệ với bạn. Email đăng nhập{' '}
        <ThemedText type="smallBold" selectable>
          {user.email}
        </ThemedText>{' '}
        không đổi được.
      </AccountIntro>
      <AccountProfileForm
        defaultValues={{ displayName: user.displayName ?? '', phone: '' }}
        onSubmit={(values) => updateProfile.mutate(values, { onSuccess: onDone })}
        isPending={updateProfile.isPending}
        error={updateProfile.error}
      />
      <Button title="Huỷ" variant="ghost" onPress={onDone} style={styles.pill} />
    </View>
  );
}

const styles = StyleSheet.create({
  flow: { flex: 1, justifyContent: 'center', gap: Spacing.four },
  pill: { borderRadius: Radius.full },
});
