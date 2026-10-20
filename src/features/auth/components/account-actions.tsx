import { Pressable, StyleSheet, View } from 'react-native';

import { Icon, type IconName } from '@/components/ui/icon';
import { ThemedText } from '@/components/ui/themed-text';
import { ThemedView } from '@/components/ui/themed-view';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const ICON_BOX_SIZE = 40;
const ICON_SIZE = 20;
const CHEVRON_SIZE = 18;

export type AccountActionsProps = {
  onEditProfile: () => void;
  onChangePassword: () => void;
};

/** Cac thao tac voi tai khoan o man Tai khoan: sua thong tin lien he, doi mat khau. */
export function AccountActions({ onEditProfile, onChangePassword }: AccountActionsProps) {
  return (
    <View style={styles.list}>
      <ActionRow
        icon="person-circle-outline"
        title="Thông tin tài khoản"
        description="Họ tên và số điện thoại liên hệ"
        onPress={onEditProfile}
      />
      <ActionRow
        icon="lock-closed-outline"
        title="Đổi mật khẩu"
        description="Đặt mật khẩu mới cho tài khoản"
        onPress={onChangePassword}
      />
    </View>
  );
}

type ActionRowProps = {
  icon: IconName;
  title: string;
  description: string;
  onPress: () => void;
};

function ActionRow({ icon, title, description, onPress }: ActionRowProps) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={description}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: theme.backgroundElement, borderColor: theme.border },
        pressed && styles.pressed,
      ]}
    >
      <ThemedView type="primarySoft" style={styles.iconBox}>
        <Icon name={icon} size={ICON_SIZE} themeColor="primary" />
      </ThemedView>
      <View style={styles.info}>
        <ThemedText type="default" style={styles.title}>
          {title}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {description}
        </ThemedText>
      </View>
      <Icon name="chevron-forward" size={CHEVRON_SIZE} themeColor="textSecondary" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  list: { gap: Spacing.two },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderWidth: 1,
    borderRadius: Radius.lg,
  },
  pressed: { opacity: 0.75 },
  iconBox: {
    width: ICON_BOX_SIZE,
    height: ICON_BOX_SIZE,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { flex: 1, gap: Spacing.half },
  title: { fontWeight: 700 },
});
