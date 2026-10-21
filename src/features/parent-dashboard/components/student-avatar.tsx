import { StyleSheet, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { ThemedText } from '@/components/ui/themed-text';
import { Radius, type ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { getInitials } from '@/utils/format';

const AVATAR_SIZE = 56;
const RING_WIDTH = 2;
const RING_GAP = 2;
const CHECK_SIZE = 20;
const CHECK_ICON_SIZE = 12;
const CHECK_BORDER_WIDTH = 2;

/** Kich thuoc ngoai cung ke ca vien, de nut dat canh avatar (vd "Thêm con") bang kich thuoc. */
export const STUDENT_AVATAR_OUTER_SIZE = AVATAR_SIZE + 2 * (RING_WIDTH + RING_GAP);

type Appearance = { ring: ThemeColor; avatar: ThemeColor; initials: ThemeColor };

const APPEARANCES: Record<'selected' | 'idle', Appearance> = {
  selected: { ring: 'primary', avatar: 'primary', initials: 'primaryText' },
  idle: { ring: 'background', avatar: 'backgroundSelected', initials: 'textSecondary' },
};

export type StudentAvatarProps = {
  fullName: string;
  isSelected: boolean;
};

/** Avatar chu cai dau cua con. Con dang xem co vien va dau tich mau chinh. */
export function StudentAvatar({ fullName, isSelected }: StudentAvatarProps) {
  const theme = useTheme();
  const appearance = APPEARANCES[isSelected ? 'selected' : 'idle'];

  return (
    <View style={[styles.ring, { borderColor: theme[appearance.ring] }]}>
      <View style={[styles.avatar, { backgroundColor: theme[appearance.avatar] }]}>
        <ThemedText type="heading" themeColor={appearance.initials}>
          {getInitials(fullName)}
        </ThemedText>
      </View>
      {isSelected ? (
        <View
          style={[styles.check, { backgroundColor: theme.primary, borderColor: theme.background }]}
        >
          <Icon name="checkmark" size={CHECK_ICON_SIZE} themeColor="primaryText" />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  ring: { padding: RING_GAP, borderWidth: RING_WIDTH, borderRadius: Radius.full },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  check: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: CHECK_SIZE,
    height: CHECK_SIZE,
    borderRadius: Radius.full,
    borderWidth: CHECK_BORDER_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
