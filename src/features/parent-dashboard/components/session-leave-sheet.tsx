import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';

import { BottomSheet } from '@/components/common/bottom-sheet';
import { FormError } from '@/components/common/form-error';
import { FormInput } from '@/components/common/form-input';
import { Button } from '@/components/ui/button';
import { ThemedText } from '@/components/ui/themed-text';
import { Radius, Spacing } from '@/constants/theme';

import { sessionLeaveSchema, type SessionLeaveValues } from '../schemas';

export type SessionLeaveSheetProps = {
  isVisible: boolean;
  /** Vd `Thứ Ba, 18/11 · 18:00` de phu huynh biet dang xin nghi buoi nao. */
  sessionLabel: string;
  isPending: boolean;
  error: unknown;
  onSubmit: (reason: string) => void;
  onClose: () => void;
};

/** Form xin nghi mot buoi trong sheet: ly do roi gui; viec goi API do container lo. */
export function SessionLeaveSheet({
  isVisible,
  sessionLabel,
  isPending,
  error,
  onSubmit,
  onClose,
}: SessionLeaveSheetProps) {
  const { control, handleSubmit } = useForm<SessionLeaveValues>({
    resolver: zodResolver(sessionLeaveSchema),
    defaultValues: { reason: '' },
  });
  const submit = () => handleSubmit(({ reason }) => onSubmit(reason))();

  return (
    <BottomSheet
      isVisible={isVisible}
      title="Xin nghỉ buổi học"
      subtitle={sessionLabel}
      onClose={onClose}
    >
      <View style={styles.body}>
        <ThemedText type="small" themeColor="textSecondary">
          Đơn được gửi tới trung tâm. Nhân viên duyệt rồi xếp buổi học bù nếu có buổi phù hợp.
        </ThemedText>
        <FormInput
          control={control}
          name="reason"
          label="Lý do xin nghỉ"
          placeholder="Vd: Con bị ốm, gia đình về quê"
          multiline
          numberOfLines={3}
          textAlignVertical="top"
          style={styles.reason}
        />
        <FormError error={error} />
        <Button
          title="Gửi đơn xin nghỉ"
          icon="send"
          loading={isPending}
          onPress={submit}
          style={styles.pill}
        />
        <Button
          title="Huỷ"
          variant="ghost"
          disabled={isPending}
          onPress={onClose}
          style={styles.pill}
        />
      </View>
    </BottomSheet>
  );
}

const REASON_MIN_HEIGHT = 96;

const styles = StyleSheet.create({
  body: { gap: Spacing.three, paddingTop: Spacing.three },
  reason: { minHeight: REASON_MIN_HEIGHT },
  pill: { borderRadius: Radius.full },
});
