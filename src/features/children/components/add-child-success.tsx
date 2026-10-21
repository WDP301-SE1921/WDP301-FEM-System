import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { ThemedText } from '@/components/ui/themed-text';
import { ThemedView } from '@/components/ui/themed-view';
import { Radius, Spacing } from '@/constants/theme';

import { EnrollmentSteps } from './enrollment-steps';

const ILLUSTRATION_SIZE = 80;
const ICON_SIZE = 40;
const TEXT_MAX_WIDTH = 320;

export type AddChildSuccessProps = {
  childName: string;
  grade: number;
  parentEmail: string;
  onDone: () => void;
};

/**
 * Bao tao ho so con thanh cong va chi buoc tiep theo: ho so moi chua co mon hoc cho toi khi phu
 * huynh dang ky tai trung tam.
 */
export function AddChildSuccess({ childName, grade, parentEmail, onDone }: AddChildSuccessProps) {
  return (
    <View style={styles.container}>
      <View style={styles.message}>
        <ThemedView type="successSoft" style={styles.illustration}>
          <Icon name="checkmark-circle" size={ICON_SIZE} themeColor="success" />
        </ThemedView>
        <ThemedText type="heading" accessibilityRole="header" style={styles.center}>
          Đã thêm con vào tài khoản
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={[styles.center, styles.text]}>
          Hồ sơ của {childName} đã được tạo. Con chưa có môn học cho tới khi bạn đăng ký tại trung
          tâm.
        </ThemedText>
      </View>

      <EnrollmentSteps childName={childName} grade={grade} parentEmail={parentEmail} />

      <Button title="Về trang chủ" icon="home-outline" onPress={onDone} style={styles.pill} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', gap: Spacing.four },
  message: { alignItems: 'center', gap: Spacing.two },
  illustration: {
    width: ILLUSTRATION_SIZE,
    height: ILLUSTRATION_SIZE,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.two,
  },
  center: { textAlign: 'center' },
  text: { maxWidth: TEXT_MAX_WIDTH },
  pill: { borderRadius: Radius.full },
});
