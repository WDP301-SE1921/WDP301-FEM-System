import { Image } from 'expo-image';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { ThemedText } from '@/components/ui/themed-text';
import { ThemedView } from '@/components/ui/themed-view';
import { Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { User } from '@/types/auth';
import { getInitials } from '@/utils/format';
import { getSignedUrlCacheKey } from '@/utils/url';

import { useAvatar } from '../hooks/use-avatar';

import { AvatarSheet } from './avatar-sheet';

const AVATAR_SIZE = 56;
const BADGE_SIZE = 24;
const BADGE_ICON_SIZE = 14;
const BADGE_BORDER_WIDTH = 2;

export type AccountAvatarProps = {
  user: User;
};

/**
 * Anh dai dien cua tai khoan, chua co anh (hoac tai anh loi) thi la chu cai dau cua ten. Bam de doi
 * hoac go anh.
 */
export function AccountAvatar({ user }: AccountAvatarProps) {
  const theme = useTheme();
  const avatar = useAvatar(user);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const url = avatar.data?.url ?? null;
  const name = user.displayName ?? user.email;
  const canShowImage = url !== null && url !== failedUrl;

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={url ? 'Đổi ảnh đại diện' : 'Thêm ảnh đại diện'}
        onPress={() => setIsSheetOpen(true)}
        style={({ pressed }) => [styles.container, pressed && styles.pressed]}
      >
        {canShowImage ? (
          <Image
            source={{ uri: url, cacheKey: getSignedUrlCacheKey(url) }}
            style={styles.avatar}
            contentFit="cover"
            accessibilityLabel="Ảnh đại diện"
            onError={() => setFailedUrl(url)}
          />
        ) : (
          <ThemedView type="primary" style={[styles.avatar, styles.initials]}>
            <ThemedText type="heading" themeColor="primaryText">
              {getInitials(name)}
            </ThemedText>
          </ThemedView>
        )}
        <View
          style={[
            styles.badge,
            { backgroundColor: theme.backgroundElement, borderColor: theme.background },
          ]}
        >
          <Icon name="camera" size={BADGE_ICON_SIZE} themeColor="primary" />
        </View>
      </Pressable>

      <AvatarSheet
        isVisible={isSheetOpen}
        hasAvatar={url !== null}
        onClose={() => setIsSheetOpen(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: { width: AVATAR_SIZE, height: AVATAR_SIZE },
  pressed: { opacity: 0.75 },
  avatar: { width: AVATAR_SIZE, height: AVATAR_SIZE, borderRadius: Radius.full },
  initials: { alignItems: 'center', justifyContent: 'center' },
  badge: {
    position: 'absolute',
    right: -BADGE_BORDER_WIDTH,
    bottom: -BADGE_BORDER_WIDTH,
    width: BADGE_SIZE,
    height: BADGE_SIZE,
    borderRadius: Radius.full,
    borderWidth: BADGE_BORDER_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
