import { Image, type ImageContentFit } from 'expo-image';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, type ImageStyle, type StyleProp } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { ThemedText } from '@/components/ui/themed-text';
import { ThemedView } from '@/components/ui/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { getSignedUrlCacheKey } from '@/utils/url';

import { useFilePreview } from '../hooks/use-parent-dashboard';

const FALLBACK_ICON_SIZE = 28;

export type SubmittedImageProps = {
  fileId: string;
  accessibilityLabel: string;
  /** Khung anh: kich thuoc, bo goc. Dung chung cho anh, luc dang tai va luc loi. */
  style: StyleProp<ImageStyle>;
  /** `cover` cho anh nho, `contain` khi xem tron anh. */
  contentFit?: ImageContentFit;
};

/**
 * Anh bai lam da nop, tai tu BE theo id. Link BE ky co han nen anh duoc cache theo duong dan anh, khong
 * theo ca link; link het han hoac tep khong phai anh (PDF) thi hien khung bao khong tai duoc.
 */
export function SubmittedImage({
  fileId,
  accessibilityLabel,
  style,
  contentFit = 'cover',
}: SubmittedImageProps) {
  const theme = useTheme();
  const preview = useFilePreview(fileId);
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const url = preview.data?.url;

  if (preview.isPending) {
    return (
      <ThemedView
        type="background"
        accessible
        accessibilityLabel={`${accessibilityLabel}, đang tải`}
        style={[style, styles.center, { borderColor: theme.border }]}
      >
        <ActivityIndicator color={theme.primary} />
      </ThemedView>
    );
  }

  if (!url || url === failedUrl) {
    return (
      <ThemedView
        type="background"
        accessible
        accessibilityLabel={`${accessibilityLabel}, không tải được ảnh`}
        style={[style, styles.center, styles.fallback, { borderColor: theme.border }]}
      >
        <Icon name="image-outline" size={FALLBACK_ICON_SIZE} themeColor="textSecondary" />
        <ThemedText type="small" themeColor="textSecondary" style={styles.fallbackText}>
          Không tải được ảnh
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <Image
      source={{ uri: url, cacheKey: getSignedUrlCacheKey(url) }}
      style={style}
      contentFit={contentFit}
      accessibilityLabel={accessibilityLabel}
      onError={() => setFailedUrl(url)}
    />
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  fallback: { gap: Spacing.half, padding: Spacing.one },
  fallbackText: { textAlign: 'center' },
});
