import { useState } from 'react';
import { Linking, StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { ThemedText } from '@/components/ui/themed-text';
import { ThemedView } from '@/components/ui/themed-view';
import { Config } from '@/constants/config';
import { Radius, Spacing } from '@/constants/theme';
import { logger } from '@/lib/logger';

import { ToneIcon } from './tone-icon';

const SUPPORT_ICON_SIZE = 18;
/** Giu chu so va dau `+` cua so dien thoai cho link `tel:`. */
const NON_DIAL_CHARACTERS = /[^\d+]/g;

/**
 * Quy dinh xac nhan hoc phi va noi lien he khi co thac mac, dat cuoi man hinh hoc phi. Co so dien thoai
 * trung tam (`EXPO_PUBLIC_CENTER_PHONE`, BE chua tra) thi them nut goi.
 */
export function TuitionPolicyCard() {
  const phone = Config.centerPhone;

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
          {phone ? (
            <>
              Mọi thắc mắc về học phí, vui lòng gọi trung tâm số{' '}
              <ThemedText type="smallBold" selectable>
                {phone}
              </ThemedText>{' '}
              hoặc hỏi quầy lễ tân.
            </>
          ) : (
            'Mọi thắc mắc về học phí, vui lòng liên hệ quầy lễ tân của trung tâm.'
          )}
        </ThemedText>
      </ThemedView>

      {phone ? <CallCenterButton phone={phone} /> : null}
    </ThemedView>
  );
}

function CallCenterButton({ phone }: { phone: string }) {
  const [hasCallFailed, setHasCallFailed] = useState(false);

  const call = async () => {
    setHasCallFailed(false);
    try {
      await Linking.openURL(`tel:${phone.replace(NON_DIAL_CHARACTERS, '')}`);
    } catch (error) {
      // May tinh bang, gia lap khong goi duoc: so van hien o tren de phu huynh tu goi
      logger.warn('Khong mo duoc cuoc goi toi trung tam', error);
      setHasCallFailed(true);
    }
  };

  return (
    <>
      <Button
        title="Gọi trung tâm"
        variant="secondary"
        icon="call-outline"
        accessibilityLabel={`Gọi trung tâm, số ${phone}`}
        onPress={() => void call()}
        style={styles.pill}
      />
      {hasCallFailed ? (
        <ThemedText type="small" themeColor="danger" accessibilityRole="alert">
          Máy này không gọi được. Vui lòng gọi số {phone} bằng điện thoại khác.
        </ThemedText>
      ) : null}
    </>
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
  pill: { borderRadius: Radius.full },
});
