import { useState } from 'react';
import { Share, StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { ThemedText } from '@/components/ui/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { logger } from '@/lib/logger';

import { useCenterContact } from '../hooks/use-parent-dashboard';
import type { TuitionReceipt } from '../types';
import { buildReceiptShareMessage } from '../utils';

export type ReceiptActionsProps = {
  receipt: TuitionReceipt;
};

/** Nut duoi bien lai: gui noi dung bien lai qua ung dung khac bang bang chia se cua he dieu hanh. */
export function ReceiptActions({ receipt }: ReceiptActionsProps) {
  const [hasShareFailed, setHasShareFailed] = useState(false);
  const center = useCenterContact();

  const shareReceipt = async () => {
    setHasShareFailed(false);
    try {
      await Share.share({ message: buildReceiptShareMessage(receipt, center.name) });
    } catch (error) {
      logger.warn('Khong mo duoc bang chia se bien lai', error);
      setHasShareFailed(true);
    }
  };

  return (
    <View style={styles.container}>
      <Button
        title="Chia sẻ biên lai"
        // Ten truy cap mac dinh ghep ca ky tu cua icon voi chu tren nut
        accessibilityLabel="Chia sẻ biên lai"
        icon="share-social-outline"
        onPress={() => void shareReceipt()}
        style={styles.button}
      />
      {hasShareFailed ? (
        <ThemedText type="small" themeColor="danger" style={styles.error}>
          Không mở được bảng chia sẻ. Vui lòng thử lại.
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.two },
  button: { borderRadius: Radius.full },
  error: { textAlign: 'center' },
});
