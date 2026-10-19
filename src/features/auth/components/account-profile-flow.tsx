import { StyleSheet, View } from 'react-native';

import { ErrorState } from '@/components/common/error-state';
import { LoadingState } from '@/components/common/loading-state';
import { Button } from '@/components/ui/button';
import { ThemedText } from '@/components/ui/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import type { User } from '@/types/auth';

import { useUpdateProfile } from '../hooks/use-account';
import { useRefreshedUser } from '../hooks/use-email-verification';

import { AccountIntro } from './account-intro';
import { AccountProfileForm } from './account-profile-form';

export type AccountProfileFlowProps = {
  /** Tai khoan cua phien dang nhap. */
  user: User;
  /** Roi man hinh: da luu, hoac phu huynh huy. */
  onDone: () => void;
};

/**
 * Phu huynh sua ten hien thi va so dien thoai lien he. Email dang nhap khong doi duoc. Form dien san
 * tu GET /auth/me: phien luu tu lan dang nhap truoc co the chua co so dien thoai (BE truoc day khong
 * tra), ma de trong o so dien thoai la xoa so dang luu.
 */
export function AccountProfileFlow({ user, onDone }: AccountProfileFlowProps) {
  const account = useRefreshedUser();
  const updateProfile = useUpdateProfile();

  const renderForm = () => {
    if (account.isPending) return <LoadingState />;
    if (account.isError) {
      return <ErrorState error={account.error} onRetry={() => void account.refetch()} />;
    }
    return (
      <AccountProfileForm
        defaultValues={{
          displayName: account.data.displayName ?? '',
          phone: account.data.phone ?? '',
        }}
        onSubmit={(values) => updateProfile.mutate(values, { onSuccess: onDone })}
        isPending={updateProfile.isPending}
        error={updateProfile.error}
      />
    );
  };

  return (
    <View style={styles.flow}>
      <AccountIntro icon="person-circle-outline" tone="primary" title="Thông tin tài khoản">
        Trung tâm dùng tên và số điện thoại này để liên hệ với bạn. Email đăng nhập{' '}
        <ThemedText type="smallBold" selectable>
          {user.email}
        </ThemedText>{' '}
        không đổi được.
      </AccountIntro>
      {renderForm()}
      <Button title="Huỷ" variant="ghost" onPress={onDone} style={styles.pill} />
    </View>
  );
}

const styles = StyleSheet.create({
  flow: { flex: 1, justifyContent: 'center', gap: Spacing.four },
  pill: { borderRadius: Radius.full },
});
