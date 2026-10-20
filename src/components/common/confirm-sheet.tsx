import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { ThemedText } from '@/components/ui/themed-text';
import { Radius, Spacing } from '@/constants/theme';

import { BottomSheet } from './bottom-sheet';

export type ConfirmSheetProps = {
  isVisible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  /** Mac dinh: `Huỷ`. */
  cancelLabel?: string;
  /** `danger` cho thao tac nguoi dung de bam nham ma kho lam lai, vd dang xuat. */
  tone?: 'primary' | 'danger';
  /** Dang thuc hien thao tac: nut xac nhan quay va hai nut khong bam duoc nua. */
  isConfirming?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

/**
 * Hoi lai truoc thao tac khong hoan tac duoc (nop bai, dang xuat). Dung sheet cua app thay vi
 * `Alert` de chay ca tren web va theo theme.
 */
export function ConfirmSheet({
  isVisible,
  title,
  message,
  confirmLabel,
  cancelLabel = 'Huỷ',
  tone = 'primary',
  isConfirming = false,
  onConfirm,
  onCancel,
}: ConfirmSheetProps) {
  return (
    <BottomSheet isVisible={isVisible} title={title} onClose={onCancel}>
      <View style={styles.body}>
        <ThemedText type="default">{message}</ThemedText>
        <Button
          title={confirmLabel}
          variant={tone}
          loading={isConfirming}
          onPress={onConfirm}
          style={styles.pill}
        />
        <Button
          title={cancelLabel}
          variant="ghost"
          disabled={isConfirming}
          onPress={onCancel}
          style={styles.pill}
        />
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  body: { gap: Spacing.three, paddingTop: Spacing.three },
  pill: { borderRadius: Radius.full },
});
