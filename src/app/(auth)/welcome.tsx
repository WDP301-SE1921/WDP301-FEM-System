import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Screen } from '@/components/common/screen';
import { Button } from '@/components/ui/button';
import { ThemedText } from '@/components/ui/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { BrandHeader, ValueProposition, WelcomeHero } from '@/features/onboarding';

/** Man hinh chao cho nguoi chua dang nhap: tao tai khoan hoac dang nhap. */
export default function WelcomeScreen() {
  return (
    <Screen contentStyle={styles.content}>
      <BrandHeader />
      <WelcomeHero />
      <ValueProposition />

      <View style={styles.actions}>
        <Button
          title="Tạo tài khoản"
          icon="person-add-outline"
          trailingIcon="arrow-forward"
          style={styles.pill}
          onPress={() => router.push('/(auth)/register')}
        />
        <Button
          title="Đăng nhập"
          variant="ghost"
          icon="log-in-outline"
          style={styles.pill}
          onPress={() => router.push('/(auth)/login')}
        />
        <ThemedText type="small" themeColor="textSecondary" style={styles.footer}>
          Dành cho Phụ huynh & Giáo viên EduGrade
        </ThemedText>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: Spacing.four },
  actions: { marginTop: 'auto', gap: Spacing.three },
  pill: { borderRadius: Radius.full },
  footer: { textAlign: 'center' },
});
