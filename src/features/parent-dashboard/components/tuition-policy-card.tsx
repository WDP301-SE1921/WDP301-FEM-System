import { StyleSheet, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { ThemedText } from '@/components/ui/themed-text';
import { ThemedView } from '@/components/ui/themed-view';
import { Radius, Spacing } from '@/constants/theme';

import { ToneIcon } from './tone-icon';

const SUPPORT_ICON_SIZE = 18;

/** Quy dinh xac nhan hoc phi va noi lien he khi co thac mac, dat cuoi man hinh hoc phi. */
export function TuitionPolicyCard() {
  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      <View style={styles.policy}>
        <ToneIcon name="shield-checkmark" tone="primary" />
        <View style={styles.content}>
          <ThemedText type="smallBold">Quy định xác nhận học phí</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Học phí được đóng tại trung tâm. Ứng dụng chỉ hiển thị kết quả sau khi trung tâm xác
            nhận đã thu đủ.
          </ThemedText>
        </View>
      </View>

      <ThemedView style={styles.support}>
        <Icon name="headset-outline" size={SUPPORT_ICON_SIZE} themeColor="primary" />
        <ThemedText type="small" themeColor="textSecondary" style={styles.supportText}>
          Mọi thắc mắc về học phí, vui lòng liên hệ quầy lễ tân của trung tâm.
        </ThemedText>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: { gap: Spacing.three, padding: Spacing.three, borderRadius: Radius.lg },
  policy: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.three },
  content: { flex: 1, gap: Spacing.half },
  support: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.two,
    borderRadius: Radius.control,
  },
  supportText: { flex: 1 },
});
