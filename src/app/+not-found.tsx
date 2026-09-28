import { Link } from 'expo-router';
import { StyleSheet } from 'react-native';

import { Screen } from '@/components/common/screen';
import { ThemedText } from '@/components/ui/themed-text';
import { Spacing } from '@/constants/theme';

export default function NotFoundScreen() {
  return (
    <Screen scrollable={false} contentStyle={styles.container}>
      <ThemedText type="subtitle">Không tìm thấy trang này.</ThemedText>
      <Link href="/" style={styles.link}>
        <ThemedText type="linkPrimary">Về trang chủ</ThemedText>
      </Link>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center' },
  link: { marginTop: Spacing.three, paddingVertical: Spacing.three },
});
