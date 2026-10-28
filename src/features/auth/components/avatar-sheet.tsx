import { ActivityIndicator, Linking, StyleSheet, View } from 'react-native';

import { BottomSheet } from '@/components/common/bottom-sheet';
import { FormError } from '@/components/common/form-error';
import { Button } from '@/components/ui/button';
import { ThemedText } from '@/components/ui/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { PickImageProblem } from '@/lib/image-picker';

import { AVATAR_PICK_PROBLEMS } from '../constants';
import { useRemoveAvatar, useUploadAvatar } from '../hooks/use-avatar';

export type AvatarSheetProps = {
  isVisible: boolean;
  /** Tai khoan dang co anh dai dien: hien them nut go anh. */
  hasAvatar: boolean;
  onClose: () => void;
};

/**
 * Doi anh dai dien: chup, chon anh co san hoac go anh. Sheet giu mo trong luc chon va luu anh de bao
 * loi ngay tai cho; luu xong thi tu dong.
 */
export function AvatarSheet({ isVisible, hasAvatar, onClose }: AvatarSheetProps) {
  const theme = useTheme();
  const upload = useUploadAvatar(onClose);
  const remove = useRemoveAvatar(onClose);
  const isBusy = upload.isUploading || remove.isPending;

  const close = () => {
    upload.reset();
    remove.reset();
    onClose();
  };

  return (
    <BottomSheet
      isVisible={isVisible}
      title="Ảnh đại diện"
      subtitle="Ảnh JPG hoặc PNG, tối đa 5 MB, được cắt vuông trước khi lưu."
      onClose={close}
    >
      <View style={styles.body}>
        <Button
          title="Chụp ảnh"
          variant="secondary"
          icon="camera-outline"
          accessibilityLabel="Chụp ảnh đại diện"
          disabled={isBusy}
          onPress={() => void upload.addImage('camera')}
          style={styles.pill}
        />
        <Button
          title="Chọn ảnh có sẵn"
          variant="secondary"
          icon="images-outline"
          accessibilityLabel="Chọn ảnh đại diện có sẵn"
          disabled={isBusy}
          onPress={() => void upload.addImage('library')}
          style={styles.pill}
        />
        {hasAvatar ? (
          <Button
            title="Gỡ ảnh đại diện"
            variant="ghost"
            icon="trash-outline"
            accessibilityLabel="Gỡ ảnh đại diện"
            loading={remove.isPending}
            disabled={isBusy}
            onPress={() => {
              upload.reset();
              remove.mutate();
            }}
            style={styles.pill}
          />
        ) : null}

        {upload.isUploading ? (
          <View accessibilityLiveRegion="polite" style={styles.status}>
            <ActivityIndicator color={theme.primary} />
            <ThemedText type="small" themeColor="textSecondary">
              Đang lưu ảnh đại diện…
            </ThemedText>
          </View>
        ) : null}
        {upload.problem ? <PickProblemNotice problem={upload.problem} /> : null}
        <FormError error={upload.error ?? remove.error} />
      </View>
    </BottomSheet>
  );
}

function PickProblemNotice({ problem }: { problem: PickImageProblem }) {
  return (
    <View style={styles.problem}>
      <ThemedText type="small" themeColor="danger" accessibilityRole="alert">
        {AVATAR_PICK_PROBLEMS[problem]}
      </ThemedText>
      {problem === 'PERMISSION_DENIED' ? (
        <Button
          title="Mở Cài đặt"
          variant="ghost"
          size="sm"
          icon="settings-outline"
          accessibilityLabel="Mở Cài đặt"
          onPress={() => void Linking.openSettings()}
          style={styles.settings}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  body: { gap: Spacing.two, paddingTop: Spacing.three },
  pill: { borderRadius: Radius.full },
  status: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  problem: { gap: Spacing.two },
  settings: { alignSelf: 'flex-start', borderRadius: Radius.full },
});
